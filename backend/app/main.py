import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers.dictionaries_routes import router as dictionaries_router
from app.routers.application_routes import router as application_router
from app.routers.customer_routes import router as customer_router
from app.routers.manager_routes import router as manager_router
from app.routers.auth_routes import router as auth_router
from app.routers.product_routes import router as product_router
from app.routers import payment_routes
from app.routers.blacklist_routes import router as blacklist_router
from app.routers.settings_routes import router as settings_router


app = FastAPI(title="Credit Bureau API")

# CORS — читається з env щоб легко додавати Vercel URL
_cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:5174")
ALLOWED_ORIGINS = [o.strip() for o in _cors_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(application_router, prefix="/application", tags=["Application"])
app.include_router(customer_router, prefix="/customer", tags=["Customer"])
app.include_router(manager_router, prefix="/manager", tags=["Manager"])
app.include_router(auth_router, prefix="/auth", tags=["Auth"])
app.include_router(dictionaries_router, prefix="/dictionaries", tags=["Dictionaries"])
app.include_router(product_router, prefix="/product", tags=["Product"])
app.include_router(payment_routes.router, prefix="/payment", tags=["Payment"])
app.include_router(blacklist_router, prefix="/blacklist", tags=["Blacklist"])
app.include_router(settings_router, prefix="/settings", tags=["Settings"])


@app.get("/")
def root():
    return {"status": "API is running"}
