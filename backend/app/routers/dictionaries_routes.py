from fastapi import APIRouter
from app.repositories.dictionaries_repo import (
    get_citizenships,
    get_employment_types
)

router = APIRouter()


@router.get("/citizenships")
def list_citizenships():
    return get_citizenships()


@router.get("/employment-types")
def list_employment_types():
    return get_employment_types()
