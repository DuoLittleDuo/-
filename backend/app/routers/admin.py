"""管理接口：重建向量索引、搜索统计。仅管理员可用。"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..auth import require_admin
from ..database import get_db
from ..models import Category, Favorite, Order, Product, SearchLog, User
from ..schemas import AdminReindexResponse, AdminStatsResponse, TopQueryOut
from ..services.search_service import search_service

router = APIRouter(
    prefix="/admin",
    tags=["管理"],
    dependencies=[Depends(require_admin)],
)


@router.post("/reindex", response_model=AdminReindexResponse)
def reindex(db: Session = Depends(get_db)) -> AdminReindexResponse:
    result = search_service.build_index(db, force=True)
    if not result.get("ok"):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=result.get("error") or result.get("message") or "索引构建失败",
        )
    return AdminReindexResponse(
        ok=True,
        count=result["count"],
        duration_ms=result["duration_ms"],
        backend=result["backend"],
        model=result["model"],
        message=result.get("message", ""),
    )


@router.get("/stats", response_model=AdminStatsResponse)
def stats(db: Session = Depends(get_db)) -> AdminStatsResponse:
    top_rows = (
        db.query(SearchLog.normalized_query, func.count(SearchLog.id).label("count"))
        .filter(SearchLog.normalized_query != "")
        .group_by(SearchLog.normalized_query)
        .order_by(func.count(SearchLog.id).desc())
        .limit(10)
        .all()
    )

    return AdminStatsResponse(
        users=db.query(func.count(User.id)).scalar() or 0,
        products=db.query(func.count(Product.id)).scalar() or 0,
        categories=db.query(func.count(Category.id)).scalar() or 0,
        favorites=db.query(func.count(Favorite.id)).scalar() or 0,
        orders=db.query(func.count(Order.id)).scalar() or 0,
        searches=db.query(func.count(SearchLog.id)).scalar() or 0,
        top_queries=[TopQueryOut(query=row[0], count=row[1]) for row in top_rows],
    )
