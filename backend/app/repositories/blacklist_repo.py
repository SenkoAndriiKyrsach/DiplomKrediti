from app.db import get_connection


def is_blacklisted(customer_id: int) -> bool:
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT blacklist_id FROM blacklist
        WHERE customer_id = %s AND removed_at IS NULL
        LIMIT 1;
    """, (customer_id,))
    return cur.fetchone() is not None


def get_blacklist():
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT
            b.blacklist_id,
            b.customer_id,
            c.full_name,
            c.login,
            b.reason,
            b.added_at
        FROM blacklist b
        JOIN customer c ON c.customer_id = b.customer_id
        WHERE b.removed_at IS NULL
        ORDER BY b.added_at DESC;
    """)
    rows = cur.fetchall()
    return [
        {
            "blacklist_id": r[0],
            "customer_id": r[1],
            "full_name": r[2],
            "login": r[3],
            "reason": r[4],
            "added_at": r[5],
        }
        for r in rows
    ]


def add_to_blacklist(customer_id: int, reason: str, manager_id: int = None):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO blacklist (customer_id, reason, added_by_manager_id)
        VALUES (%s, %s, %s)
        RETURNING blacklist_id;
    """, (customer_id, reason, manager_id))
    blacklist_id = cur.fetchone()[0]
    conn.commit()
    return {"blacklist_id": blacklist_id}


def remove_from_blacklist(blacklist_id: int):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        UPDATE blacklist SET removed_at = NOW()
        WHERE blacklist_id = %s;
    """, (blacklist_id,))
    conn.commit()
    return {"status": "removed"}


def search_customers_for_blacklist(query: str):
    """Пошук клієнтів для додавання в чорний список."""
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT customer_id, full_name, login
        FROM customer
        WHERE LOWER(full_name) LIKE %s OR LOWER(login) LIKE %s
        LIMIT 20;
    """, (f"%{query.lower()}%", f"%{query.lower()}%"))
    rows = cur.fetchall()
    return [
        {"customer_id": r[0], "full_name": r[1], "login": r[2]}
        for r in rows
    ]
