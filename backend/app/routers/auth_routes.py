import os
import re
import bcrypt
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from app.schemas import RegisterInput, LoginInput
from app.repositories.customer_repo import get_customer_by_login, create_customer
from app.db import get_connection

router = APIRouter()

MANAGER_PASSWORD  = os.getenv("MANAGER_PASSWORD", "1234")
ADMIN_PASSWORD    = os.getenv("ADMIN_PASSWORD", "admin")
GOOGLE_CLIENT_ID  = os.getenv(
    "GOOGLE_CLIENT_ID",
    "293363955378-ihjprejtvdvq7g2jfup97pq9esl8jk34.apps.googleusercontent.com"
)


# ── Helpers ─────────────────────────────────────────────────────────────────

def _find_by_google_id(google_id: str):
    conn = get_connection()
    cur  = conn.cursor()
    cur.execute(
        "SELECT customer_id, login FROM customer WHERE google_id = %s",
        (google_id,)
    )
    row = cur.fetchone()
    return {"customer_id": row[0], "login": row[1]} if row else None


def _find_by_email(email: str):
    conn = get_connection()
    cur  = conn.cursor()
    cur.execute(
        "SELECT customer_id, login FROM customer WHERE email = %s",
        (email,)
    )
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
        RETURNING customer_id;
    """, (login, full_name, email, google_id))
    new_id = cur.fetchone()[0]
    conn.commit()
    return {"customer_id": new_id, "login": login}


def _attach_google_id(customer_id: int, google_id: str, email: str):
    """Прив'язати Google ID до існуючого акаунту (merge по email)."""
    conn = get_connection()
    cur  = conn.cursor()
    cur.execute(
        "UPDATE customer SET google_id=%s, email=%s WHERE customer_id=%s",
        (google_id, email, customer_id)
    )
    conn.commit()


def _unique_login(base: str) -> str:
    """Генерує унікальний логін на основі email-префіксу."""
    login = re.sub(r"[^a-z0-9_]", "", base.lower())[:20] or "user"
    conn  = get_connection()
    cur   = conn.cursor()
    cur.execute("SELECT login FROM customer WHERE login = %s", (login,))
    if not cur.fetchone():
        return login
    # додати числовий суфікс
    for i in range(2, 999):
        candidate = f"{login}{i}"
        cur.execute("SELECT login FROM customer WHERE login = %s", (candidate,))
        if not cur.fetchone():
            return candidate
    return login + "_x"


# ── Schemas ──────────────────────────────────────────────────────────────────

class GoogleTokenInput(BaseModel):
    credential: str   # ID-токен від Google Sign-In


# ── Routes ───────────────────────────────────────────────────────────────────

@router.post("/register")
def register(data: RegisterInput):
    login = data.login.strip().lower()

    if login in ("manager", "admin"):
        raise HTTPException(status_code=400, detail=f"Login '{login}' is reserved")
    if len(login) < 3:
        raise HTTPException(status_code=400, detail="Login must be at least 3 characters")
    if len(data.password) < 4:
        raise HTTPException(status_code=400, detail="Password must be at least 4 characters")

    existing = get_customer_by_login(login)
    if existing:
        raise HTTPException(status_code=409, detail="Логін вже зайнятий")

    password_hash = bcrypt.hashpw(data.password.encode(), bcrypt.gensalt()).decode()
    customer = create_customer(login, password_hash, data.full_name)

    return {"customer_id": customer["customer_id"], "login": login, "status": "registered"}


@router.post("/login")
def login_route(data: LoginInput):
    login = data.login.strip().lower()

    if login == "admin":
        if data.password != ADMIN_PASSWORD:
            raise HTTPException(status_code=401, detail="Невірний пароль")
        return {"login": "admin"}

    if login == "manager":
        if data.password != MANAGER_PASSWORD:
            raise HTTPException(status_code=401, detail="Невірний пароль")
        return {"login": "manager"}

    customer = get_customer_by_login(login)
    if not customer:
        raise HTTPException(status_code=401, detail="Користувача не знайдено")

    password_hash = customer.get("password_hash")
    if password_hash:
        if not bcrypt.checkpw(data.password.encode(), password_hash.encode()):
            raise HTTPException(status_code=401, detail="Невірний пароль")

    return {"login": login, "customer_id": customer["customer_id"]}


@router.post("/google")
def google_auth(data: GoogleTokenInput):
    # 1. Верифікувати ID-токен через Google API
    try:
        info = id_token.verify_oauth2_token(
            data.credential,
            google_requests.Request(),
            GOOGLE_CLIENT_ID
        )
    except ValueError as e:
        raise HTTPException(status_code=401, detail=f"Невалідний Google токен: {e}")

    google_id = info["sub"]          # унікальний Google user ID
    email     = info.get("email", "")
    full_name = info.get("name", "Google User")

    # 2. Знайти клієнта за google_id
    customer = _find_by_google_id(google_id)
    if customer:
        return {"login": customer["login"], "customer_id": customer["customer_id"]}

    # 3. Merge — якщо email вже є в системі (зареєструвався раніше через логін/пароль)
    if email:
        existing = _find_by_email(email)
        if existing:
            _attach_google_id(existing["customer_id"], google_id, email)
            return {"login": existing["login"], "customer_id": existing["customer_id"]}

    # 4. Новий клієнт — створити акаунт
    base_login = email.split("@")[0] if email else full_name
    login      = _unique_login(base_login)
    customer   = _create_google_customer(google_id, email, full_name, login)

    return {"login": customer["login"], "customer_id": customer["customer_id"]}
