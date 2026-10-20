"""Pydantic 请求 / 响应模型。"""

from datetime import datetime
from typing import Generic, TypeVar

from pydantic import BaseModel, ConfigDict, Field, field_validator

from .models import CartItem, Order, OrderItem, Product

T = TypeVar("T")


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# ---------- 用户与认证 ----------


class UserOut(ORMModel):
    id: int
    username: str
    display_name: str | None = None
    is_admin: bool
    created_at: datetime


class RegisterRequest(BaseModel):
    username: str = Field(min_length=3, max_length=30)
    password: str = Field(min_length=6, max_length=128)
    display_name: str | None = Field(default=None, max_length=50)

    @field_validator("username")
    @classmethod
    def _strip_username(cls, value: str) -> str:
        value = value.strip()
        if len(value) < 3:
            raise ValueError("用户名至少 3 个字符")
        return value

    @field_validator("display_name")
    @classmethod
    def _strip_display_name(cls, value: str | None) -> str | None:
        if value is None:
            return None
        value = value.strip()
        return value or None


class LoginRequest(BaseModel):
    username: str = Field(min_length=1, max_length=30)
    password: str = Field(min_length=1, max_length=128)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserOut


# ---------- 商品 ----------


class CategoryOut(BaseModel):
    id: int
    name: str
    slug: str
    emoji: str | None = "🏺"
    description: str | None = None
    sort_order: int = 0
    product_count: int = 0


class ProductCardOut(BaseModel):
    id: int
    sku: str
    name: str
    subtitle: str | None = None
    category_id: int
    category_name: str = ""
    price: int
    original_price: int | None = None
    pet_type: str = "通用"
    tags: list[str] = Field(default_factory=list)
    cover_emoji: str | None = "🏺"
    theme_color: str | None = "#B85C38"
    sales_count: int = 0
    stock: int = 0
    is_hot: bool = False
    image_url: str | None = None


class ProductDetailOut(ProductCardOut):
    description: str | None = None
    material: str | None = None
    craft: str | None = None
    spec_text: str | None = None
    created_at: datetime


# ---------- 分页 ----------


class Page(BaseModel, Generic[T]):
    items: list[T]
    total: int
    page: int
    page_size: int
    pages: int


# ---------- 搜索 ----------


class SearchItemOut(BaseModel):
    product: ProductCardOut
    score: float
    similarity: float | None = None  # 余弦相似度百分比 0-100
    match_reason: str = ""
    matched_terms: list[str] = Field(default_factory=list)


class SearchResponse(BaseModel):
    query: str
    normalized_query: str
    mode: str  # hybrid / keyword
    semantic_ready: bool
    total: int
    page: int
    page_size: int
    pages: int
    took_ms: float
    items: list[SearchItemOut]


class RelatedItemOut(BaseModel):
    product: ProductCardOut
    similarity: float | None = None


class RelatedResponse(BaseModel):
    mode: str  # semantic / category
    items: list[RelatedItemOut]


# ---------- 收藏 ----------


class FavoriteOut(BaseModel):
    id: int
    created_at: datetime
    product: ProductCardOut


class FavoriteIdsResponse(BaseModel):
    product_ids: list[int]


class FavoriteToggleResponse(BaseModel):
    product_id: int
    favorited: bool


# ---------- 购物车 ----------


class CartAddRequest(BaseModel):
    product_id: int
    quantity: int = Field(default=1, ge=1, le=99)


class CartUpdateRequest(BaseModel):
    quantity: int = Field(default=1, ge=1, le=99)


class CartItemOut(BaseModel):
    id: int
    product: ProductCardOut
    quantity: int
    subtotal: int
    created_at: datetime


class CartResponse(BaseModel):
    items: list[CartItemOut]
    total_quantity: int
    total_amount: int


# ---------- 订单 ----------


ORDER_STATUS_LABELS = {
    "pending": "待支付",
    "paid": "待收货",
    "completed": "已完成",
    "cancelled": "已取消",
}


class CheckoutRequest(BaseModel):
    recipient_name: str = Field(min_length=1, max_length=50)
    recipient_phone: str = Field(min_length=5, max_length=20)
    shipping_address: str = Field(min_length=5, max_length=255)
    remark: str | None = Field(default=None, max_length=255)
    item_ids: list[int] | None = None

    @field_validator("recipient_name", "recipient_phone", "shipping_address")
    @classmethod
    def _strip_required(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("不能为空")
        return value

    @field_validator("remark")
    @classmethod
    def _strip_remark(cls, value: str | None) -> str | None:
        if value is None:
            return None
        value = value.strip()
        return value or None


class OrderItemOut(BaseModel):
    id: int
    product_id: int | None = None
    sku: str
    product_name: str
    price: int
    quantity: int
    cover_emoji: str | None = None
    theme_color: str | None = None
    subtotal: int


class OrderOut(BaseModel):
    id: int
    order_no: str
    status: str
    status_label: str
    total_amount: int
    total_quantity: int
    recipient_name: str
    recipient_phone: str
    shipping_address: str
    remark: str | None = None
    created_at: datetime
    paid_at: datetime | None = None
    cancelled_at: datetime | None = None
    completed_at: datetime | None = None
    items: list[OrderItemOut] = Field(default_factory=list)


# ---------- 管理与健康检查 ----------


class TopQueryOut(BaseModel):
    query: str
    count: int


class AdminStatsResponse(BaseModel):
    users: int
    products: int
    categories: int
    favorites: int
    orders: int
    searches: int
    top_queries: list[TopQueryOut]


class AdminReindexResponse(BaseModel):
    ok: bool
    count: int
    duration_ms: float
    backend: str
    model: str
    message: str = ""


class HealthResponse(BaseModel):
    status: str
    app: str
    database: str
    users: int
    categories: int
    products: int
    semantic: dict


# ---------- ORM -> Schema 辅助 ----------


def product_card(product: Product) -> ProductCardOut:
    return ProductCardOut(
        id=product.id,
        sku=product.sku,
        name=product.name,
        subtitle=product.subtitle,
        category_id=product.category_id,
        category_name=product.category.name if product.category is not None else "",
        price=product.price,
        original_price=product.original_price,
        pet_type=product.pet_type or "通用",
        tags=list(product.tags or []),
        cover_emoji=product.cover_emoji or "🏺",
        theme_color=product.theme_color or "#B85C38",
        sales_count=product.sales_count or 0,
        stock=product.stock or 0,
        is_hot=bool(product.is_hot),
        image_url=product.image_url,
    )


def product_detail(product: Product) -> ProductDetailOut:
    card = product_card(product)
    return ProductDetailOut(
        **card.model_dump(),
        description=product.description,
        material=product.material,
        craft=product.craft,
        spec_text=product.spec_text,
        created_at=product.created_at,
    )


def cart_item_out(item: CartItem) -> CartItemOut:
    card = product_card(item.product)
    return CartItemOut(
        id=item.id,
        product=card,
        quantity=item.quantity,
        subtotal=card.price * item.quantity,
        created_at=item.created_at,
    )


def cart_response(items: list[CartItem]) -> CartResponse:
    payload = [cart_item_out(item) for item in items]
    return CartResponse(
        items=payload,
        total_quantity=sum(item.quantity for item in payload),
        total_amount=sum(item.subtotal for item in payload),
    )


def order_item_out(item: OrderItem) -> OrderItemOut:
    return OrderItemOut(
        id=item.id,
        product_id=item.product_id,
        sku=item.sku,
        product_name=item.product_name,
        price=item.price,
        quantity=item.quantity,
        cover_emoji=item.cover_emoji,
        theme_color=item.theme_color,
        subtotal=item.price * item.quantity,
    )


def order_out(order: Order) -> OrderOut:
    items = [order_item_out(item) for item in order.items]
    return OrderOut(
        id=order.id,
        order_no=order.order_no,
        status=order.status,
        status_label=ORDER_STATUS_LABELS.get(order.status, order.status),
        total_amount=order.total_amount,
        total_quantity=sum(item.quantity for item in items),
        recipient_name=order.recipient_name,
        recipient_phone=order.recipient_phone,
        shipping_address=order.shipping_address,
        remark=order.remark,
        created_at=order.created_at,
        paid_at=order.paid_at,
        cancelled_at=order.cancelled_at,
        completed_at=order.completed_at,
        items=items,
    )
