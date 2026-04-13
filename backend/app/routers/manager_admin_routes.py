"""
Адмінські маршрути для керування менеджерами.
Доступні тільки для адміна (перевірка на рівні клієнта).
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.repositories.manager_user_repo import (
    get_all_managers, create_manager, set_active, get_manager_by_login
)

router = APIRouter()


class CreateManagerInput(BaseModel):
    login:     str
    full_name: str


@router.get("")
def list_managers():
    return {"managers": get_all_managers()}


@router.post("")
def add_manager(data: CreateManagerInput):
    login = data.login.strip().lower()
    if len(login) < 3:
        raise HTTPException(400, "Логін мінімум 3 символи")
    if login in ("admin", "manager"):
        raise HTTPException(400, f"Логін '{login}' зарезервований")
    existing = get_manager_by_login(login)
    if existing:
        raise HTTPException(409, "Логін вже зайнятий")
    mgr = create_manager(login, data.full_name.strip())
    return {"manager": mgr, "default_password": "1234"}


@router.patch("/{manager_id}/activate")
def activate(manager_id: int):
    set_active(manager_id, True)
    return {"ok": True}


@router.patch("/{manager_id}/deactivate")
def deactivate(manager_id: int):
    set_active(manager_id, False)
    return {"ok": True}
