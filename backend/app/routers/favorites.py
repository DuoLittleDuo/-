"""收藏增删查。"""

import math

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session, joinedload

from ..auth import get_current_user
from ..database import get_db
from ..models import Favorite, Product, User
from ..schemas import (
    FavoriteIdsResponse,
    FavoriteOut,
    FavoriteToggleResponse,
    Page,
    product_card,
)

router = APIRouter(prefix="/favorites", tags=["收藏"])


@router.get("/ids", response_model=FavoriteIdsResponse)
def favorite_ids(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> FavoriteIdsResponse:
    rows = db.query(Favorite.product_id).filter(Favorite.user_id == user.id).all()
    return FavoriteIdsResponse(product_ids=[row[0] for row in rows])


@router.get("", response_model=Page[FavoriteOut])
def list_favorites(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=12, ge=1, le=24),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Page[FavoriteOut]:
    base = (
        db.query(Favorite)
        .join(Product, Favorite.product_id == Product.id)
        .filter(Favorite.user_id == user.id, Product.is_active.is_(True))
    )
    total = base.count()

    favorites = (
        base.options(
            joinedload(Favorite.product).joinedload(Product.category)
        )
        .order_by(Favorite.created_at.desc(), Favorite.id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    items = [
        FavoriteOut(
            id=favorite.id,
            created_at=favorite.created_at,
            product=product_card(favorite.product),
        )
        for favorite in favorites
        if favorite.product is not None
    ]

    return Page[FavoriteOut](
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        pages=math.ceil(total / page_size) if total else 0,
    )


@router.post("/{product_id}", response_model=FavoriteToggleResponse)
def add_favorite(
    product_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> FavoriteToggleResponse:
    product = db.get(Product, product_id)
    if product is None or not product.is_active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="商品不存在或已下架")

    existing = (
        db.query(Favorite)
        .filter(Favorite.user_id == user.id, Favorite.product_id == product_id)
        .first()
    )
    if existing is None:
        db.add(Favorite(user_id=user.id, product_id=product_id))
        db.commit()

    return FavoriteToggleResponse(product_id=product_id, favorited=True)


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_favorite(
    product_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Response:
    favorite = (
        db.query(Favorite)
        .filter(Favorite.user_id == user.id, Favorite.product_id == product_id)
        .first()
    )
    if favorite is not None:
        db.delete(favorite)
        db.commit()

    return Response(status_code=status.HTTP_204_NO_CONTENT)
