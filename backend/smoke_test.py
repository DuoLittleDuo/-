"""后端接口验收脚本（需先启动 uvicorn）。

用法（在 backend 目录下）：
    python smoke_test.py
"""

import json
import sys
import urllib.error
import urllib.parse
import urllib.request

BASE = "http://127.0.0.1:8000/api"

QUERIES = [
    "狗吃饭的碗",
    "猫咪喝水器皿",
    "给狗狗的陶瓷饭盆",
    "宠物纪念罐",
    "人宠同系",
    "绞胎",
    "猫挂牌",
    "量子猫粮",
]

passed = 0
failed = 0


def call(method: str, path: str, data=None, token: str | None = None, timeout: int = 90):
    url = BASE + path
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    body = json.dumps(data).encode("utf-8") if data is not None else None
    request = urllib.request.Request(url, data=body, headers=headers, method=method)

    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            raw = response.read()
            return response.status, json.loads(raw) if raw else None
    except urllib.error.HTTPError as error:
        raw = error.read()
        return error.code, json.loads(raw) if raw else None


def check(name: str, condition: bool, detail: str = "") -> None:
    global passed, failed
    if condition:
        passed += 1
        print(f"[PASS] {name}")
    else:
        failed += 1
        print(f"[FAIL] {name} {detail}")


def main() -> None:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")

    print("=" * 64)
    print("柘沟陶宠后端接口验收")
    print("=" * 64)

    status, health = call("GET", "/health")
    check("健康检查 /health", status == 200 and health.get("database") == "ok", str(health))
    semantic = (health or {}).get("semantic", {})
    print(
        "       语义检索：ready={ready} backend={backend} index={index_count}".format(
            ready=semantic.get("ready"),
            backend=semantic.get("backend"),
            index_count=semantic.get("index_count"),
        )
    )

    status, login = call(
        "POST", "/auth/login", {"username": "demo", "password": "demo123456"}
    )
    check("演示账号登录", status == 200 and "access_token" in (login or {}), str(login))

    status, wrong = call(
        "POST", "/auth/login", {"username": "demo", "password": "wrong-password"}
    )
    check("错误密码返回 401", status == 401, str(wrong))

    token = (login or {}).get("access_token")

    status, me = call("GET", "/auth/me", token=token)
    check("获取当前用户", status == 200 and me.get("username") == "demo", str(me))

    status, categories = call("GET", "/categories")
    check(
        "类目数量为 5",
        status == 200 and isinstance(categories, list) and len(categories) == 5,
        str(categories),
    )

    status, hot = call("GET", "/products/hot?limit=8")
    check(
        "热销商品为 8 件",
        status == 200 and isinstance(hot, list) and len(hot) == 8,
        f"count={len(hot) if isinstance(hot, list) else 'n/a'}",
    )

    status, products = call("GET", "/products?page=1&page_size=12")
    check(
        "商品分页接口",
        status == 200 and products.get("total") == 35 and len(products.get("items", [])) == 12,
        str(products)[:200],
    )

    status, detail = call("GET", "/products/1")
    check("商品详情", status == 200 and detail.get("id") == 1, str(detail)[:200])

    status, missing = call("GET", "/products/99999")
    check("不存在的商品返回 404", status == 404, str(missing))

    print("-" * 64)
    print("语义检索验收：")
    for query in QUERIES:
        encoded = urllib.parse.quote(query)
        status, result = call("GET", f"/search?q={encoded}&page=1&page_size=6")
        items = (result or {}).get("items", [])
        top = items[:3]
        top_text = " / ".join(
            "{name}（{category}, {similarity}%）".format(
                name=item["product"]["name"],
                category=item["product"]["category_name"],
                similarity=item.get("similarity"),
            )
            for item in top
        )
        print(
            f"  [{query}] status={status} mode={result.get('mode')} "
            f"total={result.get('total')} took={result.get('took_ms')}ms"
        )
        print(f"      top3: {top_text or '（无结果）'}")
        check(f"搜索「{query}」返回 200", status == 200, str(result)[:200])

    status, related = call("GET", "/products/1/related?limit=6")
    check(
        "相关推荐接口",
        status == 200 and len(related.get("items", [])) == 6,
        f"mode={related.get('mode')} count={len(related.get('items', []))}",
    )
    if related.get("items"):
        print(
            "       相关推荐 top3: "
            + " / ".join(item["product"]["name"] for item in related["items"][:3])
        )

    print("-" * 64)
    status, _ = call("DELETE", "/favorites/1", token=token)
    status, added = call("POST", "/favorites/1", token=token)
    check("收藏商品", status == 200 and added.get("favorited") is True, str(added))

    status, ids = call("GET", "/favorites/ids", token=token)
    check("收藏 ID 列表包含商品 1", status == 200 and 1 in ids.get("product_ids", []), str(ids))

    status, favorites = call("GET", "/favorites?page=1&page_size=12", token=token)
    check("收藏分页列表", status == 200 and favorites.get("total", 0) >= 1, str(favorites)[:200])

    status, _ = call("POST", "/favorites/1", token=token)
    check("重复收藏幂等", status == 200)

    status, _ = call("DELETE", "/favorites/1", token=token)
    check("取消收藏返回 204", status == 204, str(status))

    status, unauthorized = call("GET", "/favorites")
    check("未登录访问收藏返回 401", status == 401, str(unauthorized))

    print("-" * 64)
    print("购物车与订单验收：")

    status, unauthorized_cart = call("GET", "/cart")
    check("未登录访问购物车返回 401", status == 401, str(unauthorized_cart))

    call("DELETE", "/cart", token=token)
    status, cart = call("GET", "/cart", token=token)
    check(
        "初始购物车为空",
        status == 200 and cart.get("total_quantity") == 0,
        str(cart),
    )

    status, cart = call(
        "POST", "/cart/items", {"product_id": 1, "quantity": 2}, token=token
    )
    check(
        "加入商品 1 × 2",
        status == 201 and cart.get("total_quantity") == 2,
        str(cart)[:200],
    )

    status, cart = call(
        "POST", "/cart/items", {"product_id": 2, "quantity": 1}, token=token
    )
    check(
        "加入商品 2 × 1",
        status == 201 and cart.get("total_quantity") == 3,
        str(cart)[:200],
    )

    item_one = next(
        (item for item in cart["items"] if item["product"]["id"] == 1), None
    )
    item_two = next(
        (item for item in cart["items"] if item["product"]["id"] == 2), None
    )
    check(
        "购物车金额正确",
        cart.get("total_amount") == 168 * 2 + 128,
        str(cart.get("total_amount")),
    )

    status, cart = call(
        "PATCH", f"/cart/items/{item_one['id']}", {"quantity": 1}, token=token
    )
    check(
        "修改购物车数量",
        status == 200 and cart.get("total_quantity") == 2,
        str(cart)[:200],
    )

    _, product_one_before = call("GET", "/products/1")
    _, product_two_before = call("GET", "/products/2")

    address = {
        "recipient_name": "演示用户",
        "recipient_phone": "13800138000",
        "shipping_address": "山东省济宁市泗水县柘沟镇演示路 1 号",
        "remark": "大创演示订单",
    }

    status, order = call(
        "POST",
        "/orders",
        {**address, "item_ids": [item_one["id"], item_two["id"]]},
        token=token,
    )
    check(
        "结算创建订单",
        status == 201 and order.get("status") == "pending",
        str(order)[:300],
    )
    check(
        "订单金额正确",
        order.get("total_amount") == 168 + 128
        and order.get("total_quantity") == 2,
        f"amount={order.get('total_amount')} qty={order.get('total_quantity')}",
    )

    _, product_one_after = call("GET", "/products/1")
    _, product_two_after = call("GET", "/products/2")
    check(
        "下单扣减库存",
        product_one_after["stock"] == product_one_before["stock"] - 1
        and product_two_after["stock"] == product_two_before["stock"] - 1,
        f"p1 {product_one_before['stock']}->{product_one_after['stock']}, "
        f"p2 {product_two_before['stock']}->{product_two_after['stock']}",
    )

    status, cart = call("GET", "/cart", token=token)
    check("结算后购物车清空", status == 200 and cart.get("total_quantity") == 0)

    status, paid = call("POST", f"/orders/{order['id']}/pay", token=token)
    check("模拟支付", status == 200 and paid.get("status") == "paid", str(paid)[:200])

    status, completed = call("POST", f"/orders/{order['id']}/complete", token=token)
    check(
        "确认收货",
        status == 200 and completed.get("status") == "completed",
        str(completed)[:200],
    )

    _, product_three_before = call("GET", "/products/3")
    status, cart = call(
        "POST", "/cart/items", {"product_id": 3, "quantity": 1}, token=token
    )
    item_three = next(
        (item for item in cart["items"] if item["product"]["id"] == 3), None
    )
    status, cancel_order = call(
        "POST", "/orders", {**address, "item_ids": [item_three["id"]]}, token=token
    )
    check(
        "创建待取消订单",
        status == 201 and cancel_order.get("status") == "pending",
        str(cancel_order)[:200],
    )

    status, cancelled = call(
        "POST", f"/orders/{cancel_order['id']}/cancel", token=token
    )
    check(
        "取消订单",
        status == 200 and cancelled.get("status") == "cancelled",
        str(cancelled)[:200],
    )

    _, product_three_after = call("GET", "/products/3")
    check(
        "取消订单恢复库存",
        product_three_after["stock"] == product_three_before["stock"],
        f"p3 {product_three_before['stock']}->{product_three_after['stock']}",
    )

    status, orders = call("GET", "/orders?page=1&page_size=10", token=token)
    check(
        "订单列表",
        status == 200 and orders.get("total", 0) >= 2,
        str(orders)[:200],
    )
    print(f"       订单列表共 {orders.get('total')} 笔")

    status, empty_order = call("POST", "/orders", address, token=token)
    check("空购物车结算返回 400", status == 400, str(empty_order))

    print("-" * 64)
    status, admin_login = call(
        "POST", "/auth/login", {"username": "admin", "password": "admin123456"}
    )
    admin_token = (admin_login or {}).get("access_token")
    check("管理员登录", status == 200 and bool(admin_token), str(admin_login))

    status, reindex = call("POST", "/admin/reindex", token=admin_token)
    check(
        "管理员重建索引",
        status == 200 and reindex.get("count") == 35,
        str(reindex)[:300],
    )
    print(
        "       reindex: count={count} duration={duration_ms}ms backend={backend}".format(
            count=(reindex or {}).get("count"),
            duration_ms=(reindex or {}).get("duration_ms"),
            backend=(reindex or {}).get("backend"),
        )
    )

    status, stats = call("GET", "/admin/stats", token=admin_token)
    check(
        "管理统计",
        status == 200
        and stats.get("products") == 35
        and stats.get("orders", 0) >= 2,
        str(stats)[:300],
    )
    print(
        "       统计：用户={users} 商品={products} 收藏={favorites} 订单={orders} 搜索={searches}".format(
            users=(stats or {}).get("users"),
            products=(stats or {}).get("products"),
            favorites=(stats or {}).get("favorites"),
            orders=(stats or {}).get("orders"),
            searches=(stats or {}).get("searches"),
        )
    )

    status, forbidden = call("POST", "/admin/reindex", token=token)
    check("普通用户重建索引返回 403", status == 403, str(forbidden))

    print("=" * 64)
    print(f"验收结果：通过 {passed} 项，失败 {failed} 项")
    print("=" * 64)

    if failed:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
