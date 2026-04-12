from fastapi import APIRouter, HTTPException
from app.schemas import ProductCreate, ProductUpdate
from app.repositories.product_repo import (
    get_all_products,
    get_all_products_manager,
    get_product_by_id,
    create_product,
    update_product,
    deactivate_product,
)

router = APIRouter()


@router.get("")
def list_products():
    """Публічний список активних продуктів (для позичальника)."""
    return get_all_products()


@router.get("/all")
def list_all_products_manager():
    """Менеджер: всі продукти включаючи неактивні."""
    return get_all_products_manager()


@router.get("/{product_id}")
def get_product(product_id: int):
    product = get_product_by_id(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.post("/create")
def create_credit_product(data: ProductCreate):
    return create_product(data)


@router.post("/update/{product_id}")
def update_credit_product(product_id: int, data: ProductUpdate):
    return update_product(product_id, data)


@router.post("/{product_id}/deactivate")
def deactivate_credit_product(product_id: int):
    return deactivate_product(product_id)
