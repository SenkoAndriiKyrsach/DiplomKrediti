from fastapi import APIRouter
from datetime import date

from app.repositories.payment_repo import (
    get_payment_schedule_by_application,
    get_schedule_row,
    mark_schedule_paid,
    mark_penalty_paid,
    insert_payment_log,
)

router = APIRouter()


@router.get("/application/{application_id}/payments")
def get_payments(application_id: int):
    """Отримати графік платежів (з автонарахуванням штрафів)."""
    data = get_payment_schedule_by_application(application_id)
    return data or {"message": "No payment schedule found"}


@router.post("/pay/{payment_schedule_id}")
def pay(payment_schedule_id: int):
    """Позичальник: оплатити платіж (основний + штраф якщо є)."""
    row = get_schedule_row(payment_schedule_id)
    if not row:
        return {"error": "payment schedule row not found"}
    if row["is_paid"]:
        return {"error": "Payment already paid"}

    total_amount = row["payment_amount"]
    if not row["penalty_paid"] and row["penalty_amount"] > 0:
        total_amount += row["penalty_amount"]
        mark_penalty_paid(payment_schedule_id)

    mark_schedule_paid(payment_schedule_id)

    payment_id = insert_payment_log(
        credit_id=row["credit_id"],
        amount=total_amount,
        payment_date=date.today(),
        status_id=2
    )

    return {
        "message": "Payment successful",
        "payment_id": payment_id,
        "schedule_updated": payment_schedule_id,
        "amount": total_amount,
    }


@router.post("/pay-penalty/{payment_schedule_id}")
def pay_penalty_only(payment_schedule_id: int):
    """Позичальник: сплатити тільки штраф."""
    row = get_schedule_row(payment_schedule_id)
    if not row:
        return {"error": "payment schedule row not found"}
    if row["penalty_paid"] or row["penalty_amount"] == 0:
        return {"error": "No penalty to pay"}

    mark_penalty_paid(payment_schedule_id)

    payment_id = insert_payment_log(
        credit_id=row["credit_id"],
        amount=row["penalty_amount"],
        payment_date=date.today(),
        status_id=3  # penalty payment
    )

    return {
        "message": "Penalty paid",
        "payment_id": payment_id,
        "penalty_amount": row["penalty_amount"],
    }


@router.post("/manager/pay/{payment_schedule_id}")
def manager_pay(payment_schedule_id: int):
    """Менеджер: зарахувати платіж за позичальника."""
    row = get_schedule_row(payment_schedule_id)
    if not row:
        return {"error": "payment schedule row not found"}
    if row["is_paid"]:
        return {"error": "Payment already paid"}

    total_amount = row["payment_amount"]
    if not row["penalty_paid"] and row["penalty_amount"] > 0:
        total_amount += row["penalty_amount"]
        mark_penalty_paid(payment_schedule_id)

    mark_schedule_paid(payment_schedule_id)

    payment_id = insert_payment_log(
        credit_id=row["credit_id"],
        amount=total_amount,
        payment_date=date.today(),
        status_id=2
    )

    return {
        "message": "Payment recorded by manager",
        "payment_id": payment_id,
        "schedule_updated": payment_schedule_id,
        "amount": total_amount,
    }
