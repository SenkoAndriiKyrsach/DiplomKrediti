from fastapi import APIRouter
from app.schemas import BlacklistAdd
from app.repositories.blacklist_repo import (
    get_blacklist,
    add_to_blacklist,
    remove_from_blacklist,
    search_customers_for_blacklist,
    get_blacklist_entry,
    get_customer_name,
)
from app.repositories.log_repo import write_log

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
    customer = get_customer_name(data.customer_id)
    result = add_to_blacklist(data.customer_id, data.reason, manager_id=1)
    c_label = f"'{customer['login']}' ({customer['full_name']})" if customer else f"#{data.customer_id}"
    write_log("admin",
              f"Клієнта {c_label} додано до чорного списку. Причина: {data.reason}",
              actor="Менеджер", entity_id=data.customer_id)
    return result


@router.post("/{blacklist_id}/remove")
def remove_blacklist(blacklist_id: int):
    entry = get_blacklist_entry(blacklist_id)
    result = remove_from_blacklist(blacklist_id)
    if entry:
        c_label = f"'{entry['login']}' ({entry['full_name']})"
        write_log("admin",
                  f"Клієнта {c_label} видалено з чорного списку",
                  actor="Менеджер", entity_id=entry["customer_id"])
    else:
        write_log("admin", f"Запис чорного списку #{blacklist_id} видалено", actor="Менеджер")
    return result
