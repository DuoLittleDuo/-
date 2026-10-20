"""初始化演示数据：5 个类目、35 件商品、演示账号与语义索引。

用法（在 backend 目录下）：
    python -m app.seed                 # 幂等初始化，已有数据则保留
    python -m app.seed --reset         # 清空演示数据并重建
    python -m app.seed --if-empty      # 仅在空库时初始化
    python -m app.seed --skip-ai       # 不构建语义索引
"""

import argparse

from sqlalchemy.orm import Session

from .auth import hash_password, normalize_username
from .config import INDEX_DIR, settings
from .database import Base, SessionLocal, engine
from .models import CartItem, Category, Favorite, Order, OrderItem, Product, SearchLog, User
from .services.search_service import search_service
from .services.search_text import build_search_document

CATEGORIES = [
    {
        "name": "宠物食盆",
        "slug": "food-bowls",
        "emoji": "🥣",
        "description": "一日三餐，盛进六千年土陶",
        "sort_order": 1,
    },
    {
        "name": "宠物水碗",
        "slug": "water-bowls",
        "emoji": "💧",
        "description": "清水与陶土，都是日常",
        "sort_order": 2,
    },
    {
        "name": "宠物挂牌",
        "slug": "tags",
        "emoji": "🐾",
        "description": "把名字与平安，挂在它颈间",
        "sort_order": 3,
    },
    {
        "name": "宠物摆件",
        "slug": "ornaments",
        "emoji": "🏺",
        "description": "一器一面，安放相伴时光",
        "sort_order": 4,
    },
    {
        "name": "宠物纪念罐",
        "slug": "memorials",
        "emoji": "🕯️",
        "description": "把想念，留在窑火里",
        "sort_order": 5,
    },
]

PRODUCTS: dict[str, list[dict]] = {
    "food-bowls": [
        {
            "sku": "ZG-SB-01",
            "name": "山河绞胎·犬用陶瓷食盆",
            "subtitle": "绞胎彩纹手作 · 护颈深口 · 犬用",
            "description": "以柘沟五色陶土为胎，绞胎工艺将山河纹样揉入器身，每一只的纹理都不可复制。深口弧壁减少粮食外溅，适合中型犬与大型犬日常使用。",
            "price": 168,
            "original_price": 198,
            "pet_type": "犬",
            "craft": "绞胎彩纹",
            "material": "柘沟五色陶土",
            "spec_text": "口径 18cm × 高 8cm",
            "tags": ["绞胎彩纹", "五色陶土", "犬用", "可定制"],
            "stock": 60,
            "sales_count": 1260,
            "hot_score": 98,
            "is_hot": True,
            "emoji": "🐕",
            "color": "#B85C38",
        },
        {
            "sku": "ZG-SB-02",
            "name": "云岚五色·猫用浅口饭盆",
            "subtitle": "五色陶土叠色 · 浅口宽沿 · 猫用",
            "description": "五色陶土自然叠色，浅口宽沿贴合猫咪胡须，进食时不压须。器身呈现云岚般柔和的过渡，适合干粮与湿粮。",
            "price": 128,
            "original_price": 158,
            "pet_type": "猫",
            "craft": "五色陶土",
            "material": "柘沟五色陶土",
            "spec_text": "口径 14cm × 高 5cm",
            "tags": ["五色陶土", "猫用", "浅口", "可定制"],
            "stock": 80,
            "sales_count": 980,
            "hot_score": 96,
            "is_hot": True,
            "emoji": "🐈",
            "color": "#C79A52",
        },
        {
            "sku": "ZG-SB-03",
            "name": "窑变暮山·高脚护颈食盆",
            "subtitle": "高脚护颈 · 暮山窑变 · 通用",
            "description": "高脚设计抬高进食高度，减轻中大型犬的颈部负担。暮山窑变釉在烧制中自然流淌，入窑一色、出窑万彩。",
            "price": 198,
            "original_price": 238,
            "pet_type": "通用",
            "craft": "窑变纹理",
            "material": "柘沟五色陶土",
            "spec_text": "口径 16cm × 高 12cm",
            "tags": ["窑变纹理", "护颈", "通用", "可定制"],
            "stock": 45,
            "sales_count": 860,
            "hot_score": 94,
            "is_hot": True,
            "emoji": "🥣",
            "color": "#6E7F72",
        },
        {
            "sku": "ZG-SB-04",
            "name": "柘红素陶·双宠分格食盘",
            "subtitle": "红陶素烧 · 干湿分格 · 多宠家庭",
            "description": "柘沟红陶素烧，无釉内壁易清洁。中隔分格可同时盛放干粮与湿粮，适合多宠家庭。",
            "price": 158,
            "pet_type": "通用",
            "craft": "素陶",
            "material": "柘沟红陶",
            "spec_text": "长 24cm × 宽 14cm",
            "tags": ["素陶", "分格", "多宠家庭"],
            "stock": 70,
            "sales_count": 520,
            "hot_score": 72,
            "emoji": "🍽️",
            "color": "#A97155",
        },
        {
            "sku": "ZG-SB-05",
            "name": "刻花麦穗·幼宠小食盆",
            "subtitle": "手刻麦穗 · 低矮浅碗 · 幼宠",
            "description": "小容量浅碗适合幼猫幼犬，碗沿手刻麦穗纹，寓意岁岁丰足。器型低矮，方便幼宠低头进食。",
            "price": 88,
            "pet_type": "通用",
            "craft": "刻花",
            "material": "柘沟红陶",
            "spec_text": "口径 11cm × 高 4cm",
            "tags": ["刻花", "幼宠", "浅口"],
            "stock": 90,
            "sales_count": 640,
            "hot_score": 70,
            "emoji": "🌾",
            "color": "#C79A52",
        },
        {
            "sku": "ZG-SB-06",
            "name": "人宠同系·一屋两碗礼盒",
            "subtitle": "宠物碗 + 主人碗 · 同纹同色 · 礼盒",
            "description": "一只宠物食盆搭配一只主人手作陶碗，同纹同色，组成「一屋两碗」礼盒。适合新养宠家庭与乔迁礼赠。",
            "price": 368,
            "pet_type": "通用",
            "craft": "绞胎彩纹",
            "material": "柘沟五色陶土",
            "spec_text": "宠物碗 16cm + 主人碗 12cm",
            "tags": ["人宠同系", "礼盒", "绞胎彩纹", "可定制"],
            "stock": 30,
            "sales_count": 320,
            "hot_score": 78,
            "emoji": "🎁",
            "color": "#B85C38",
        },
        {
            "sku": "ZG-SB-07",
            "name": "人宠同系·同纹主人杯与猫碗",
            "subtitle": "猫用浅口碗 + 马克杯 · 同款绞胎",
            "description": "猫用浅口碗与主人马克杯采用同一绞胎纹样，人宠各得其一。礼盒内含文化溯源卡与手作说明。",
            "price": 338,
            "pet_type": "猫",
            "craft": "绞胎彩纹",
            "material": "柘沟五色陶土",
            "spec_text": "猫碗 13cm + 马克杯 350ml",
            "tags": ["人宠同系", "绞胎彩纹", "猫用", "可定制"],
            "stock": 35,
            "sales_count": 280,
            "hot_score": 76,
            "emoji": "☕",
            "color": "#8C5A3C",
        },
    ],
    "water-bowls": [
        {
            "sku": "ZG-SW-01",
            "name": "流纹绞胎·自动蓄水陶碗",
            "subtitle": "绞胎流纹 · 宽口浅腹 · 可配蓄水胆",
            "description": "绞胎流纹环绕器身，宽口浅腹便于饮水。可选配陶制蓄水内胆，缓慢补水，减少频繁添水。",
            "price": 188,
            "original_price": 228,
            "pet_type": "通用",
            "craft": "绞胎彩纹",
            "material": "柘沟五色陶土",
            "spec_text": "口径 17cm × 高 9cm",
            "tags": ["绞胎彩纹", "蓄水", "通用", "可定制"],
            "stock": 55,
            "sales_count": 920,
            "hot_score": 93,
            "is_hot": True,
            "emoji": "💧",
            "color": "#6E7F72",
        },
        {
            "sku": "ZG-SW-02",
            "name": "五色陶土·宽口饮水盆",
            "subtitle": "五色叠色 · 宽口 · 犬用",
            "description": "五色陶土自然过渡，宽口设计让犬只饮水更舒展。内壁施食品级透明釉，易清洗不挂垢。",
            "price": 138,
            "pet_type": "犬",
            "craft": "五色陶土",
            "material": "柘沟五色陶土",
            "spec_text": "口径 20cm × 高 8cm",
            "tags": ["五色陶土", "宽口", "犬用"],
            "stock": 65,
            "sales_count": 710,
            "hot_score": 74,
            "emoji": "🐕",
            "color": "#B85C38",
        },
        {
            "sku": "ZG-SW-03",
            "name": "窑变天青·猫咪饮水器",
            "subtitle": "天青窑变 · 收口设计 · 猫用",
            "description": "天青窑变釉色清透，器口收窄减少胡须触碰。适合猫咪日常饮水，也可作小型犬水碗。",
            "price": 198,
            "original_price": 238,
            "pet_type": "猫",
            "craft": "窑变纹理",
            "material": "柘沟青陶",
            "spec_text": "口径 13cm × 高 10cm",
            "tags": ["窑变纹理", "猫用", "收口", "可定制"],
            "stock": 50,
            "sales_count": 880,
            "hot_score": 92,
            "is_hot": True,
            "emoji": "🐈",
            "color": "#6E7F72",
        },
        {
            "sku": "ZG-SW-04",
            "name": "刻花莲瓣·防滑水碗",
            "subtitle": "手刻莲瓣 · 磨砂防滑 · 通用",
            "description": "外壁手刻莲瓣纹，底部磨砂防滑，饮水时不易推移。器型稳重心低，适合活泼宠物。",
            "price": 118,
            "pet_type": "通用",
            "craft": "刻花",
            "material": "柘沟红陶",
            "spec_text": "口径 15cm × 高 6cm",
            "tags": ["刻花", "防滑", "通用"],
            "stock": 100,
            "sales_count": 560,
            "hot_score": 68,
            "emoji": "🪷",
            "color": "#A97155",
        },
        {
            "sku": "ZG-SW-05",
            "name": "素陶原色·大容量犬水盆",
            "subtitle": "素陶透气 · 大容量 · 犬用",
            "description": "大容量素陶水盆，满足中大型犬全天饮水。无釉内壁透气，适合夏季使用。",
            "price": 98,
            "pet_type": "犬",
            "craft": "素陶",
            "material": "柘沟红陶",
            "spec_text": "口径 24cm × 高 10cm",
            "tags": ["素陶", "大容量", "犬用"],
            "stock": 75,
            "sales_count": 490,
            "hot_score": 66,
            "emoji": "🐕",
            "color": "#8C5A3C",
        },
        {
            "sku": "ZG-SW-06",
            "name": "人宠同系·晨光双杯套组",
            "subtitle": "宠碗 + 主人晨杯 · 晨光窑变 · 礼盒",
            "description": "宠物水碗与主人晨间茶杯同纹同色，晨光窑变釉温暖柔和。套装含两只器皿与棉麻收纳袋。",
            "price": 398,
            "pet_type": "通用",
            "craft": "窑变纹理",
            "material": "柘沟五色陶土",
            "spec_text": "宠碗 15cm + 主人杯 300ml",
            "tags": ["人宠同系", "窑变纹理", "礼盒", "可定制"],
            "stock": 25,
            "sales_count": 260,
            "hot_score": 80,
            "emoji": "🌅",
            "color": "#C79A52",
        },
        {
            "sku": "ZG-SW-07",
            "name": "人宠同系·手作双人茶碗与宠碗",
            "subtitle": "主人茶碗 ×2 + 宠碗 · 手刻花 · 礼盒",
            "description": "两只主人茶碗与一只宠物水碗组成家庭套组，纹样取自柘沟传统刻花。适合作为节日礼赠。",
            "price": 358,
            "pet_type": "通用",
            "craft": "刻花",
            "material": "柘沟五色陶土",
            "spec_text": "茶碗 ×2 + 宠碗 14cm",
            "tags": ["人宠同系", "刻花", "茶具", "礼盒"],
            "stock": 20,
            "sales_count": 210,
            "hot_score": 75,
            "emoji": "🍵",
            "color": "#7F9381",
        },
    ],
    "tags": [
        {
            "sku": "ZG-GP-01",
            "name": "刻花骨朵·宠物名牌",
            "subtitle": "手刻骨朵纹 · 背面可刻名 · 防丢",
            "description": "小尺寸陶牌，正面手刻骨朵纹，背面可定制宠物名字与联系电话。配防脱落棉绳，轻巧不压颈。",
            "price": 88,
            "pet_type": "通用",
            "craft": "刻花",
            "material": "柘沟红陶",
            "spec_text": "直径 3.5cm",
            "tags": ["刻花", "可定制", "通用", "防丢"],
            "stock": 120,
            "sales_count": 1480,
            "hot_score": 95,
            "is_hot": True,
            "emoji": "🦴",
            "color": "#B85C38",
        },
        {
            "sku": "ZG-GP-02",
            "name": "绞胎小圆牌·猫名定制",
            "subtitle": "绞胎细纹 · 轻量圆牌 · 猫用",
            "description": "绞胎小圆牌纹理细腻，适合猫咪轻量佩戴。可定制猫名与主人电话，边缘圆润不刮毛。",
            "price": 98,
            "pet_type": "猫",
            "craft": "绞胎彩纹",
            "material": "柘沟五色陶土",
            "spec_text": "直径 3cm",
            "tags": ["绞胎彩纹", "猫用", "可定制"],
            "stock": 110,
            "sales_count": 760,
            "hot_score": 73,
            "emoji": "🐈",
            "color": "#C79A52",
        },
        {
            "sku": "ZG-GP-03",
            "name": "五色陶土·爪印身份牌",
            "subtitle": "五色陶土 · 爪印压纹 · 犬用",
            "description": "五色陶土压制爪印纹，色彩自然不褪。适合犬只日常佩戴，附不锈钢挂环。",
            "price": 108,
            "pet_type": "犬",
            "craft": "五色陶土",
            "material": "柘沟五色陶土",
            "spec_text": "直径 4cm",
            "tags": ["五色陶土", "犬用", "爪印"],
            "stock": 90,
            "sales_count": 680,
            "hot_score": 71,
            "emoji": "🐾",
            "color": "#B85C38",
        },
        {
            "sku": "ZG-GP-04",
            "name": "窑变釉·星野吊牌",
            "subtitle": "星野窑变 · 细碎晶点 · 纪念",
            "description": "星野窑变釉面在光下呈现细碎晶点，像一小片夜空。适合作为纪念牌或节日礼物。",
            "price": 158,
            "pet_type": "通用",
            "craft": "窑变纹理",
            "material": "柘沟青陶",
            "spec_text": "直径 3.2cm",
            "tags": ["窑变纹理", "纪念", "通用"],
            "stock": 60,
            "sales_count": 430,
            "hot_score": 64,
            "emoji": "✨",
            "color": "#6E7F72",
        },
        {
            "sku": "ZG-GP-05",
            "name": "柘红陶·平安锁宠物牌",
            "subtitle": "平安锁造型 · 手刻平安 · 犬用",
            "description": "取传统平安锁造型，柘红陶胎手刻平安二字。寓意守护，适合新领养的宠物。",
            "price": 128,
            "pet_type": "犬",
            "craft": "刻花",
            "material": "柘沟红陶",
            "spec_text": "长 4cm × 宽 3cm",
            "tags": ["刻花", "平安锁", "犬用", "可定制"],
            "stock": 70,
            "sales_count": 590,
            "hot_score": 69,
            "emoji": "🔒",
            "color": "#A97155",
        },
        {
            "sku": "ZG-GP-06",
            "name": "手刻铃铛·防丢挂牌",
            "subtitle": "陶制铃铛 · 内置铜铃 · 防丢",
            "description": "陶制铃铛造型挂牌，内置黄铜小铃，走失时容易听见。表面手刻回纹，古朴耐看。",
            "price": 118,
            "pet_type": "通用",
            "craft": "刻花",
            "material": "柘沟红陶",
            "spec_text": "直径 3.6cm",
            "tags": ["刻花", "铃铛", "防丢", "通用"],
            "stock": 85,
            "sales_count": 640,
            "hot_score": 67,
            "emoji": "🔔",
            "color": "#C79A52",
        },
        {
            "sku": "ZG-GP-07",
            "name": "人宠同系·刻花双牌礼盒",
            "subtitle": "宠物牌 + 主人钥匙扣 · 同纹成对",
            "description": "宠物挂牌与主人钥匙扣同纹成对，刻花工艺一致。礼盒适合作为养宠纪念礼。",
            "price": 328,
            "pet_type": "通用",
            "craft": "刻花",
            "material": "柘沟五色陶土",
            "spec_text": "宠物牌 3.5cm + 钥匙扣 4cm",
            "tags": ["人宠同系", "刻花", "礼盒", "可定制"],
            "stock": 40,
            "sales_count": 240,
            "hot_score": 77,
            "emoji": "🎐",
            "color": "#8C5A3C",
        },
    ],
    "ornaments": [
        {
            "sku": "ZG-BJ-01",
            "name": "窑变釉·卧猫陶摆件",
            "subtitle": "卧猫造型 · 窑变釉色 · 桌面摆件",
            "description": "卧猫姿态取自柘沟民间陶塑，窑变釉色温润。适合书桌、玄关与宠物纪念角。",
            "price": 268,
            "pet_type": "猫",
            "craft": "窑变纹理",
            "material": "柘沟青陶",
            "spec_text": "长 18cm × 高 12cm",
            "tags": ["窑变纹理", "猫用", "摆件"],
            "stock": 35,
            "sales_count": 380,
            "hot_score": 91,
            "is_hot": True,
            "emoji": "🐈",
            "color": "#6E7F72",
        },
        {
            "sku": "ZG-BJ-02",
            "name": "刻花瑞兽·犬守门摆件",
            "subtitle": "瑞兽造型 · 手刻卷草 · 犬用",
            "description": "瑞兽造型融合传统守门狮与犬的形象，表面手刻卷草纹。适合作为新居镇宅摆件。",
            "price": 328,
            "pet_type": "犬",
            "craft": "刻花",
            "material": "柘沟红陶",
            "spec_text": "高 22cm",
            "tags": ["刻花", "犬用", "摆件", "镇宅"],
            "stock": 25,
            "sales_count": 290,
            "hot_score": 74,
            "emoji": "🦁",
            "color": "#A97155",
        },
        {
            "sku": "ZG-BJ-03",
            "name": "五色陶土·招财爪印摆件",
            "subtitle": "爪印 + 铜钱纹 · 招财纳福 · 小巧",
            "description": "五色陶土捏塑爪印与铜钱纹，寓意招财纳福。尺寸小巧，适合办公桌摆放。",
            "price": 228,
            "pet_type": "通用",
            "craft": "五色陶土",
            "material": "柘沟五色陶土",
            "spec_text": "高 12cm",
            "tags": ["五色陶土", "招财", "摆件"],
            "stock": 50,
            "sales_count": 410,
            "hot_score": 70,
            "emoji": "🐾",
            "color": "#C79A52",
        },
        {
            "sku": "ZG-BJ-04",
            "name": "绞胎年轮·宠物与主人桌面像",
            "subtitle": "绞胎年轮 · 人宠抽象陶像 · 定制",
            "description": "以绞胎年轮纹表现时光，可定制宠物与主人的抽象陶像。制作周期约十五天。",
            "price": 468,
            "pet_type": "通用",
            "craft": "绞胎彩纹",
            "material": "柘沟五色陶土",
            "spec_text": "定制尺寸",
            "tags": ["绞胎彩纹", "可定制", "摆件", "人宠同系"],
            "stock": 15,
            "sales_count": 120,
            "hot_score": 79,
            "emoji": "🫂",
            "color": "#B85C38",
        },
        {
            "sku": "ZG-BJ-05",
            "name": "柘沟红陶·睡犬案头摆件",
            "subtitle": "红陶素烧 · 睡犬造型 · 案头",
            "description": "柘沟红陶素烧，睡犬造型安静敦厚。无釉表面保留陶土颗粒感。",
            "price": 208,
            "pet_type": "犬",
            "craft": "素陶",
            "material": "柘沟红陶",
            "spec_text": "长 16cm",
            "tags": ["素陶", "犬用", "摆件"],
            "stock": 45,
            "sales_count": 330,
            "hot_score": 65,
            "emoji": "🐕",
            "color": "#8C5A3C",
        },
        {
            "sku": "ZG-BJ-06",
            "name": "窑变星河·猫月摆件",
            "subtitle": "猫与弯月 · 星河窑变 · 卧室摆件",
            "description": "猫与弯月组合造型，星河窑变釉在灯光下呈现流动光泽。适合作为卧室夜灯旁摆件。",
            "price": 398,
            "pet_type": "猫",
            "craft": "窑变纹理",
            "material": "柘沟青陶",
            "spec_text": "高 20cm",
            "tags": ["窑变纹理", "猫用", "摆件"],
            "stock": 30,
            "sales_count": 260,
            "hot_score": 76,
            "emoji": "🌙",
            "color": "#6E7F72",
        },
        {
            "sku": "ZG-BJ-07",
            "name": "刻花山河·宠物肖像陶盘",
            "subtitle": "手刻山河纹 · 宠物侧影 · 照片定制",
            "description": "手工刻花陶盘，可将宠物侧影刻入山河纹样。支持照片定制，附匠人手作证书。",
            "price": 499,
            "pet_type": "通用",
            "craft": "刻花",
            "material": "柘沟五色陶土",
            "spec_text": "直径 26cm",
            "tags": ["刻花", "可定制", "摆件", "肖像"],
            "stock": 12,
            "sales_count": 150,
            "hot_score": 81,
            "emoji": "🏔️",
            "color": "#A97155",
        },
    ],
    "memorials": [
        {
            "sku": "ZG-JN-01",
            "name": "窑变星河·宠物纪念罐",
            "subtitle": "星河窑变 · 可刻名与日期 · 纪念罐",
            "description": "星河窑变釉色沉静，罐身可刻宠物名字与纪念日期。密封陶盖配软木内衬，适合长期保存纪念物。",
            "price": 399,
            "pet_type": "通用",
            "craft": "窑变纹理",
            "material": "柘沟青陶",
            "spec_text": "高 18cm × 直径 12cm",
            "tags": ["窑变纹理", "纪念罐", "可定制"],
            "stock": 30,
            "sales_count": 340,
            "hot_score": 90,
            "is_hot": True,
            "emoji": "🕯️",
            "color": "#6E7F72",
        },
        {
            "sku": "ZG-JN-02",
            "name": "绞胎年轮·爪印纪念罐",
            "subtitle": "绞胎年轮 · 盖顶爪印 · 纪念罐",
            "description": "绞胎年轮纹环绕罐身，盖顶压印爪印。器型圆润，适合存放毛发、项圈等纪念物。",
            "price": 369,
            "pet_type": "通用",
            "craft": "绞胎彩纹",
            "material": "柘沟五色陶土",
            "spec_text": "高 16cm",
            "tags": ["绞胎彩纹", "纪念罐", "爪印", "可定制"],
            "stock": 35,
            "sales_count": 300,
            "hot_score": 78,
            "emoji": "🌳",
            "color": "#B85C38",
        },
        {
            "sku": "ZG-JN-03",
            "name": "五色陶土·追思小罐",
            "subtitle": "五色过渡 · 小容量 · 附收纳袋",
            "description": "小容量追思罐，五色陶土自然过渡，适合存放少量纪念物。附棉麻束口袋。",
            "price": 239,
            "pet_type": "通用",
            "craft": "五色陶土",
            "material": "柘沟五色陶土",
            "spec_text": "高 12cm",
            "tags": ["五色陶土", "纪念罐", "小容量"],
            "stock": 60,
            "sales_count": 250,
            "hot_score": 68,
            "emoji": "🕊️",
            "color": "#C79A52",
        },
        {
            "sku": "ZG-JN-04",
            "name": "刻花莲台·纪念陶罐",
            "subtitle": "莲台造型 · 手刻莲瓣云纹 · 纪念罐",
            "description": "莲台造型取自传统器型，罐身手刻莲瓣与云纹。适合作为庄重的纪念器物。",
            "price": 459,
            "pet_type": "通用",
            "craft": "刻花",
            "material": "柘沟红陶",
            "spec_text": "高 20cm",
            "tags": ["刻花", "纪念罐", "莲台"],
            "stock": 25,
            "sales_count": 180,
            "hot_score": 73,
            "emoji": "🪷",
            "color": "#A97155",
        },
        {
            "sku": "ZG-JN-05",
            "name": "柘红素陶·刻名纪念罐",
            "subtitle": "红陶素烧 · 可刻名与纪念语 · 约十天",
            "description": "柘红素陶无釉质感，正面可刻宠物名字与一句话纪念语。制作周期约十天。",
            "price": 299,
            "pet_type": "通用",
            "craft": "素陶",
            "material": "柘沟红陶",
            "spec_text": "高 15cm",
            "tags": ["素陶", "纪念罐", "可刻名", "可定制"],
            "stock": 40,
            "sales_count": 220,
            "hot_score": 70,
            "emoji": "📜",
            "color": "#8C5A3C",
        },
        {
            "sku": "ZG-JN-06",
            "name": "窑变暮云·大容量纪念罐",
            "subtitle": "暮云窑变 · 大容量 · 纪念罐",
            "description": "大容量器型，暮云窑变釉层次丰富。适合多宠家庭或存放较多纪念物。",
            "price": 499,
            "pet_type": "通用",
            "craft": "窑变纹理",
            "material": "柘沟青陶",
            "spec_text": "高 24cm",
            "tags": ["窑变纹理", "纪念罐", "大容量"],
            "stock": 20,
            "sales_count": 140,
            "hot_score": 71,
            "emoji": "☁️",
            "color": "#6E7F72",
        },
        {
            "sku": "ZG-JN-07",
            "name": "双生爪印·双宠纪念罐",
            "subtitle": "双爪印罐盖 · 双名可刻 · 纪念罐",
            "description": "双爪印压印于罐盖，适合纪念相伴多年的两只宠物。可刻双名与日期。",
            "price": 479,
            "pet_type": "通用",
            "craft": "刻花",
            "material": "柘沟五色陶土",
            "spec_text": "高 19cm",
            "tags": ["纪念罐", "双宠", "可定制"],
            "stock": 18,
            "sales_count": 120,
            "hot_score": 69,
            "emoji": "🐾",
            "color": "#B37A5A",
        },
    ],
}


def _reset_demo_data(db: Session) -> None:
    db.query(CartItem).delete()
    db.query(OrderItem).delete()
    db.query(Order).delete()
    db.query(SearchLog).delete()
    db.query(Favorite).delete()
    db.query(Product).delete()
    db.query(Category).delete()
    seed_names = [
        normalize_username(settings.seed_admin_username),
        normalize_username(settings.seed_demo_username),
    ]
    db.query(User).filter(User.username.in_(seed_names)).delete(synchronize_session=False)
    db.commit()

    for path in INDEX_DIR.glob("*"):
        if path.is_file():
            path.unlink(missing_ok=True)


def _ensure_categories(db: Session) -> dict[str, Category]:
    existing = {category.slug for category in db.query(Category).all()}
    for item in CATEGORIES:
        if item["slug"] not in existing:
            db.add(Category(**item))
    db.flush()
    return {category.slug: category for category in db.query(Category).all()}


def _ensure_products(db: Session, categories: dict[str, Category]) -> int:
    existing_skus = {row[0] for row in db.query(Product.sku).all()}
    created = 0

    for slug, items in PRODUCTS.items():
        category = categories[slug]
        for item in items:
            if item["sku"] in existing_skus:
                continue

            search_text = build_search_document(
                name=item["name"],
                subtitle=item.get("subtitle"),
                description=item.get("description"),
                category_name=category.name,
                tags=item.get("tags"),
                pet_type=item.get("pet_type", "通用"),
                material=item.get("material"),
                craft=item.get("craft"),
                spec_text=item.get("spec_text"),
            )

            db.add(
                Product(
                    sku=item["sku"],
                    category_id=category.id,
                    name=item["name"],
                    subtitle=item.get("subtitle"),
                    description=item.get("description"),
                    price=item["price"],
                    original_price=item.get("original_price"),
                    stock=item.get("stock", 0),
                    sales_count=item.get("sales_count", 0),
                    hot_score=item.get("hot_score", 0),
                    is_hot=bool(item.get("is_hot", False)),
                    pet_type=item.get("pet_type", "通用"),
                    material=item.get("material", "柘沟五色陶土"),
                    craft=item.get("craft"),
                    spec_text=item.get("spec_text"),
                    tags=item.get("tags", []),
                    search_text=search_text,
                    cover_emoji=item.get("emoji", "🏺"),
                    theme_color=item.get("color", "#B85C38"),
                )
            )
            created += 1

    return created


def _ensure_user(
    db: Session, username: str, password: str, display_name: str, is_admin: bool
) -> None:
    username = normalize_username(username)
    if db.query(User).filter(User.username == username).first() is not None:
        return
    db.add(
        User(
            username=username,
            password_hash=hash_password(password),
            display_name=display_name,
            is_admin=is_admin,
        )
    )


def seed(*, reset: bool = False, if_empty: bool = False, skip_ai: bool = False) -> dict:
    Base.metadata.create_all(bind=engine)

    with SessionLocal() as db:
        if if_empty and (db.query(Product).count() or 0) > 0:
            print("数据库中已有商品，跳过初始化。")
            return {"skipped": True}

        if reset:
            print("正在清空旧的演示数据 ...")
            _reset_demo_data(db)

        categories = _ensure_categories(db)
        created = _ensure_products(db, categories)

        _ensure_user(
            db,
            settings.seed_admin_username,
            settings.seed_admin_password,
            "管理员",
            True,
        )
        _ensure_user(
            db,
            settings.seed_demo_username,
            settings.seed_demo_password,
            "演示用户",
            False,
        )
        db.commit()

        counts = {
            "categories": db.query(Category).count(),
            "products": db.query(Product).count(),
            "users": db.query(User).count(),
            "created_products": created,
        }
        print(
            f"数据初始化完成：类目 {counts['categories']} 个，"
            f"商品 {counts['products']} 件（本次新增 {created} 件），"
            f"用户 {counts['users']} 个。"
        )
        print(
            f"演示账号：{settings.seed_demo_username} / {settings.seed_demo_password}；"
            f"管理员：{settings.seed_admin_username} / {settings.seed_admin_password}"
        )

        if skip_ai:
            print("已跳过语义索引构建（--skip-ai）。")
            return counts

        print("正在构建语义索引（首次运行需要下载约 90MB 模型）...")
        result = search_service.build_index(db)
        if result.get("ok"):
            print(
                f"语义索引就绪：{result['count']} 件商品，"
                f"耗时 {result['duration_ms']} ms，模型 {result['model']}。"
            )
        else:
            print(
                "语义索引构建失败，网站仍可运行（搜索将使用关键词兜底）："
                f"{result.get('error') or result.get('message')}"
            )

        return counts


def main() -> None:
    parser = argparse.ArgumentParser(description="初始化柘沟陶宠演示数据")
    parser.add_argument("--reset", action="store_true", help="清空演示数据后重建")
    parser.add_argument("--if-empty", action="store_true", help="仅当商品表为空时初始化")
    parser.add_argument("--skip-ai", action="store_true", help="跳过语义索引构建")
    args = parser.parse_args()

    seed(reset=args.reset, if_empty=args.if_empty, skip_ai=args.skip_ai)


if __name__ == "__main__":
    main()
