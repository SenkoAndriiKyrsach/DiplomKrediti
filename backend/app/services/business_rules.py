from decimal import Decimal
from app.settings import get_business_rules


def check_rules(income, amount, term, employment_term, employment_type):
    r = get_business_rules()

    income_ok         = float(income) >= r["min_income"]
    dti_ok            = float(amount) / int(term) < float(income) * r["dti_max"]
    employment_ok     = int(employment_term) >= r["min_employment_months"]
    employment_type_ok = int(employment_type) != r["forbidden_employment_type"]

    overall = income_ok and dti_ok and employment_ok and employment_type_ok
    return income_ok, dti_ok, employment_ok, employment_type_ok, overall
