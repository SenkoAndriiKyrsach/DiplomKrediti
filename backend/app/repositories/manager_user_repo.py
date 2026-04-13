"""
Репозиторій для таблиці manager_user (адмін керує менеджерами).
"""
import bcrypt
from app.db import get_connection


def get_all_managers():
    conn = get_connection()
    cur  = conn.cursor()
    cur.execute("""
        SELECT id, login, full_name, is_active, must_change_password, created_at
        FROM   manager_user
        ORDER  BY created_at
    """)
    return [
        {"id": r[0], "login": r[1], "full_name": r[2],
         "is_active": r[3], "must_change_password": r[4],
         "created_at": r[5].isoformat() if r[5] else None}
        for r in cur.fetchall()
    ]


def get_manager_by_login(login: str):
    conn = get_connection()
    cur  = conn.cursor()
    cur.execute("""
        SELECT id, login, password_hash, full_name, is_active, must_change_password
        FROM   manager_user
        WHERE  login = %s
    """, (login,))
    r = cur.fetchone()
    if not r:
        return None
    return {"id": r[0], "login": r[1], "password_hash": r[2],
            "full_name": r[3], "is_active": r[4], "must_change_password": r[5]}


def create_manager(login: str, full_name: str, password: str = "1234"):
    pw_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
    conn = get_connection()
    cur  = conn.cursor()
    cur.execute("""
        INSERT INTO manager_user (login, password_hash, full_name, must_change_password)
        VALUES (%s, %s, %s, TRUE)
        RETURNING id
    """, (login, pw_hash, full_name))
    new_id = cur.fetchone()[0]
    conn.commit()
    return {"id": new_id, "login": login, "full_name": full_name}


def set_active(manager_id: int, is_active: bool):
    conn = get_connection()
    cur  = conn.cursor()
    cur.execute(
        "UPDATE manager_user SET is_active=%s WHERE id=%s",
        (is_active, manager_id)
    )
    conn.commit()


def change_password(manager_id: int, new_password: str):
    pw_hash = bcrypt.hashpw(new_password.encode(), bcrypt.gensalt()).decode()
    conn = get_connection()
    cur  = conn.cursor()
    cur.execute("""
        UPDATE manager_user
           SET password_hash = %s, must_change_password = FALSE
         WHERE id = %s
    """, (pw_hash, manager_id))
    conn.commit()
