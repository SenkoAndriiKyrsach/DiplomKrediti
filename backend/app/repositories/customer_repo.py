from app.db import get_connection


# --------------------------------------------------------
# GET CUSTOMER BY LOGIN (для auth)
# --------------------------------------------------------
def get_customer_by_login(login: str):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT customer_id, login, password_hash
        FROM customer
        WHERE login = %s;
    """, (login,))
    row = cur.fetchone()
    if not row:
        return None
    return {"customer_id": row[0], "login": row[1], "password_hash": row[2]}


# --------------------------------------------------------
# CREATE CUSTOMER (реєстрація)
# --------------------------------------------------------
def create_customer(login: str, password_hash: str, full_name: str):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO customer
            (login, password_hash, full_name, birth_date, citizenship, monthly_income,
             employment_type_id, employment_term_months)
        VALUES (%s, %s, %s, '1990-01-01', 1, 0, 1, 0)
        RETURNING customer_id;
    """, (login, password_hash, full_name))
    new_id = cur.fetchone()[0]
    conn.commit()
    return {"customer_id": new_id, "login": login}


# --------------------------------------------------------
# GET CUSTOMER PROFILE
# --------------------------------------------------------
def get_customer_profile(customer_id: int):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT
            customer_id,
            login,
            full_name,
            birth_date,
            citizenship,
            monthly_income,
            employment_type_id,
            employment_term_months
        FROM customer
        WHERE customer_id = %s;
    """, (customer_id,))
    row = cur.fetchone()
    if not row:
        return {"error": "Customer not found"}
    return {
        "customer_id": row[0],
        "login": row[1],
        "full_name": row[2],
        "birth_date": row[3],
        "citizenship": row[4],
        "monthly_income": row[5],
        "employment_type_id": row[6],
        "employment_term_months": row[7]
    }


# --------------------------------------------------------
# UPDATE CUSTOMER PROFILE
# --------------------------------------------------------
def update_customer_profile(customer_id: int, data: dict):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        UPDATE customer SET
            full_name = %s,
            birth_date = %s,
            citizenship = %s,
            monthly_income = %s,
            employment_type_id = %s,
            employment_term_months = %s
        WHERE customer_id = %s;
    """, (
        data["full_name"],
        data["birth_date"],
        data["citizenship"],
        data["monthly_income"],
        data["employment_type_id"],
        data["employment_term_months"],
        customer_id
    ))
    conn.commit()
    return {"status": "updated"}


# --------------------------------------------------------
# MAX LOAN CALCULATION
# --------------------------------------------------------
def get_max_loan_info(customer_id: int):
    """Повертає дохід та суму поточних щомісячних зобов'язань."""
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT monthly_income FROM customer WHERE customer_id = %s;
    """, (customer_id,))
    row = cur.fetchone()
    if not row:
        return {"error": "Customer not found"}

    monthly_income = float(row[0] or 0)

    # Сума активних щомісячних платежів
    cur.execute("""
        SELECT COALESCE(SUM(c.monthly_payment), 0)
        FROM credit c
        JOIN application a ON a.application_id = c.application_id
        WHERE a.customer_id = %s
          AND c.end_date >= CURRENT_DATE;
    """, (customer_id,))
    existing_obligations = float(cur.fetchone()[0] or 0)

    # Максимально допустимий щомісячний платіж (DTI 40%)
    max_monthly_payment = max(0, monthly_income * 0.4 - existing_obligations)

    return {
        "monthly_income": monthly_income,
        "existing_monthly_obligations": existing_obligations,
        "max_monthly_payment": round(max_monthly_payment, 2),
    }


# --------------------------------------------------------
# GET CUSTOMER APPLICATIONS
# --------------------------------------------------------
def get_customer_applications(customer_id: int):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT
            a.application_id,
            a.amount_requested,
            a.created_at,
            a.status_id,
            s.status_name
        FROM application a
        LEFT JOIN application_status s ON s.status_id = a.status_id
        WHERE a.customer_id = %s
        ORDER BY a.created_at DESC;
    """, (customer_id,))
    rows = cur.fetchall()
    return {
        "applications": [
            {
                "application_id": r[0],
                "amount_requested": r[1],
                "created_at": r[2],
                "status_id": r[3],
                "status_name": r[4]
            }
            for r in rows
        ]
    }


# --------------------------------------------------------
# GET CUSTOMER LOANS (з залишком боргу)
# --------------------------------------------------------
def get_customer_loans(customer_id: int):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT
            c.credit_id,
            c.amount_approved,
            c.interest_rate,
            c.monthly_payment,
            c.start_date,
            c.end_date,
            a.application_id,
            COALESCE(SUM(CASE WHEN ps.is_paid = FALSE THEN ps.payment_amount + ps.penalty_amount ELSE 0 END), 0) AS remaining_balance,
            COUNT(CASE WHEN ps.is_paid = FALSE THEN 1 END) AS payments_left
        FROM credit c
        INNER JOIN application a ON a.application_id = c.application_id
        LEFT JOIN payment_schedule ps ON ps.credit_id = c.credit_id
        WHERE a.customer_id = %s
        GROUP BY c.credit_id, c.amount_approved, c.interest_rate, c.monthly_payment,
                 c.start_date, c.end_date, a.application_id
        ORDER BY c.start_date DESC;
    """, (customer_id,))
    rows = cur.fetchall()
    return {
        "loans": [
            {
                "credit_id": r[0],
                "amount_approved": float(r[1]),
                "interest_rate": float(r[2]),
                "monthly_payment": float(r[3]),
                "start_date": r[4],
                "end_date": r[5],
                "application_id": r[6],
                "remaining_balance": float(r[7]),
                "payments_left": r[8],
            }
            for r in rows
        ]
    }


# --------------------------------------------------------
# LEGACY: get_or_create_customer (для зворотної сумісності)
# --------------------------------------------------------
def get_or_create_customer(login: str):
    existing = get_customer_by_login(login)
    if existing:
        return {"customer_id": existing["customer_id"], "login": login, "status": "existing"}
    customer = create_customer(login, None, login)
    return {"customer_id": customer["customer_id"], "login": login, "status": "created"}
