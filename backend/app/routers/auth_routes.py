import os
import re
import bcrypt
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from app.schemas import RegisterInput, LoginInput
from app.repositories.customer_repo import get_customer_by_login, create_customer
from app.repositories.manager_user_repo import (
    get_manager_by_login, change_password as manager_change_password
)
from app.repositories.log_repo import write_log
from app.db import get_connection

router = APIRouter()

ADMIN_PASSWORD   = os.getenv("ADMIN_PASSWORD", "admin")
GOOGLE_CLIENT_ID = os.getenv(
    "GOOGLE_CLIENT_ID",
    "293363955378-ihjprejtvdvq7g2jfup97pq9esl8jk34.apps.googleusercontent.com"
)


# ── Helpers ──────────────────────────────────────────────────────────────────

def _find_by_google_id(google_id: str):
    conn = get_connection()
    cur  = conn.cursor()
    cur.execute("SELECT customer_id, login FROM customer WHERE google_id = %s", (google_id,))
    row = cur.fetchone()
    return {"customer_id": row[0], "login": row[1]} if row else None


def _find_by_email(email: str):
    conn = get_connection()
    cur  = conn.cursor()
    cur.execute("SELECT customer_id, login FROM customer WHERE email = %s", (email,))
    row = cur.fetchone()
    return {"customer_id": row[0], "login": row[1]} if row else None


def _create_google_customer(google_id: str, email: str, full_name: str, login: str):
    conn = get_connection()
    cur  = conn.cursor()
    cur.execute("""
        INSERT INTO customer
            (login, password_hash, full_name, email, google_id,
             birth_date, citizenship, monthly_income, employment_type_id, employment_term_months)
        VALUES (%s, NULL, %s, %s, %s, '1990-01-01', 1, 0, 1, 0)
        RETURNING customer_id
    """, (login, full_name, email, google_id))
    new_id = cur.fetchone()[0]
    conn.commit()
    return {"customer_id": new_id, "login": login}


def _attach_google_id(customer_id: int, google_id: str, email: str):
    conn = get_connection()
    cur  = conn.cursor()
    cur.execute(
        "UPDATE customer SET google_id=%s, email=%s WHERE customer_id=%s",
        (google_id, email, customer_id)
    )
    conn.commit()


def _unique_login(base: str) -> str:
    login = re.sub(r"[^a-z0-9_]", "", base.lower())[:20] or "user"
    conn  = get_connection()
    cur   = conn.cursor()
    cur.execute("SELECT login FROM customer WHERE login = %s", (login,))
    if not cur.fetchone():
        return login
    for i in range(2, 999):
        candidate = f"{login}{i}"
        cur.execute("SELECT login FROM customer WHERE login = %s", (candidate,))
        if not cur.fetchone():
            return candidate
    return login + "_x"


# ── Schemas ───────────────────────────────────────────────────────────────────

class GoogleTokenInput(BaseModel):
    credential: str


class ChangePasswordInput(BaseModel):
    login:        str
    old_password: str
    new_password: str


# ── Routes ────────────────────────────────────────────────────────────────────

@router.post("/register")
def register(data: RegisterInput):
    login = data.login.strip().lower()
    if login in ("manager", "admin"):
        raise HTTPException(400, f"Login '{login}' is reserved")
    if len(login) < 3:
        raise HTTPException(400, "Login must be at least 3 characters")
    if len(data.password) < 4:
        raise HTTPException(400, "Password must be at least 4 characters")
    if get_customer_by_login(login):
        raise HTTPException(409, "Логін вже зайнятий")
    pw_hash  = bcrypt.hashpw(data.password.encode(), bcrypt.gensalt()).decode()
    customer = create_customer(login, pw_hash, data.full_name)
    return {"customer_id": customer["customer_id"], "login": login, "status": "registered"}


@router.post("/login")
def login_route(data: LoginInput):
    login = data.login.strip().lower()

    # ── Admin ──
    if login == "admin":
        if data.password != ADMIN_PASSWORD:
            raise HTTPException(401, "Невірний пароль")
        return {"login": "admin", "role": "admin"}

    # ── Manager (з БД) ──
    mgr = get_manager_by_login(login)
    if mgr:
        if not mgr["is_active"]:
            raise HTTPException(403, "Акаунт деактивовано")
        if not bcrypt.checkpw(data.password.encode(), mgr["password_hash"].encode()):
            raise HTTPException(401, "Невірний пароль")
        return {
            "login":               mgr["login"],
            "manager_id":          mgr["id"],
            "role":                "manager",
            "must_change_password": mgr["must_change_password"],
        }

    # ── Borrower ──
    customer = get_customer_by_login(login)
    if not customer:
        raise HTTPException(401, "Користувача не знайдено")
    pw_hash = customer.get("password_hash")
    if pw_hash and not bcrypt.checkpw(data.password.encode(), pw_hash.encode()):
        raise HTTPException(401, "Невірний пароль")
    return {"login": login, "customer_id": customer["customer_id"], "role": "borrower"}


@router.post("/change-password")
def change_password(data: ChangePasswordInput):
    """Зміна пароля менеджера (обов'язкова при першому вході)."""
    login = data.login.strip().lower()
    mgr   = get_manager_by_login(login)
    if not mgr:
        raise HTTPException(404, "Менеджера не знайдено")
    if not bcrypt.checkpw(data.old_password.encode(), mgr["password_hash"].encode()):
        raise HTTPException(401, "Невірний поточний пароль")
    if len(data.new_password) < 4:
        raise HTTPException(400, "Новий пароль мінімум 4 символи")
    manager_change_password(mgr["id"], data.new_password)
    write_log("admin", f"Менеджер '{login}' змінив пароль", actor=login)
    return {"ok": True}


@router.post("/google")
def google_auth(data: GoogleTokenInput):
    try:
        info = id_token.verify_oauth2_token(
            data.credential, google_requests.Request(), GOOGLE_CLIENT_ID
        )
    except ValueError as e:
        raise HTTPException(401, f"Невалідний Google токен: {e}")

    google_id = info["sub"]
    email     = info.get("email", "")
    full_name = info.get("name", "Google User")

    customer = _find_by_google_id(google_id)
    if customer:
        return {"login": customer["login"], "customer_id": customer["customer_id"], "role": "borrower"}

    if email:
        existing = _find_by_email(email)
        if existing:
            _attach_google_id(existing["customer_id"], google_id, email)
            return {"login": existing["login"], "customer_id": existing["customer_id"], "role": "borrower"}

    login    = _unique_login(email.split("@")[0] if email else full_name)
    customer = _create_google_customer(google_id, email, full_name, login)
    return {"login": customer["login"], "customer_id": customer["customer_id"], "role": "borrower"}
