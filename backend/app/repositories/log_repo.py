from app.db import get_connection


def write_log(action_type: str, description: str, actor: str = "система", entity_id: int = None):
    """
    action_type: 'application' | 'status_change' | 'admin'
    Записує подію в system_log. Не кидає виняток — помилку тільки друкує.
    """
    try:
        conn = get_connection()
        cur  = conn.cursor()
        cur.execute("""
            INSERT INTO system_log (action_type, actor, description, entity_id)
            VALUES (%s, %s, %s, %s);
        """, (action_type, actor, description, entity_id))
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"[LOG ERROR] {e}")


def get_logs(limit: int = 200, action_type: str = None) -> list:
    conn = get_connection()
    cur  = conn.cursor()
    if action_type:
        cur.execute("""
            SELECT log_id, created_at, action_type, actor, description, entity_id
            FROM system_log
            WHERE action_type = %s
            ORDER BY created_at DESC
            LIMIT %s;
        """, (action_type, limit))
    else:
        cur.execute("""
            SELECT log_id, created_at, action_type, actor, description, entity_id
            FROM system_log
            ORDER BY created_at DESC
            LIMIT %s;
        """, (limit,))
    rows = cur.fetchall()
    conn.close()
    return [
        {
            "log_id":      r[0],
            "created_at":  r[1].isoformat() if r[1] else None,
            "action_type": r[2],
            "actor":       r[3],
            "description": r[4],
            "entity_id":   r[5],
        }
        for r in rows
    ]
