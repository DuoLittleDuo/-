"""把 backend/app/seed.py 里的演示商品导出成前端本地数据模块。

只读取后端文件，绝不修改。生成的 src/data/catalog.js 用于演示模式
（后端不可用时仍可完整浏览）。

用法（项目根目录）：
    python frontend/scripts/export_catalog.py
"""

from __future__ import annotations

import ast
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SEED = ROOT / "backend" / "app" / "seed.py"
OUT = ROOT / "frontend" / "src" / "data" / "catalog.js"

CREATED_AT = "2026-01-01T00:00:00+08:00"


def read_constants() -> tuple[list[dict], dict[str, list[dict]]]:
    tree = ast.parse(SEED.read_text(encoding="utf-8"))
    values: dict[str, object] = {}
    for node in tree.body:
        if isinstance(node, ast.Assign) and len(node.targets) == 1:
            target = node.targets[0]
            if isinstance(target, ast.Name) and target.id in {"CATEGORIES", "PRODUCTS"}:
                values[target.id] = ast.literal_eval(node.value)
        elif isinstance(node, ast.AnnAssign) and isinstance(node.target, ast.Name):
            if node.target.id in {"CATEGORIES", "PRODUCTS"} and node.value is not None:
                values[node.target.id] = ast.literal_eval(node.value)
    return values["CATEGORIES"], values["PRODUCTS"]


def main() -> None:
    categories_raw, products_raw = read_constants()

    categories = []
    category_by_slug = {}
    for index, item in enumerate(categories_raw, start=1):
        category = {
            "id": index,
            "name": item["name"],
            "slug": item["slug"],
            "emoji": item.get("emoji", "🏺"),
            "description": item.get("description", ""),
            "sort_order": item.get("sort_order", index),
            "product_count": len(products_raw.get(item["slug"], [])),
        }
        categories.append(category)
        category_by_slug[item["slug"]] = category

    products = []
    product_id = 1
    for slug, items in products_raw.items():
        category = category_by_slug[slug]
        for item in items:
            products.append(
                {
                    "id": product_id,
                    "sku": item["sku"],
                    "name": item["name"],
                    "subtitle": item.get("subtitle", ""),
                    "description": item.get("description", ""),
                    "category_id": category["id"],
                    "category_name": category["name"],
                    "category_slug": slug,
                    "price": item["price"],
                    "original_price": item.get("original_price"),
                    "pet_type": item.get("pet_type", "通用"),
                    "craft": item.get("craft", ""),
                    "material": item.get("material", "柘沟五色陶土"),
                    "spec_text": item.get("spec_text", ""),
                    "tags": item.get("tags", []),
                    "stock": item.get("stock", 0),
                    "sales_count": item.get("sales_count", 0),
                    "hot_score": item.get("hot_score", 0),
                    "is_hot": bool(item.get("is_hot", False)),
                    "cover_emoji": item.get("emoji", "🏺"),
                    "theme_color": item.get("color", "#A85132"),
                    "image_url": None,
                    "created_at": CREATED_AT,
                }
            )
            product_id += 1

    payload = {"categories": categories, "products": products}
    body = json.dumps(payload, ensure_ascii=False, indent=2)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(
        "// 由 frontend/scripts/export_catalog.py 从 backend/app/seed.py 生成，请勿手改。\n"
        f"export default {body}\n",
        encoding="utf-8",
    )
    print(f"已生成 {OUT}：{len(categories)} 个类目、{len(products)} 件商品")


if __name__ == "__main__":
    main()
