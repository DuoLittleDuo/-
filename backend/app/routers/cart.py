"""购物车：加入、修改数量、删除、清空。"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from ..auth import get_current_user
from ..database import get_db
from ..models import CartItem, Product, User
from ..schemas import CartAddRequest, CartResponse, CartUpdateRequest, cart_response

router = APIRouter(prefix="/cart", tags=["购物车"])


def _load_cart(db: Session, user_id: int) -> list[CartItem]:
    return (
        db.query(CartItem)
        .options(joinedload(CartItem.product).joinedload(Product.category))
        .filter(CartItem.user_id == user_id)
        .order_by(CartItem.created_at.desc(), CartItem.id.desc())
        .all()
    )


def _get_owned_item(db: Session, user_id: int, item_id: int) -> CartItem:
    item = (
        db.query(CartItem)
        .options(joinedload(CartItem.product).joinedload(Product.category))
        .filter(CartItem.id == item_id, CartItem.user_id == user_id)
        .first()
    )
    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="购物车条目不存在")
    return item


@router.get("", response_model=CartResponse)
def get_cart(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CartResponse:
    return cart_response(_load_cart(db, user.id))


@router.post("/items", response_model=CartResponse, status_code=status.HTTP_201_CREATED)
def add_item(
    payload: CartAddRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CartResponse:
    product = (
        db.query(Product)
        .options(joinedload(Product.category))
        .filter(Product.id == payload.product_id, Product.is_active.is_(True))
        .first()
    )
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="商品不存在或已下架")

    stock = product.stock or 0
    if stock <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="该商品暂时缺货")

    existing = (
        db.query(CartItem)
        .filter(
            CartItem.user_id == user.id,
            CartItem.product_id == payload.product_id,
        )
        .first()
    )
    current_quantity = existing.quantity if existing is not None else 0
    new_quantity = current_quantity + payload.quantity

    if new_quantity > stock:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"库存不足，「{product.name}」仅剩 {stock} 件",
        )

    if existing is not None:
        existing.quantity = new_quantity
    else:
        db.add(
            CartItem(
                user_id=user.id,
                product_id=product.id,
                quantity=payload.quantity,
            )
        )

    db.commit()
    return cart_response(_load_cart(db, user.id))


@router.patch("/items/{item_id}", response_model=CartResponse)
def update_item(
    item_id: int,
    payload: CartUpdateRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CartResponse:
    item = _get_owned_item(db, user.id, item_id)
    stock = (item.product.stock or 0) if item.product is not None else 0
    if payload.quantity > stock:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"库存不足，当前仅剩 {stock} 件",
        )

    item.quantity = payload.quantity
    db.commit()
    return cart_response(_load_cart(db, user.id))


@router.delete("/items/{item_id}", response_model=CartResponse)
def remove_item(
    item_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CartResponse:
    item = _get_owned_item(db, user.id, item_id)
    db.delete(item)
    db.commit()
    return cart_response(_load_cart(db, user.id))


@router.delete("", response_model=CartResponse)
def clear_cart(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CartResponse:
    db.query(CartItem).filter(CartItem.user_id == user.id).delete(synchronize_session=False)
    db.commit()
    return cart_response([])
