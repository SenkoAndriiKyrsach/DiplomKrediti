"""
Модуль налаштувань системи з кешуванням.
Сервіси (scoring, business_rules, penalty) читають параметри звідси.
Кеш живе 30 секунд — після збереження в адмін-панелі
параметри підхоплюються автоматично.
"""
import time
from app.db import get_connection

_cache: dict = {}
_loaded_at: float = 0
CACHE_TTL = 30  # секунд


def _load():
    global _cache, _loaded_at
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT key, value FROM system_settings")
    _cache = {row[0]: row[1] for row in cur.fetchall()}
    _loaded_at = time.time()


def _ensure_loaded():
    if time.time() - _loaded_at > CACHE_TTL:
        _load()


def invalidate():
    """Викликається після збереження налаштувань."""
    global _loaded_at
    _loaded_at = 0


def get_raw(key: str, default: str = None) -> str:
    _ensure_loaded()
    return _cache.get(key, default)


def get_float(key: str, default: float) -> float:
    val = get_raw(key)
    try:
        return float(val) if val is not None else default
    except (ValueError, TypeError):
        return default


def get_int(key: str, default: int) -> int:
    val = get_raw(key)
    try:
        return int(val) if val is not None else default
    except (ValueError, TypeError):
        return default


def get_bool(key: str, default: bool) -> bool:
    val = get_raw(key)
    if val is None:
        return default
    return val.strip().lower() in ('true', '1', 'yes')


# ── Зручні аксесори за категоріями ──────────────────────────

def get_penalty_settings() -> dict:
    return {
        "daily_rate": get_float("penalty.daily_rate", 0.001),
        "grace_days": get_int("penalty.grace_days", 0),
    }


def get_scoring_params() -> dict:
    return {
        "base_score":               get_float("scoring.base_score", 600),
        "income_threshold":         get_float("scoring.income_threshold", 10000),
        "income_penalty":           get_float("scoring.income_penalty", 100),
        "overdue_penalty_per_loan": get_float("scoring.overdue_penalty_per_loan", 20),
        "max_delay_threshold":      get_float("scoring.max_delay_threshold", 30),
        "max_delay_penalty":        get_float("scoring.max_delay_penalty", 50),
        "risk_medium_threshold":    get_float("scoring.risk_medium_threshold", 550),
        "risk_high_threshold":      get_float("scoring.risk_high_threshold", 500),
        # Ваги характеристик (множники)
        "weight_income":            get_float("scoring.weight_income", 1.0),
        "weight_bki":               get_float("scoring.weight_bki", 1.0),
        "weight_employment":        get_float("scoring.weight_employment", 1.0),
    }


def get_business_rules() -> dict:
    return {
        "min_income":               get_float("rules.min_income", 8000),
        "dti_max":                  get_float("rules.dti_max", 0.4),
        "min_employment_months":    get_int("rules.min_employment_months", 6),
        "forbidden_employment_type": get_int("rules.forbidden_employment_type", 4),
    }


def get_bki_settings() -> dict:
    return {
        "enabled":                  get_bool("bki.enabled", True),
        "auto_reject_overdue_count": get_int("bki.auto_reject_overdue_count", 5),
        "auto_reject_max_days":     get_int("bki.auto_reject_max_days", 90),
    }
