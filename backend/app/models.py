"""SQLAlchemy 数据模型。"""

from datetime import datetime, timezone

from sqlalchemy import (
    JSON,
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship

from .database import Base


def utcnow() -> datetime:
    """SQLite 友好的 UTC 朴素时间。"""
    return datetime.now(timezone.utc).replace(tzinfo=None)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    display_name = Column(String(50))
    is_admin = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, nullable=False, default=utcnow)

    favorites = relationship("Favorite", back_populates="user", cascade="all, delete-orphan")
    cart_items = relationship("CartItem", back_populates="user", cascade="all, delete-orphan")
    orders = relationship("Order", back_populates="user", cascade="all, delete-orphan")


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True)
    name = Column(String(50), nullable=False)
    slug = Column(String(50), unique=True, nullable=False, index=True)
    emoji = Column(String(8), default="🏺")
    description = Column(String(200))
    sort_order = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, nullable=False, default=utcnow)

    products = relationship("Product", back_populates="category")


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True)
    sku = Column(String(32), unique=True, nullable=False, index=True)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False, index=True)

    name = Column(String(120), nullable=False)
    subtitle = Column(String(200))
    description = Column(Text)
    price = Column(Integer, nullable=False)  # 单位：元
    original_price = Column(Integer)
    stock = Column(Integer, nullable=False, default=0)
    sales_count = Column(Integer, nullable=False, default=0)
    hot_score = Column(Integer, nullable=False, default=0)
    is_hot = Column(Boolean, nullable=False, default=False)

    pet_type = Column(String(10), nullable=False, default="通用")  # 猫 / 犬 / 通用
    material = Column(String(80))
    craft = Column(String(50))
    spec_text = Column(String(120))
    tags = Column(JSON, nullable=False, default=list)

    # 内部检索文档，不返回给前端
    search_text = Column(Text, nullable=False, default="")

    # 图片后续接入；当前使用 emoji + 主题色占位
    image_url = Column(String(255))
    cover_emoji = Column(String(8), default="🏺")
    theme_color = Column(String(16), default="#B85C38")

    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, nullable=False, default=utcnow)
    updated_at = Column(DateTime, nullable=False, default=utcnow, onupdate=utcnow)

    category = relationship("Category", back_populates="products")
    favorites = relationship("Favorite", back_populates="product", cascade="all, delete-orphan")
    cart_items = relationship("CartItem", back_populates="product", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_products_category_active", "category_id", "is_active"),
        Index("ix_products_hot", "is_hot", "hot_score"),
        Index("ix_products_active", "is_active"),
    )


class Favorite(Base):
    __tablename__ = "favorites"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id = Column(
        Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True
    )
    created_at = Column(DateTime, nullable=False, default=utcnow)

    user = relationship("User", back_populates="favorites")
    product = relationship("Product", back_populates="favorites")

    __table_args__ = (
        UniqueConstraint("user_id", "product_id", name="uq_favorite_user_product"),
    )


class CartItem(Base):
    __tablename__ = "cart_items"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id = Column(
        Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True
    )
    quantity = Column(Integer, nullable=False, default=1)
    created_at = Column(DateTime, nullable=False, default=utcnow)
    updated_at = Column(DateTime, nullable=False, default=utcnow, onupdate=utcnow)

    user = relationship("User", back_populates="cart_items")
    product = relationship("Product", back_populates="cart_items")

    __table_args__ = (
        UniqueConstraint("user_id", "product_id", name="uq_cart_user_product"),
    )


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True)
    order_no = Column(String(32), unique=True, nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    # pending 待支付 / paid 待收货 / completed 已完成 / cancelled 已取消
    status = Column(String(20), nullable=False, default="pending", index=True)
    total_amount = Column(Integer, nullable=False, default=0)

    recipient_name = Column(String(50), nullable=False)
    recipient_phone = Column(String(20), nullable=False)
    shipping_address = Column(String(255), nullable=False)
    remark = Column(String(255))

    created_at = Column(DateTime, nullable=False, default=utcnow, index=True)
    paid_at = Column(DateTime)
    cancelled_at = Column(DateTime)
    completed_at = Column(DateTime)

    user = relationship("User", back_populates="orders")
    items = relationship(
        "OrderItem",
        back_populates="order",
        cascade="all, delete-orphan",
        order_by="OrderItem.id",
    )


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True)
    order_id = Column(
        Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True
    )
    product_id = Column(
        Integer, ForeignKey("products.id", ondelete="SET NULL"), nullable=True, index=True
    )

    # 下单时的商品快照，避免商品改价/下架影响历史订单
    sku = Column(String(32), nullable=False)
    product_name = Column(String(120), nullable=False)
    price = Column(Integer, nullable=False)
    quantity = Column(Integer, nullable=False)
    cover_emoji = Column(String(8))
    theme_color = Column(String(16))

    order = relationship("Order", back_populates="items")


class SearchLog(Base):
    __tablename__ = "search_logs"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    query = Column(String(100), nullable=False)
    normalized_query = Column(String(100), nullable=False, index=True)
    mode = Column(String(20), nullable=False, default="keyword")
    result_count = Column(Integer, nullable=False, default=0)
    top_product_id = Column(Integer, ForeignKey("products.id", ondelete="SET NULL"), nullable=True)
    top_score = Column(Float)
    took_ms = Column(Float)
    created_at = Column(DateTime, nullable=False, default=utcnow, index=True)
