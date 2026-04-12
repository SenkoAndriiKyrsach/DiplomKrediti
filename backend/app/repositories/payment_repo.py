from app.db import get_connection
from app.services.penalty_service import apply_penalties_for_credit, update_internal_credit_history


def get_payment_schedule_by_application(application_id: int):
    conn = get_connection()
    cur = conn.cursor()

    # Знаходимо кредит
    cur.execute("""
        SELECT cr.credit_id, a.customer_id
        FROM credit cr
        JOIN application a ON a.application_id = cr.application_id
        WHERE cr.application_id = %s
        LIMIT 1;
    """, (application_id,))
    row = cur.fetchone()
    if not row:
        return None

    credit_id, customer_id = row

    # Нараховуємо штрафи on-access
    apply_penalties_for_credit(credit_id, cur)
    update_internal_credit_history(customer_id, cur)

    # Отримуємо графік
    cur.execute("""
        SELECT payment_id, payment_date, payment_amount, is_paid, penalty_amount, penalty_paid
        FROM payment_schedule
        WHERE credit_id = %s
        ORDER BY payment_date ASC;
    """, (credit_id,))

    schedule = [
        {
            "payment_id": r[0],
            "payment_date": str(r[1]),
            "payment_amount": float(r[2]),
            "is_paid": r[3],
            "penalty_amount": float(r[4]),
            "penalty_paid": r[5],
        }
        for r in cur.fetchall()
    ]

    # Загальний залишок
    remaining = sum(
        (item["payment_amount"] + (item["penalty_amount"] if not item["penalty_paid"] else 0))
        for item in schedule
        if not item["is_paid"]
    )

    return {
        "application_id": application_id,
        "credit_id": credit_id,
        "schedule": schedule,
        "remaining_balance": round(remaining, 2),
    }


def get_schedule_row(payment_schedule_id: int):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT payment_id, credit_id, payment_amount, penalty_amount, penalty_paid, is_paid
        FROM payment_schedule
        WHERE payment_id = %s
    """, (payment_schedule_id,))
    row = cur.fetchone()
    if not row:
        return None
    return {
        "payment_id": row[0],
        "credit_id": row[1],
        "payment_amount": float(row[2]),
        "penalty_amount": float(row[3]),
        "penalty_paid": row[4],
        "is_paid": row[5],
    }


def mark_schedule_paid(payment_schedule_id: int):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        UPDATE payment_schedule
        SET is_paid = TRUE, paid_date = CURRENT_DATE
        WHERE payment_id = %s
    """, (payment_schedule_id,))
    conn.commit()


def mark_penalty_paid(payment_schedule_id: int):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        UPDATE payment_schedule
        SET penalty_paid = TRUE
        WHERE payment_id = %s
    """, (payment_schedule_id,))
    conn.commit()


def insert_payment_log(credit_id: int, amount, payment_date, status_id: int):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO payment (credit_id, payment_date, amount, status_id)
        VALUES (%s, %s, %s, %s)
        RETURNING payment_id;
    """, (credit_id, payment_date, amount, status_id))
    payment_id = cur.fetchone()[0]
    conn.commit()
    return payment_id
