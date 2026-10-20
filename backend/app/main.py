"""FastAPI 入口。"""

import logging
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func, text
from sqlalchemy.orm import Session

from .config import settings
from .database import Base, engine, get_db
from .models import Category, Product, User
from .routers import admin, auth, cart, categories, favorites, orders, products, search
from .schemas import HealthResponse
from .services.search_service import search_service

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    if settings.secret_key == "dev-only-change-me":
        logger.warning("SECRET_KEY 仍是默认值，部署前请在 backend/.env 中修改")
    search_service.start_warmup()
    logger.info("%s 已启动，接口文档：/docs", settings.app_name)
    yield
    logger.info("%s 已停止", settings.app_name)


app = FastAPI(
    title=settings.app_name,
    description="柘沟土陶 × 宠物经济 —— 宠物陶器文创商城演示后端",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

API_PREFIX = "/api"
app.include_router(auth.router, prefix=API_PREFIX)
app.include_router(categories.router, prefix=API_PREFIX)
app.include_router(products.router, prefix=API_PREFIX)
app.include_router(search.router, prefix=API_PREFIX)
app.include_router(favorites.router, prefix=API_PREFIX)
app.include_router(cart.router, prefix=API_PREFIX)
app.include_router(orders.router, prefix=API_PREFIX)
app.include_router(admin.router, prefix=API_PREFIX)


@app.get("/", tags=["默认"])
def root() -> dict:
    return {
        "name": settings.app_name,
        "docs": "/docs",
        "health": f"{API_PREFIX}/health",
    }


@app.get(f"{API_PREFIX}/health", response_model=HealthResponse, tags=["默认"])
def health(db: Session = Depends(get_db)) -> HealthResponse:
    database_ok = True
    try:
        db.execute(text("SELECT 1"))
    except Exception:  # noqa: BLE001
        database_ok = False

    return HealthResponse(
        status="ok" if database_ok else "degraded",
        app=settings.app_name,
        database="ok" if database_ok else "error",
        users=db.query(func.count(User.id)).scalar() or 0,
        categories=db.query(func.count(Category.id)).scalar() or 0,
        products=db.query(func.count(Product.id)).scalar() or 0,
        semantic=search_service.status(),
    )
