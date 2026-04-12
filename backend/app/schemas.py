from pydantic import BaseModel
from typing import Optional


# ========================================================================
#                            AUTH
# ========================================================================
class RegisterInput(BaseModel):
    login: str
    password: str
    full_name: str


class LoginInput(BaseModel):
    login: str
    password: str


# ========================================================================
#                            APPLICATION
# ========================================================================
class ApplicationCreate(BaseModel):
    customer_id: int
    product_id: int
    amount_requested: float
    term_months: int
    purpose: str
    down_payment_amount: float = 0.0


class DecisionInput(BaseModel):
    manager_id: int
    final_decision: str
    comment: Optional[str] = None
    corrected_amount: Optional[float] = None
    corrected_term: Optional[int] = None


# ========================================================================
#                            CREDIT PRODUCT
# ========================================================================
class ProductCreate(BaseModel):
    product_name: str
    description: str
    interest_rate: float
    min_term: int
    max_term: int
    min_amount: int
    max_amount: int
    down_payment_pct: float = 0.0
    target_group: Optional[str] = None


class ProductUpdate(ProductCreate):
    is_active: bool = True


# backward-compat alias (old code may import ProductUpdate)


# ========================================================================
#                            BLACKLIST
# ========================================================================
class BlacklistAdd(BaseModel):
    customer_id: int
    reason: str
