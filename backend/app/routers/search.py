"""语义搜索接口。"""

import logging

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from ..auth import get_optional_user
from ..database import get_db
from ..models import SearchLog, User
from ..schemas import SearchResponse
from ..services.search_service import search_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/search", tags=["搜索"])


@router.get("", response_model=SearchResponse)
def search(
    q: str = Query(..., min_length=1, max_length=100, description="搜索关键词"),
    category_id: int | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=12, ge=1, le=24),
    db: Session = Depends(get_db),
    user: User | None = Depends(get_optional_user),
) -> SearchResponse:
    result = search_service.search(
        db, q, category_id=category_id, page=page, page_size=page_size
    )

    top_item = result.items[0] if result.items else None
    try:
        db.add(
            SearchLog(
                user_id=user.id if user is not None else None,
                query=q[:100],
                normalized_query=result.normalized_query[:100],
                mode=result.mode,
                result_count=result.total,
                top_product_id=top_item.product.id if top_item is not None else None,
                top_score=top_item.score if top_item is not None else None,
                took_ms=result.took_ms,
            )
        )
        db.commit()
    except Exception as exc:  # noqa: BLE001 - 日志失败不影响搜索
        db.rollback()
        logger.warning("搜索日志写入失败：%s", exc)

    return result
