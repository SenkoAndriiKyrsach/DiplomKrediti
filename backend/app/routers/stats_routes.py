"""
Адмінська статистика по заявках.
GET /admin/stats  — основна статистика з фільтрами
GET /admin/stats/managers — список менеджерів для дропдауну
"""
from fastapi import APIRouter
from typing import Optional
from app.repositories.stats_repo import get_application_stats, get_managers_list

router = APIRouter()


@router.get("")
def application_stats(
    period:     str            = "all",
    manager_id: Optional[int]   = None,
    amount_min: Optional[float] = None,
    amount_max: Optional[float] = None,
):
    return get_application_stats(
        period=period,
        manager_id=manager_id,
        amount_min=amount_min,
        amount_max=amount_max,
    )


@router.get("/managers")
def managers_for_filter():
    return {"managers": get_managers_list()}
