"""商品类目。"""

from fastapi import APIRouter, Depends
from sqlalchemy import and_, func
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Category, Product
from ..schemas import CategoryOut

router = APIRouter(prefix="/categories", tags=["类目"])


@router.get("", response_model=list[CategoryOut])
def list_categories(db: Session = Depends(get_db)) -> list[CategoryOut]:
    rows = (
        db.query(Category, func.count(Product.id))
        .outerjoin(
            Product,
            and_(Product.category_id == Category.id, Product.is_active.is_(True)),
        )
        .group_by(Category.id)
        .order_by(Category.sort_order.asc(), Category.id.asc())
        .all()
    )

    return [
        CategoryOut(
            id=category.id,
            name=category.name,
            slug=category.slug,
            emoji=category.emoji,
            description=category.description,
            sort_order=category.sort_order,
            product_count=count,
        )
        for category, count in rows
    ]
