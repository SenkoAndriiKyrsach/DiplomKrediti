from app.db import get_connection
from datetime import date, timedelta
from dateutil.relativedelta import relativedelta
from app.repositories.log_repo import write_log
from app.repositories.manager_user_repo import get_manager_by_id
from app.repositories.blacklist_repo import get_customer_name
from app.services.credit_calculator import (
    calculate_monthly_payment,
    generate_payment_schedule,
    next_month_first_day
)


def get_applications_by_status(status_id: int):
    conn = get_connection()
    cur = conn.cursor()

    if status_id == 6:
        cur.execute("""
            SELECT
                a.application_id,
                a.amount_requested,
                a.term_months,
                a.created_at,
                c.full_name,
                s.status_name
            FROM application a
            JOIN customer c ON c.customer_id = a.customer_id
            JOIN application_status s ON s.status_id = a.status_id
            WHERE a.status_id IN (2, 6)
            ORDER BY a.created_at DESC
        """)
    else:
        cur.execute("""
            SELECT
                a.application_id,
                a.amount_requested,
                a.term_months,
                a.created_at,
                c.full_name,
                s.status_name
            FROM application a
            JOIN customer c ON c.customer_id = a.customer_id
            JOIN application_status s ON s.status_id = a.status_id
            WHERE a.status_id = %s
            ORDER BY a.created_at DESC
        """, (status_id,))

    rows = cur.fetchall()
    return {
        "applications": [
            {
                "application_id": r[0],
                "amount_requested": float(r[1]),
                "term_months": r[2],
                "created_at": r[3],
                "full_name": r[4],
                "status_name": r[5],
            }
            for r in rows
        ]
    }


def get_all_active_credits():
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT
            cr.credit_id,
            cr.amount_approved,
            cr.interest_rate,
            cr.monthly_payment,
            cr.start_date,
            cr.end_date,
            a.application_id,
            c.full_name,
            c.login,
            COALESCE(SUM(CASE WHEN ps.is_paid = FALSE THEN ps.payment_amount + ps.penalty_amount ELSE 0 END), 0) AS remaining_balance,
            MIN(ps.payment_date) FILTER (WHERE ps.is_paid = FALSE) AS next_payment_date,
            COUNT(CASE WHEN ps.is_paid = FALSE AND ps.payment_date < CURRENT_DATE THEN 1 END) AS overdue_count
        FROM credit cr
        JOIN application a ON a.application_id = cr.application_id
        JOIN customer c ON c.customer_id = a.customer_id
        LEFT JOIN payment_schedule ps ON ps.credit_id = cr.credit_id
        WHERE cr.end_date >= CURRENT_DATE
        GROUP BY cr.credit_id, cr.amount_approved, cr.interest_rate, cr.monthly_payment,
                 cr.start_date, cr.end_date, a.application_id, c.full_name, c.login
        ORDER BY cr.start_date DESC;
    """)
    rows = cur.fetchall()
    return {
        "credits": [
            {
                "credit_id": r[0],
                "amount_approved": float(r[1]),
                "interest_rate": float(r[2]),
                "monthly_payment": float(r[3]),
                "start_date": r[4],
                "end_date": r[5],
                "application_id": r[6],
                "full_name": r[7],
                "login": r[8],
                "remaining_balance": float(r[9]),
                "next_payment_date": r[10],
                "overdue_count": r[11],
            }
            for r in rows
        ]
    }


def create_manager_decision(application_id: int, data):
    conn = get_connection()
    cur = conn.cursor()

    # 1. Зберігаємо рішення
    cur.execute("""
        INSERT INTO manager_decision
            (application_id, manager_id, final_decision, comment, corrected_amount, corrected_term)
        VALUES (%s, %s, %s, %s, %s, %s)
        RETURNING decision_id;
    """, (
        application_id,
        data.manager_id,
        data.final_decision,
        data.comment,
        data.corrected_amount,
        data.corrected_term,
    ))
    decision_id = cur.fetchone()[0]

    # 2. Отримуємо заявку
    cur.execute("""
        SELECT customer_id, amount_requested, term_months, product_id, down_payment_amount
        FROM application
        WHERE application_id = %s
    """, (application_id,))
    row = cur.fetchone()
    customer_id, amount, term, product_id, down_payment = row

    # 3. Отримуємо ставку з кредитного продукту заявки
    if product_id:
        cur.execute("SELECT interest_rate FROM credit_product WHERE product_id = %s", (product_id,))
    else:
        cur.execute("SELECT interest_rate FROM credit_product WHERE is_active = TRUE LIMIT 1")
    interest_rate = cur.fetchone()[0]

    # Враховуємо виправлені значення та перший внесок
    amount = data.corrected_amount or amount
    term = data.corrected_term or term
    net_amount = float(amount) - float(down_payment or 0)

    # Якщо відмова
    if data.final_decision != "approved":
        cur.execute(
            "UPDATE application SET status_id = 6 WHERE application_id = %s",
            (application_id,)
        )
        conn.commit()
        mgr      = get_manager_by_id(data.manager_id)
        customer = get_customer_name(customer_id)
        m_label  = mgr["login"] if mgr else f"#{data.manager_id}"
        c_label  = f"'{customer['login']}' ({customer['full_name']})" if customer else f"#{customer_id}"
        write_log("status_change",
                  f"Заявку #{application_id} клієнта {c_label} відхилено. Коментар: {data.comment or '—'}",
                  actor=f"Менеджер '{m_label}'", entity_id=application_id)
        return {"decision_id": decision_id, "new_status": 6}

    # 4. Розрахунок платежу
    monthly_payment = calculate_monthly_payment(net_amount, term, float(interest_rate))

    start_date = next_month_first_day()
    end_date = start_date + relativedelta(months=term)

    # 5. Створюємо кредит
    cur.execute("""
        INSERT INTO credit (application_id, amount_approved, interest_rate,
                            monthly_payment, start_date, end_date)
        VALUES (%s, %s, %s, %s, %s, %s)
        RETURNING credit_id;
    """, (application_id, net_amount, interest_rate, monthly_payment, start_date, end_date))
    credit_id = cur.fetchone()[0]

    # 6. Генеруємо графік платежів
    schedule = generate_payment_schedule(net_amount, term, float(interest_rate))
    for item in schedule:
        cur.execute("""
            INSERT INTO payment_schedule (credit_id, payment_date, payment_amount)
            VALUES (%s, %s, %s)
        """, (credit_id, item["payment_date"], item["amount"]))

    # 7. Оновлюємо статус
    cur.execute(
        "UPDATE application SET status_id = 5 WHERE application_id = %s",
        (application_id,)
    )
    conn.commit()

    mgr      = get_manager_by_id(data.manager_id)
    customer = get_customer_name(customer_id)
    m_label  = mgr["login"] if mgr else f"#{data.manager_id}"
    c_label  = f"'{customer['login']}' ({customer['full_name']})" if customer else f"#{customer_id}"
    write_log("status_change",
              f"Заявку #{application_id} клієнта {c_label} схвалено. "
              f"Кредит #{credit_id}, сума {net_amount:.0f} грн, {term} міс., платіж {monthly_payment:.0f} грн/міс.",
              actor=f"Менеджер '{m_label}'", entity_id=application_id)

    return {
        "decision_id": decision_id,
        "credit_id": credit_id,
        "monthly_payment": monthly_payment,
        "new_status": 5,
    }
