from app.settings import get_scoring_params


def calculate_scoring(income, overdue, max_delay):
    p = get_scoring_params()

    score = p["base_score"]

    if float(income) < p["income_threshold"]:
        score -= p["income_penalty"] * p["weight_income"]
    if overdue > 0:
        score -= overdue * p["overdue_penalty_per_loan"] * p["weight_bki"]
    if max_delay > p["max_delay_threshold"]:
        score -= p["max_delay_penalty"] * p["weight_bki"]

    risk = 1
    if score < p["risk_medium_threshold"]:
        risk = 2
    if score < p["risk_high_threshold"]:
        risk = 3

    return score, risk


def generate_recommendation(scoring_score, business_rules, bki_reports, income, amount, term):
    from app.settings import get_scoring_params
    p = get_scoring_params()

    parts = []
    score = scoring_score or 0
    rules = business_rules or {}

    if score >= p["risk_medium_threshold"]:
        parts.append(f"Скоринговий бал {score:.0f} — позитивний.")
    elif score >= p["risk_high_threshold"]:
        parts.append(f"Скоринговий бал {score:.0f} — прийнятний, середній ризик.")
    else:
        parts.append(f"Скоринговий бал {score:.0f} — низький, підвищений ризик.")

    if rules.get("overall_result"):
        parts.append("Клієнт відповідає всім бізнес-правилам.")
    else:
        violations = []
        if not rules.get("income_ok"):
            violations.append("недостатній дохід")
        if not rules.get("dti_ok"):
            violations.append("надмірне боргове навантаження")
        if not rules.get("employment_ok"):
            violations.append("недостатній стаж")
        if not rules.get("employment_type_ok"):
            violations.append("тип зайнятості не відповідає вимогам")
        if violations:
            parts.append(f"Порушення бізнес-правил: {', '.join(violations)}.")

    if bki_reports:
        latest = bki_reports[0]
        if latest.get("overdue_loans", 0) == 0:
            parts.append("Кредитна історія чиста.")
        else:
            parts.append(
                f"Має {latest['overdue_loans']} прострочених кредитів, "
                f"макс. прострочка {latest['max_overdue_days']} днів."
            )
    else:
        parts.append("Дані БКІ відсутні.")

    try:
        if income and amount and term and float(income) > 0:
            dti = (float(amount) / int(term)) / float(income) * 100
            parts.append(f"DTI: {dti:.1f}%.")
            if dti < 30:
                parts.append("Навантаження на дохід прийнятне.")
            elif dti < 40:
                parts.append("Навантаження на дохід помірне.")
            else:
                parts.append("Навантаження підвищене — рекомендується зменшити суму або збільшити термін.")
    except Exception:
        pass

    if rules.get("overall_result") and score >= p["risk_medium_threshold"]:
        parts.append("✅ РЕКОМЕНДАЦІЯ: Схвалити.")
    elif not rules.get("overall_result") or score < p["risk_high_threshold"]:
        parts.append("❌ РЕКОМЕНДАЦІЯ: Відмовити.")
    else:
        parts.append("⚠️ РЕКОМЕНДАЦІЯ: Розглянути індивідуально.")

    return " ".join(parts)
