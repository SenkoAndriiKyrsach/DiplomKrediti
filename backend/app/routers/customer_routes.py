from fastapi import APIRouter
from app.repositories.customer_repo import (
    get_customer_profile,
    update_customer_profile,
    get_customer_applications,
    get_customer_loans,
    get_max_loan_info,
)

router = APIRouter()


@router.get("/{customer_id}")
def get_profile(customer_id: int):
    return get_customer_profile(customer_id)


@router.post("/{customer_id}/update")
def update_profile(customer_id: int, data: dict):
    return update_customer_profile(customer_id, data)


@router.get("/{customer_id}/applications")
def applications(customer_id: int):
    return get_customer_applications(customer_id)


@router.get("/{customer_id}/loans")
def loans(customer_id: int):
    return get_customer_loans(customer_id)


@router.get("/{customer_id}/max-loan")
def max_loan(customer_id: int):
    """Повертає максимально допустимий щомісячний платіж та дохід."""
    return get_max_loan_info(customer_id)
