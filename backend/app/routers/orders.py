"""订单：结算下单、列表、详情、模拟支付、确认收货、取消。"""

import math
import secrets
from datetime import datetime, timezone
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload

from ..auth import get_current_user
from ..database import get_db
from ..models import CartItem, Order, OrderItem, Product, User, utcnow
from ..schemas import CheckoutRequest, OrderOut, Page, order_out

router = APIRouter(prefix="/orders", tags=["订单"])

OrderStatus = Literal["pending", "paid", "completed", "cancelled"]


def _generate_order_no() -> str:
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
    return f"ZG{timestamp}{secrets.token_hex(3).upper()}"


def _load_order(db: Session, order_id: int) -> Order | None:
    return (
        db.query(Order)
        .options(joinedload(Order.items))
        .filter(Order.id == order_id)
        .first()
    )


def _owned_order(db: Session, order_id: int, user: User) -> Order:
    order = _load_order(db, order_id)
    if order is None or (order.user_id != user.id and not user.is_admin):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="订单不存在")
    return order


@router.post("", response_model=OrderOut, status_code=status.HTTP_201_CREATED)
def checkout(
    payload: CheckoutRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> OrderOut:
    query = (
        db.query(CartItem)
        .options(joinedload(CartItem.product).joinedload(Product.category))
        .filter(CartItem.user_id == user.id)
    )
    if payload.item_ids is not None:
        if not payload.item_ids:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="请选择要结算的商品"
            )
        query = query.filter(CartItem.id.in_(payload.item_ids))

    cart_items = query.all()
    if not cart_items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="购物车中没有可结算的商品"
        )

    problems: list[str] = []
    for cart_item in cart_items:
        product = cart_item.product
        if product is None or not product.is_active:
            problems.append("购物车中有商品已下架")
            continue
        if cart_item.quantity > (product.stock or 0):
            problems.append(
                f"「{product.name}」库存不足，仅剩 {product.stock or 0} 件"
            )
    if problems:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="；".join(problems)
        )

    total_amount = sum(
        item.product.price * item.quantity
        for item in cart_items
        if item.product is not None
    )

    order = Order(
        order_no=_generate_order_no(),
        user_id=user.id,
        status="pending",
        total_amount=total_amount,
        recipient_name=payload.recipient_name,
        recipient_phone=payload.recipient_phone,
        shipping_address=payload.shipping_address,
        remark=payload.remark,
    )
    db.add(order)
    db.flush()

    for cart_item in cart_items:
        product = cart_item.product
        if product is None:
            continue
        db.add(
            OrderItem(
                order_id=order.id,
                product_id=product.id,
                sku=product.sku,
                product_name=product.name,
                price=product.price,
                quantity=cart_item.quantity,
                cover_emoji=product.cover_emoji,
                theme_color=product.theme_color,
            )
        )
        product.stock = max(0, (product.stock or 0) - cart_item.quantity)
        db.delete(cart_item)

    db.commit()

    created = _load_order(db, order.id)
    if created is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="订单创建失败"
        )
    return order_out(created)


@router.get("", response_model=Page[OrderOut])
def list_orders(
    order_status: OrderStatus | None = Query(default=None, alias="status"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=20),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Page[OrderOut]:
    base = db.query(Order).filter(Order.user_id == user.id)
    if order_status is not None:
        base = base.filter(Order.status == order_status)

    total = base.count()
    orders = (
        base.options(joinedload(Order.items))
        .order_by(Order.created_at.desc(), Order.id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return Page[OrderOut](
        items=[order_out(order) for order in orders],
        total=total,
        page=page,
        page_size=page_size,
        pages=math.ceil(total / page_size) if total else 0,
    )


@router.get("/{order_id}", response_model=OrderOut)
def get_order(
    order_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> OrderOut:
    return order_out(_owned_order(db, order_id, user))


@router.post("/{order_id}/pay", response_model=OrderOut)
def pay_order(
    order_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> OrderOut:
    order = _owned_order(db, order_id, user)
    if order.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="当前订单状态不可支付"
        )

    order.status = "paid"
    order.paid_at = utcnow()
    db.commit()
    return order_out(order)


@router.post("/{order_id}/complete", response_model=OrderOut)
def complete_order(
    order_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> OrderOut:
    order = _owned_order(db, order_id, user)
    if order.status != "paid":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="只有待收货订单可以确认收货"
        )

    order.status = "completed"
    order.completed_at = utcnow()
    db.commit()
    return order_out(order)


@router.post("/{order_id}/cancel", response_model=OrderOut)
def cancel_order(
    order_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> OrderOut:
    order = _owned_order(db, order_id, user)
    if order.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="只有待支付订单可以取消",
        )

    for item in order.items:
        if item.product_id is None:
            continue
        product = db.get(Product, item.product_id)
        if product is not None:
            product.stock = (product.stock or 0) + item.quantity

    order.status = "cancelled"
    order.cancelled_at = utcnow()
    db.commit()
    return order_out(order)
