from app.db import get_connection
from app import settings as settings_cache


def get_all_settings() -> dict:
    """Повертає всі налаштування згруповані по категоріях."""
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT key, value, label, description, category, updated_at
        FROM system_settings
        ORDER BY category, key;
    """)
    rows = cur.fetchall()

    grouped: dict = {}
    for key, value, label, description, category, updated_at in rows:
        if category not in grouped:
            grouped[category] = []
        grouped[category].append({
            "key": key,
            "value": value,
            "label": label or key,
            "description": description or "",
            "updated_at": updated_at,
        })
    return grouped


def get_settings_by_category(category: str) -> list:
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT key, value, label, description, updated_at
        FROM system_settings
        WHERE category = %s
        ORDER BY key;
    """, (category,))
    return [
        {
            "key": r[0],
            "value": r[1],
            "label": r[2] or r[0],
            "description": r[3] or "",
            "updated_at": r[4],
        }
        for r in cur.fetchall()
    ]


def upsert_settings(entries: list[dict]) -> int:
    """
    entries = [{"key": "...", "value": "..."}]
    Справжній upsert: якщо рядка немає — створює, якщо є — оновлює.
    Повертає кількість оброблених рядків.
    """
    conn = get_connection()
    cur = conn.cursor()
    count = 0
    for entry in entries:
        cur.execute("""
            INSERT INTO system_settings (key, value, category, updated_at)
            VALUES (
                %s, %s,
                SPLIT_PART(%s, '.', 1),
                NOW()
            )
            ON CONFLICT (key) DO UPDATE
                SET value = EXCLUDED.value,
                    updated_at = NOW();
        """, (entry["key"], str(entry["value"]), entry["key"]))
        count += cur.rowcount
    conn.commit()
    settings_cache.invalidate()  # скидаємо кеш
    return count
