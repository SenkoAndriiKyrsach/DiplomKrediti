"""
Репозиторій для адмінської статистики по заявках.
"""
from app.db import get_connection


def get_application_stats(
    period: str = "all",       # day | week | month | all
    manager_id: int = None,
    amount_min: float = None,
    amount_max: float = None,
):
    conn = get_connection()
    cur = conn.cursor()

    # ── будуємо фільтр за часом ───────────────────────────────────────────
    period_map = {
        "day":   "NOW() - INTERVAL '1 day'",
        "week":  "NOW() - INTERVAL '7 days'",
        "month": "NOW() - INTERVAL '30 days'",
    }
    time_filter = ""
    if period in period_map:
        time_filter = f"AND a.created_at >= {period_map[period]}"

    # ── фільтр по менеджеру (через manager_decision) ─────────────────────
    # Якщо вказано manager_id — показуємо заявки, по яким цей менеджер
    # приймав рішення. Заявки без рішення виключаємо.
    manager_join = "LEFT JOIN manager_decision md ON md.application_id = a.application_id"
    manager_filter = ""
    manager_params: list = []
    if manager_id is not None:
        manager_filter = "AND md.manager_id = %s"
        manager_params.append(manager_id)

    # ── фільтр по сумі ───────────────────────────────────────────────────
    amount_filters = ""
    if amount_min is not None:
        amount_filters += " AND a.amount_requested >= %s"
        manager_params.append(amount_min)
    if amount_max is not None:
        amount_filters += " AND a.amount_requested <= %s"
        manager_params.append(amount_max)

    # ── статистика по статусах ───────────────────────────────────────────
    cur.execute(f"""
        SELECT
            s.status_id,
            s.status_name,
            COUNT(DISTINCT a.application_id)       AS cnt,
            COALESCE(SUM(a.amount_requested), 0)   AS total_amount
        FROM application a
        JOIN application_status s ON s.status_id = a.status_id
        {manager_join}
        WHERE 1=1
          {time_filter}
          {manager_filter}
          {amount_filters}
        GROUP BY s.status_id, s.status_name
        ORDER BY s.status_id;
    """, manager_params)
    by_status = [
        {
            "status_id":    row[0],
            "status_name":  row[1],
            "count":        row[2],
            "total_amount": float(row[3]),
        }
        for row in cur.fetchall()
    ]

    # ── загальне по фільтру ───────────────────────────────────────────────
    cur.execute(f"""
        SELECT
            COUNT(DISTINCT a.application_id)       AS total,
            COALESCE(SUM(a.amount_requested), 0)   AS total_amount
        FROM application a
        {manager_join}
        WHERE 1=1
          {time_filter}
          {manager_filter}
          {amount_filters};
    """, manager_params)
    totals = cur.fetchone()
    total_count  = totals[0] if totals else 0
    total_amount = float(totals[1]) if totals else 0.0

    # ── динаміка по днях (останні N днів залежно від period) ────────────
    days_back = {"day": 1, "week": 7, "month": 30}.get(period, 30)
    cur.execute(f"""
        SELECT
            DATE(a.created_at AT TIME ZONE 'Europe/Kyiv')  AS day,
            COUNT(DISTINCT a.application_id)               AS cnt,
            COALESCE(SUM(a.amount_requested), 0)           AS amount
        FROM application a
        {manager_join}
        WHERE a.created_at >= NOW() - INTERVAL '{days_back} days'
          {manager_filter}
          {amount_filters}
        GROUP BY 1
        ORDER BY 1;
    """, manager_params)
    timeline = [
        {"date": str(row[0]), "count": row[1], "amount": float(row[2])}
        for row in cur.fetchall()
    ]

    # ── топ менеджерів (у межах фільтру часу / суми) ─────────────────────
    cur.execute(f"""
        SELECT
            mu.id,
            mu.full_name,
            mu.login,
            COUNT(DISTINCT md2.application_id) AS processed,
            COUNT(DISTINCT CASE WHEN a.status_id = 5 THEN md2.application_id END) AS approved,
            COUNT(DISTINCT CASE WHEN a.status_id = 6 THEN md2.application_id END) AS rejected
        FROM manager_user mu
        JOIN manager_decision md2 ON md2.manager_id = mu.id
        JOIN application a ON a.application_id = md2.application_id
        WHERE 1=1
          {time_filter}
          {amount_filters}
        GROUP BY mu.id, mu.full_name, mu.login
        ORDER BY processed DESC;
    """, [p for p in manager_params if p not in (manager_id,)])
    managers_stats = [
        {
            "manager_id": row[0],
            "full_name":  row[1],
            "login":      row[2],
            "processed":  row[3],
            "approved":   row[4],
            "rejected":   row[5],
        }
        for row in cur.fetchall()
    ]

    conn.close()
    return {
        "by_status":      by_status,
        "total_count":    total_count,
        "total_amount":   total_amount,
        "timeline":       timeline,
        "managers_stats": managers_stats,
    }


def get_managers_list():
    """Повертає список всіх менеджерів для дропдауну фільтру."""
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT id, full_name, login FROM manager_user ORDER BY full_name;")
    rows = cur.fetchall()
    conn.close()
    return [{"id": r[0], "full_name": r[1], "login": r[2]} for r in rows]
