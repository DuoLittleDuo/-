"""商品列表、热销、详情与相关推荐。"""

import math
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload

from ..database import get_db
from ..models import Product
from ..schemas import (
    Page,
    ProductCardOut,
    ProductDetailOut,
    RelatedResponse,
    product_card,
    product_detail,
)
from ..services.search_service import search_service

router = APIRouter(prefix="/products", tags=["商品"])


def _page(items: list, total: int, page: int, page_size: int) -> dict:
    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": math.ceil(total / page_size) if total else 0,
    }


@router.get("", response_model=Page[ProductCardOut])
def list_products(
    category_id: int | None = Query(default=None),
    pet_type: Literal["猫", "犬", "通用"] | None = Query(default=None),
    sort: Literal["hot", "new", "price_asc", "price_desc"] = Query(default="hot"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=12, ge=1, le=24),
    db: Session = Depends(get_db),
) -> Page[ProductCardOut]:
    base = db.query(Product).filter(Product.is_active.is_(True))
    if category_id is not None:
        base = base.filter(Product.category_id == category_id)
    if pet_type is not None:
        base = base.filter(Product.pet_type == pet_type)

    total = base.count()

    if sort == "new":
        order = (Product.created_at.desc(), Product.id.desc())
    elif sort == "price_asc":
        order = (Product.price.asc(), Product.id.asc())
    elif sort == "price_desc":
        order = (Product.price.desc(), Product.id.desc())
    else:
        order = (
            Product.is_hot.desc(),
            Product.hot_score.desc(),
            Product.sales_count.desc(),
            Product.id.asc(),
        )

    products = (
        base.options(joinedload(Product.category))
        .order_by(*order)
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return Page[ProductCardOut](
        **_page([product_card(item) for item in products], total, page, page_size)
    )


@router.get("/hot", response_model=list[ProductCardOut])
def hot_products(
    limit: int = Query(default=8, ge=1, le=20),
    db: Session = Depends(get_db),
) -> list[ProductCardOut]:
    products = (
        db.query(Product)
        .options(joinedload(Product.category))
        .filter(Product.is_active.is_(True), Product.is_hot.is_(True))
        .order_by(Product.hot_score.desc(), Product.sales_count.desc(), Product.id.asc())
        .limit(limit)
        .all()
    )
    return [product_card(item) for item in products]


@router.get("/{product_id}", response_model=ProductDetailOut)
def get_product(product_id: int, db: Session = Depends(get_db)) -> ProductDetailOut:
    product = (
        db.query(Product)
        .options(joinedload(Product.category))
        .filter(Product.id == product_id, Product.is_active.is_(True))
        .first()
    )
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="商品不存在或已下架")
    return product_detail(product)


@router.get("/{product_id}/related", response_model=RelatedResponse)
def related_products(
    product_id: int,
    limit: int = Query(default=6, ge=1, le=12),
    db: Session = Depends(get_db),
) -> RelatedResponse:
    product = (
        db.query(Product)
        .options(joinedload(Product.category))
        .filter(Product.id == product_id, Product.is_active.is_(True))
        .first()
    )
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="商品不存在或已下架")
    return search_service.get_related(db, product, limit)
