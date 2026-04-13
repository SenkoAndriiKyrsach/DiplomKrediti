"""
Репозиторій для роботи з критеріями скорингу та їх діапазонами.
"""
from app.db import get_connection


def get_all_criteria():
    """Повертає всі активні критерії з їх діапазонами."""
    conn = get_connection()
    cur  = conn.cursor()
    cur.execute("""
        SELECT id, key, name, weight, sort_order
        FROM   scoring_criterion
        WHERE  is_active = TRUE
        ORDER  BY sort_order
    """)
    criteria = []
    for cid, key, name, weight, sort_order in cur.fetchall():
        cur.execute("""
            SELECT id, label, range_min, range_max, score_value
            FROM   scoring_range
            WHERE  criterion_id = %s
            ORDER  BY COALESCE(range_min, -999999)
        """, (cid,))
        ranges = [
            {"id": r[0], "label": r[1],
             "range_min": float(r[2]) if r[2] is not None else None,
             "range_max": float(r[3]) if r[3] is not None else None,
             "score_value": float(r[4])}
            for r in cur.fetchall()
        ]
        criteria.append({
            "id": cid, "key": key, "name": name,
            "weight": float(weight), "sort_order": sort_order,
            "ranges": ranges
        })
    return criteria


def update_criterion_weight(criterion_id: int, weight: float):
    conn = get_connection()
    cur  = conn.cursor()
    cur.execute(
        "UPDATE scoring_criterion SET weight=%s WHERE id=%s",
        (weight, criterion_id)
    )
    conn.commit()


def update_range_value(range_id: int, score_value: float):
    conn = get_connection()
    cur  = conn.cursor()
    cur.execute(
        "UPDATE scoring_range SET score_value=%s WHERE id=%s",
        (score_value, range_id)
    )
    conn.commit()


def save_criteria_batch(updates: list):
    """
    updates = [
      {"type": "criterion", "id": 1, "weight": 0.3},
      {"type": "range",     "id": 5, "score_value": 400},
      ...
    ]
    """
    conn = get_connection()
    cur  = conn.cursor()
    for u in updates:
        if u["type"] == "criterion":
            cur.execute(
                "UPDATE scoring_criterion SET weight=%s WHERE id=%s",
                (u["weight"], u["id"])
            )
        elif u["type"] == "range":
            cur.execute(
                "UPDATE scoring_range SET score_value=%s WHERE id=%s",
                (u["score_value"], u["id"])
            )
    conn.commit()
    return len(updates)
