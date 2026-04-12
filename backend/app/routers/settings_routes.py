from fastapi import APIRouter
from app.repositories.settings_repo import get_all_settings, get_settings_by_category, upsert_settings

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
    return {"status": "ok", "updated": updated}
