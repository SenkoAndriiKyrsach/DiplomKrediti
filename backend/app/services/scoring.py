"""
Нова система скорингу на основі критеріїв та діапазонів з БД.

Алгоритм:
  1. Завантажити активні критерії і діапазони
  2. Для кожного критерію знайти значення клієнта
  3. Знайти відповідний діапазон → отримати score_value
  4. weighted = score_value * weight
  5. total   = sum(weighted)
  6. max_total = sum(max_score_value * weight) — теоретичний максимум
  7. pass_score = pass_percentage * max_total / 100
  8. risk: 1 (total >= pass_score), 2 (borderline), 3 (авто-відмова)
"""
from datetime import date
from app.repositories.scoring_repo import get_all_criteria
from app.settings import get_float


def _match_range(value, ranges):
    """Знаходить перший діапазон що відповідає значенню і повертає score_value."""
    for r in ranges:
        lo = r["range_min"]
        hi = r["range_max"]
        if lo is None and hi is None:
            return r["score_value"]
        if lo is None and value < hi:
            return r["score_value"]
        if hi is None and value >= lo:
            return r["score_value"]
        if lo is not None and hi is not None and lo <= value < hi:
            return r["score_value"]
    # Якщо не знайшли — повертаємо 0
    return 0.0


def _customer_value(key: str, birth_date, income, employment_months, overdue_loans, **kw):
    """Отримує числове значення характеристики клієнта за ключем критерію."""
    if key == "age":
        if birth_date is None:
            return 0
        today = date.today()
        try:
            bd = birth_date if hasattr(birth_date, "year") else date.fromisoformat(str(birth_date))
            return today.year - bd.year - ((today.month, today.day) < (bd.month, bd.day))
        except Exception:
            return 0
    if key == "income":
        return float(income or 0)
    if key == "employment":
        return float(employment_months or 0)
    if key == "bki":
        return float(overdue_loans or 0)
    return 0.0


def calculate_scoring(income, overdue_loans, max_delay,
                      birth_date=None, employment_months=None):
    criteria   = get_all_criteria()
    pass_pct   = get_float("scoring.pass_percentage", 80)

    total_score = 0.0
    max_score   = 0.0

    for c in criteria:
        val    = _customer_value(
            c["key"],
            birth_date=birth_date,
            income=income,
            employment_months=employment_months,
            overdue_loans=overdue_loans,
        )
        sv     = _match_range(val, c["ranges"])
        max_sv = max((r["score_value"] for r in c["ranges"]), default=0)

        total_score += sv     * c["weight"]
        max_score   += max_sv * c["weight"]

    pass_score = pass_pct * max_score / 100 if max_score > 0 else 0

    # Рівні ризику
    if total_score >= pass_score:
        risk = 1
    elif total_score >= pass_score * 0.85:
        risk = 2
    else:
        risk = 3

    return round(total_score, 2), risk


def generate_recommendation(scoring_score, business_rules, bki_reports, income, amount, term):
    criteria = get_all_criteria()
    pass_pct = get_float("scoring.pass_percentage", 80)
    max_score = sum(
        max((r["score_value"] for r in c["ranges"]), default=0) * c["weight"]
        for c in criteria
    )
    pass_score = pass_pct * max_score / 100 if max_score > 0 else 0

    parts = []
    score = scoring_score or 0
    rules = business_rules or {}

    if score >= pass_score:
        parts.append(f"Скоринговий бал {score:.0f} з {max_score:.0f} — позитивний.")
    elif score >= pass_score * 0.85:
        parts.append(f"Скоринговий бал {score:.0f} з {max_score:.0f} — прийнятний, середній ризик.")
    else:
        parts.append(f"Скоринговий бал {score:.0f} з {max_score:.0f} — нижче прохідного ({pass_score:.0f}).")

    if rules.get("overall_result"):
        parts.append("Клієнт відповідає всім бізнес-правилам.")
    else:
        violations = []
        if not rules.get("income_ok"):        violations.append("недостатній дохід")
        if not rules.get("dti_ok"):           violations.append("надмірне боргове навантаження")
        if not rules.get("employment_ok"):    violations.append("недостатній стаж")
        if not rules.get("employment_type_ok"): violations.append("тип зайнятості не відповідає вимогам")
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
                parts.append("Навантаження помірне.")
            else:
                parts.append("Навантаження підвищене — рекомендується зменшити суму або збільшити термін.")
    except Exception:
        pass

    if rules.get("overall_result") and score >= pass_score:
        parts.append("✅ РЕКОМЕНДАЦІЯ: Схвалити.")
    elif not rules.get("overall_result") or score < pass_score * 0.85:
        parts.append("❌ РЕКОМЕНДАЦІЯ: Відмовити.")
    else:
        parts.append("⚠️ РЕКОМЕНДАЦІЯ: Розглянути індивідуально.")

    return " ".join(parts)
