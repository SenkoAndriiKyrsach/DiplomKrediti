from fastapi import APIRouter
from app.schemas import BlacklistAdd
from app.repositories.blacklist_repo import (
    get_blacklist,
    add_to_blacklist,
    remove_from_blacklist,
    search_customers_for_blacklist,
)

router = APIRouter()


@router.get("")
def get_all_blacklist():
    return {"blacklist": get_blacklist()}


@router.get("/search")
def search_customers(q: str = ""):
    if len(q) < 2:
        return {"customers": []}
    return {"customers": search_customers_for_blacklist(q)}


@router.post("/add")
def add_blacklist(data: BlacklistAdd):
    return add_to_blacklist(data.customer_id, data.reason, manager_id=1)


@router.post("/{blacklist_id}/remove")
def remove_blacklist(blacklist_id: int):
    return remove_from_blacklist(blacklist_id)
