from datetime import date
from dateutil.relativedelta import relativedelta


# === Ануїтетний місячний платіж ===
def calculate_monthly_payment(amount: float, months: int, interest_rate: float) -> float:
    """
    Формула ануїтетного платежу.
    interest_rate — річна ставка у %
    """
    r = interest_rate / 100 / 12  # місячна ставка

    if r == 0:
        return round(amount / months, 2)

    payment = amount * (r * (1 + r) ** months) / ((1 + r) ** months - 1)
    return round(payment, 2)


# === Перше число наступного місяця ===
def next_month_first_day() -> date:
    today = date.today()
    next_month = today.replace(day=1) + relativedelta(months=1)
    return next_month


# === Генерація календаря платежів ===
def generate_payment_schedule(amount: float, months: int, interest_rate: float):
    monthly_payment = calculate_monthly_payment(amount, months, interest_rate)

    payments = []
    pay_date = next_month_first_day()

    for i in range(months):
        payments.append({
            "payment_number": i + 1,
            "payment_date": pay_date,
            "amount": monthly_payment
        })

        pay_date = pay_date + relativedelta(months=1)

    return payments
