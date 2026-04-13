from datetime import date
from app.settings import get_penalty_settings


def apply_penalties_for_credit(credit_id: int, cur):
    """
    Нараховує/перераховує штрафи для всіх прострочених неоплачених платежів.
    Ідемпотентно — перераховує якщо сума змінилась.
    Викликається при кожному завантаженні графіку платежів.
    """
    s = get_penalty_settings()
    daily_rate  = s["daily_rate"]
    grace_days  = s["grace_days"]

    today = date.today()

    cur.execute("""
        SELECT payment_id, payment_date, payment_amount, penalty_amount
        FROM payment_schedule
        WHERE credit_id = %s
          AND is_paid = FALSE
          AND payment_date < %s;
    """, (credit_id, today))

    for payment_id, payment_date, payment_amount, existing_penalty in cur.fetchall():
        days_overdue = (today - payment_date).days - grace_days
        if days_overdue <= 0:
            continue

        # daily_rate зберігається у % (напр. 0.1 = 0.1%), ділимо на 100
        new_penalty = round(float(payment_amount) * (daily_rate / 100) * days_overdue, 2)

        if abs(new_penalty - float(existing_penalty)) > 0.01:
            cur.execute("""
                UPDATE payment_schedule
                SET penalty_amount = %s
                WHERE payment_id = %s;
            """, (new_penalty, payment_id))


def update_internal_credit_history(customer_id: int, cur):
    """Оновлює запис БКІ після нарахування штрафів."""
    cur.execute("""
        SELECT
            COUNT(*) FILTER (
                WHERE ps.is_paid = FALSE AND ps.payment_date < CURRENT_DATE
            ) AS overdue_count,
            COALESCE(MAX(
                (CURRENT_DATE - ps.payment_date)::int
            ) FILTER (
                WHERE ps.is_paid = FALSE AND ps.payment_date < CURRENT_DATE
            ), 0) AS max_overdue_days
        FROM payment_schedule ps
        JOIN credit c ON c.credit_id = ps.credit_id
        JOIN application a ON a.application_id = c.application_id
        WHERE a.customer_id = %s;
    """, (customer_id,))

    row = cur.fetchone()
    if not row:
        return
    overdue_count, max_overdue_days = row

    cur.execute("""
        SELECT report_id FROM credit_history_report
        WHERE customer_id = %s ORDER BY report_id DESC LIMIT 1;
    """, (customer_id,))
    existing = cur.fetchone()

    if existing:
        cur.execute("""
            UPDATE credit_history_report
            SET overdue_loans = %s, max_overdue_days = %s, report_date = CURRENT_DATE
            WHERE report_id = %s;
        """, (overdue_count, max_overdue_days, existing[0]))
    else:
        cur.execute("""
            INSERT INTO credit_history_report
                (customer_id, report_date, total_loans, overdue_loans, max_overdue_days, external_score)
            VALUES (%s, CURRENT_DATE, 0, %s, %s, 0);
        """, (customer_id, overdue_count, max_overdue_days))
