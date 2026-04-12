from app.db import get_connection

def get_citizenships():
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT citizenship_id, citizenship_name
        FROM citizenship_dict
        ORDER BY citizenship_id
    """)

    rows = cur.fetchall()
    conn.close()

    return [
        {"id": r[0], "name": r[1]} for r in rows
    ]


def get_employment_types():
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT employment_type_id, employment_type_name
        FROM employment_type_dict
        ORDER BY employment_type_id
    """)

    rows = cur.fetchall()
    conn.close()

    return [
        {"id": r[0], "name": r[1]} for r in rows
    ]
