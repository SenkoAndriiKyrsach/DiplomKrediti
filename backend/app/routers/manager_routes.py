from fastapi import APIRouter
from app.repositories.manager_repo import (
    get_applications_by_status,
    create_manager_decision,
    get_all_active_credits,
)
from app.schemas import DecisionInput

router = APIRouter()


@router.get("/by-status/{status_id}")
def apps_by_status(status_id: int):
    return get_applications_by_status(status_id)


@router.post("/{application_id}/decision")
def decision(application_id: int, data: DecisionInput):
    return create_manager_decision(application_id, data)


@router.get("/active-credits")
def active_credits():
    return get_all_active_credits()
