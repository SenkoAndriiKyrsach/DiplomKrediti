from app.db import get_connection
from app.services.scoring import calculate_scoring, generate_recommendation
from app.services.business_rules import check_rules
from app.repositories.blacklist_repo import is_blacklisted, get_customer_name
from app.repositories.log_repo import write_log


def create_application(data):
    conn = get_connection()
    cur = conn.cursor()

    # Перевірка чорного списку
    if is_blacklisted(data.customer_id):
        cur.execute("""
            INSERT INTO application (customer_id, product_id, amount_requested, term_months,
                                     purpose, down_payment_amount, status_id)
            VALUES (%s, %s, %s, %s, %s, %s, 2)
            RETURNING application_id;
        """, (data.customer_id, data.product_id, data.amount_requested,
              data.term_months, data.purpose, data.down_payment_amount))
        application_id = cur.fetchone()[0]
        conn.commit()
        customer = get_customer_name(data.customer_id)
        c_label  = f"'{customer['login']}' ({customer['full_name']})" if customer else f"#{data.customer_id}"
        write_log("application",
                  f"Заявку #{application_id} від клієнта {c_label} автоматично відхилено — клієнт у чорному списку",
                  actor=f"Клієнт {c_label}", entity_id=application_id)
        return {"application_id": application_id, "status": "auto_rejected", "reason": "blacklisted"}

    # Створюємо заявку
    cur.execute("""
        INSERT INTO application (customer_id, product_id, amount_requested, term_months,
                                 purpose, down_payment_amount, status_id)
        VALUES (%s, %s, %s, %s, %s, %s, 1)
        RETURNING application_id;
    """, (data.customer_id, data.product_id, data.amount_requested,
          data.term_months, data.purpose, data.down_payment_amount))

    application_id = cur.fetchone()[0]

    # Дані по клієнту
    cur.execute("""
        SELECT monthly_income, employment_term_months, employment_type_id
        FROM customer
        WHERE customer_id = %s;
    """, (data.customer_id,))
    income, employment_term, employment_type = cur.fetchone()

    # Дані БКІ
    cur.execute("""
        SELECT total_loans, overdue_loans, max_overdue_days, external_score
        FROM credit_history_report
        WHERE customer_id = %s
        ORDER BY report_id DESC LIMIT 1;
    """, (data.customer_id,))
    row = cur.fetchone()
    if not row:
        total_loans = overdue_loans = max_overdue_days = external_score = 0
    else:
        total_loans, overdue_loans, max_overdue_days, external_score = row

    # Сума кредиту після першого внеску
    net_amount = data.amount_requested - data.down_payment_amount

    # Бізнес-правила
    income_ok, dti_ok, emp_ok, emp_type_ok, overall = check_rules(
        income, net_amount, data.term_months, employment_term, employment_type
    )
    cur.execute("""
        INSERT INTO business_rules_check
            (application_id, income_ok, dti_ok, employment_ok, employment_type_ok, overall_result)
        VALUES (%s, %s, %s, %s, %s, %s);
    """, (application_id, income_ok, dti_ok, emp_ok, emp_type_ok, overall))

    # Скоринг
    scoring, risk_level = calculate_scoring(income, overdue_loans, max_overdue_days)
    cur.execute("""
        INSERT INTO scoring_result (application_id, scoring_score, risk_level_id, model_version)
        VALUES (%s, %s, %s, '1.0');
    """, (application_id, scoring, risk_level))

    # Авто-статус: 2 = авто-відхилено, 3 = на розгляді
    status = 2 if risk_level == 3 or not overall else 3

    cur.execute(
        "UPDATE application SET status_id=%s WHERE application_id=%s",
        (status, application_id)
    )
    conn.commit()

    customer = get_customer_name(data.customer_id)
    c_label  = f"'{customer['login']}' ({customer['full_name']})" if customer else f"#{data.customer_id}"
    if status == 2:
        write_log("application",
                  f"Заявку #{application_id} від клієнта {c_label} на суму {data.amount_requested:.0f} грн "
                  f"автоматично відхилено (бізнес-правила / скоринг)",
                  actor=f"Клієнт {c_label}", entity_id=application_id)
    else:
        write_log("application",
                  f"Клієнт {c_label} подав заявку #{application_id} на суму {data.amount_requested:.0f} грн, "
                  f"термін {data.term_months} міс.",
                  actor=f"Клієнт {c_label}", entity_id=application_id)

    return {
        "application_id": application_id,
        "status": "auto_rejected" if status == 2 else "recommended"
    }


def get_application_details(application_id: int):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM application WHERE application_id=%s;", (application_id,))
    return cur.fetchone()


def get_application_full_details(application_id: int):
    conn = get_connection()
    cur = conn.cursor()

    # --- Заявка ---
    cur.execute("""
        SELECT
            a.application_id,
            a.amount_requested,
            a.term_months,
            a.purpose,
            a.created_at,
            s.status_name,
            a.customer_id,
            a.down_payment_amount,
            a.product_id,
            p.product_name
        FROM application a
        LEFT JOIN application_status s ON s.status_id = a.status_id
        LEFT JOIN credit_product p ON p.product_id = a.product_id
        WHERE a.application_id = %s
    """, (application_id,))
    app = cur.fetchone()

    if not app:
        return {"error": "Application not found"}

    application = {
        "application_id": app[0],
        "amount_requested": float(app[1]),
        "term_months": app[2],
        "purpose": app[3],
        "created_at": app[4],
        "status_name": app[5],
        "customer_id": app[6],
        "down_payment_amount": float(app[7] or 0),
        "product_id": app[8],
        "product_name": app[9],
    }

    # --- Дані по клієнту ---
    cur.execute("""
        SELECT
            c.full_name,
            c.birth_date,
            c.citizenship,
            cd.citizenship_name,
            c.monthly_income,
            c.employment_type_id,
            e.employment_type_name,
            c.employment_term_months
        FROM customer c
        LEFT JOIN citizenship_dict cd ON cd.citizenship_id = c.citizenship
        LEFT JOIN employment_type_dict e ON e.employment_type_id = c.employment_type_id
        WHERE c.customer_id = %s
    """, (application["customer_id"],))
    c = cur.fetchone()
    borrower = {
        "full_name": c[0],
        "birth_date": c[1],
        "citizenship_id": c[2],
        "citizenship_name": c[3],
        "monthly_income": float(c[4] or 0),
        "employment_type_id": c[5],
        "employment_type_name": c[6],
        "employment_term_months": c[7]
    }

    # --- Business rules ---
    cur.execute("""
        SELECT income_ok, dti_ok, employment_ok, employment_type_ok, overall_result
        FROM business_rules_check WHERE application_id = %s
    """, (application_id,))
    br = cur.fetchone()
    business_rules = {
        "income_ok": br[0] if br else None,
        "dti_ok": br[1] if br else None,
        "employment_ok": br[2] if br else None,
        "employment_type_ok": br[3] if br else None,
        "overall_result": br[4] if br else None,
    }

    # --- Scoring ---
    cur.execute("""
        SELECT s.scoring_score, s.risk_level_id, rl.risk_level_name, s.model_version
        FROM scoring_result s
        LEFT JOIN risk_level_dict rl ON rl.risk_level_id = s.risk_level_id
        WHERE s.application_id = %s
    """, (application_id,))
    s = cur.fetchone()
    scoring = {
        "scoring_score": s[0] if s else None,
        "risk_level_id": s[1] if s else None,
        "risk_level_name": s[2] if s else None,
        "model_version": s[3] if s else None,
    }

    # --- BKI ---
    cur.execute("""
        SELECT report_id, report_date, total_loans, overdue_loans, max_overdue_days, external_score
        FROM credit_history_report
        WHERE customer_id = %s
        ORDER BY report_id DESC
    """, (application["customer_id"],))
    bki_reports = [
        {
            "report_id": r[0],
            "report_date": r[1],
            "total_loans": r[2],
            "overdue_loans": r[3],
            "max_overdue_days": r[4],
            "external_score": r[5],
        }
        for r in cur.fetchall()
    ]

    # --- Рішення менеджера ---
    cur.execute("""
        SELECT final_decision, comment, corrected_amount, corrected_term
        FROM manager_decision WHERE application_id = %s ORDER BY decision_id DESC LIMIT 1;
    """, (application_id,))
    md = cur.fetchone()
    manager_decision = {
        "final_decision": md[0] if md else None,
        "comment": md[1] if md else None,
        "corrected_amount": float(md[2]) if md and md[2] else None,
        "corrected_term": md[3] if md else None,
    } if md else None

    # --- Інші заявки клієнта ---
    cur.execute("""
        SELECT a.application_id, s.status_name, sr.scoring_score, a.amount_requested, a.created_at
        FROM application a
        LEFT JOIN application_status s ON s.status_id = a.status_id
        LEFT JOIN scoring_result sr ON sr.application_id = a.application_id
        WHERE a.customer_id = %s AND a.application_id != %s
        ORDER BY a.application_id DESC
    """, (application["customer_id"], application_id))
    other_apps = [
        {
            "application_id": r[0],
            "status_name": r[1],
            "scoring_score": r[2],
            "amount_requested": float(r[3]),
            "created_at": r[4],
        }
        for r in cur.fetchall()
    ]

    # --- Рекомендація ---
    recommendation = generate_recommendation(
        scoring_score=scoring.get("scoring_score"),
        business_rules=business_rules,
        bki_reports=bki_reports,
        income=borrower["monthly_income"],
        amount=application["amount_requested"] - application["down_payment_amount"],
        term=application["term_months"],
    )

    return {
        "application": application,
        "borrower": borrower,
        "business_rules": business_rules,
        "scoring": scoring,
        "bki_reports": bki_reports,
        "other_applications": other_apps,
        "manager_decision": manager_decision,
        "recommendation": recommendation,
    }
