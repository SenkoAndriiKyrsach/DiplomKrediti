"""
Маршрути для керування критеріями і діапазонами скорингу.
"""
from fastapi import APIRouter
from pydantic import BaseModel
from app.repositories.scoring_repo import get_all_criteria, save_criteria_batch
from app.settings import get_float

router = APIRouter()


class ScoringUpdate(BaseModel):
    updates: list  # [{"type":"criterion","id":1,"weight":0.3}, ...]


@router.get("")
def get_scoring_config():
    criteria = get_all_criteria()
    pass_pct = get_float("scoring.pass_percentage", 80)

    # Обчислити min/max/pass_score
    total_max = sum(
        max((r["score_value"] for r in c["ranges"]), default=0) * c["weight"]
        for c in criteria
    )
    total_min = sum(
        min((r["score_value"] for r in c["ranges"]), default=0) * c["weight"]
        for c in criteria
    )
    pass_score = pass_pct * total_max / 100 if total_max > 0 else 0

    return {
        "criteria":   criteria,
        "pass_percentage": pass_pct,
        "min_score":  round(total_min, 2),
        "max_score":  round(total_max, 2),
        "pass_score": round(pass_score, 2),
    }


@router.post("")
def save_scoring(data: ScoringUpdate):
    count = save_criteria_batch(data.updates)
    return {"saved": count}
