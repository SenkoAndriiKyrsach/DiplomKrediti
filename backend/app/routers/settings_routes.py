from fastapi import APIRouter
from app.repositories.settings_repo import get_all_settings, get_settings_by_category, upsert_settings, get_labels_for_keys
from app.repositories.log_repo import write_log

router = APIRouter()


@router.get("")
def list_settings(category: str = None):
    if category:
        return {category: get_settings_by_category(category)}
    return get_all_settings()


@router.post("")
def save_settings(entries: list[dict]):
    """
    Body: [{"key": "penalty.daily_rate", "value": "0.002"}, ...]
    """
    updated = upsert_settings(entries)
    # Отримуємо людські назви для ключів
    labels = get_labels_for_keys([e["key"] for e in entries])
    parts = [f"{labels.get(e['key'], e['key'])} → {e['value']}" for e in entries[:5]]
    if len(entries) > 5:
        parts.append(f"та ще {len(entries) - 5} параметрів")
    write_log("admin", f"Змінено налаштування: {'; '.join(parts)}", actor="Адміністратор")
    return {"status": "ok", "updated": updated}
