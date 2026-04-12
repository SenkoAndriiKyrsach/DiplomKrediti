from fastapi import APIRouter
from app.schemas import ApplicationCreate, DecisionInput
from app.repositories.application_repo import (
    create_application,
    get_application_details,
    get_application_full_details
)
from app.repositories.manager_repo import create_manager_decision

router = APIRouter()

@router.post("/create")
def create(data: ApplicationCreate):
    return create_application(data)

@router.get("/{application_id}")
def get_application(application_id: int):
    return get_application_details(application_id)

@router.post("/{application_id}/decision")
def make_decision(application_id: int, data: DecisionInput):
    return create_manager_decision(application_id, data)

@router.get("/details/{application_id}")
def application_full_details(application_id: int):
    return get_application_full_details(application_id)
