from app.db import get_connection
from datetime import datetime


def get_all_products():
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT product_id, product_name, description, interest_rate,
               min_term_months, max_term_months, min_amount, max_amount,
               down_payment_pct, target_group, is_active
        FROM credit_product
        WHERE deleted_at IS NULL AND is_active = TRUE
        ORDER BY product_id;
    """)
    rows = cur.fetchall()
    return [_row_to_dict(r) for r in rows]


def get_all_products_manager():
    """Для менеджера — всі продукти, включаючи неактивні."""
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT product_id, product_name, description, interest_rate,
               min_term_months, max_term_months, min_amount, max_amount,
               down_payment_pct, target_group, is_active
        FROM credit_product
        WHERE deleted_at IS NULL
        ORDER BY is_active DESC, product_id;
    """)
    rows = cur.fetchall()
    return [_row_to_dict(r) for r in rows]


def get_product_by_id(product_id: int):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT product_id, product_name, description, interest_rate,
               min_term_months, max_term_months, min_amount, max_amount,
               down_payment_pct, target_group, is_active
        FROM credit_product
        WHERE product_id = %s AND deleted_at IS NULL;
    """, (product_id,))
    row = cur.fetchone()
    if not row:
        return None
    return _row_to_dict(row)


def get_product():
    """Backward-compat: повертає перший активний продукт."""
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT product_id, product_name, description, interest_rate,
               min_term_months, max_term_months, min_amount, max_amount,
               down_payment_pct, target_group, is_active
        FROM credit_product
        WHERE deleted_at IS NULL AND is_active = TRUE
        LIMIT 1;
    """)
    row = cur.fetchone()
    if not row:
        return None
    return _row_to_dict(row)


def create_product(data):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO credit_product
            (product_name, description, interest_rate, min_term_months, max_term_months,
             min_amount, max_amount, down_payment_pct, target_group, is_active, updated_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, TRUE, %s)
        RETURNING product_id;
    """, (
        data.product_name,
        data.description,
        data.interest_rate,
        data.min_term,
        data.max_term,
        data.min_amount,
        data.max_amount,
        data.down_payment_pct,
        data.target_group,
        datetime.now(),
    ))
    product_id = cur.fetchone()[0]
    conn.commit()
    return {"product_id": product_id, "status": "created"}


def update_product(product_id: int, data):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        UPDATE credit_product
        SET product_name = %s,
            description = %s,
            interest_rate = %s,
            min_term_months = %s,
            max_term_months = %s,
            min_amount = %s,
            max_amount = %s,
            down_payment_pct = %s,
            target_group = %s,
            is_active = %s,
            updated_at = %s
        WHERE product_id = %s;
    """, (
        data.product_name,
        data.description,
        data.interest_rate,
        data.min_term,
        data.max_term,
        data.min_amount,
        data.max_amount,
        data.down_payment_pct,
        data.target_group,
        data.is_active,
        datetime.now(),
        product_id,
    ))
    conn.commit()
    return {"status": "updated"}


def deactivate_product(product_id: int):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        UPDATE credit_product SET is_active = FALSE, updated_at = %s
        WHERE product_id = %s;
    """, (datetime.now(), product_id))
    conn.commit()
    return {"status": "deactivated"}


def _row_to_dict(row):
    return {
        "product_id": row[0],
        "product_name": row[1],
        "description": row[2],
        "interest_rate": float(row[3]),
        "min_term": row[4],
        "max_term": row[5],
        "min_amount": row[6],
        "max_amount": row[7],
        "down_payment_pct": float(row[8]),
        "target_group": row[9],
        "is_active": row[10],
    }
