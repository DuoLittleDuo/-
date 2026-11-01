"""
生成泗水柘沟土陶宠物产品图片
使用 Gemini AI 生成 1024x1024 高清产品照片
"""

import os
import json
import time
from pathlib import Path

# 产品数据
PRODUCTS = {
    "food-bowls": [
        {"sku": "ZG-SB-01", "name": "山河绞胎·犬用陶瓷食盆", "desc": "绞胎彩纹手作，护颈深口，犬用食盆", "craft": "绞胎彩纹", "color": "山河纹样，五色陶土"},
        {"sku": "ZG-SB-02", "name": "云岚五色·猫用浅口饭盆", "desc": "五色陶土叠色，浅口宽沿，猫用饭盆", "craft": "五色陶土", "color": "云岚般柔和过渡色"},
        {"sku": "ZG-SB-03", "name": "窑变暮山·高脚护颈食盆", "desc": "高脚设计，暮山窑变釉，护颈食盆", "craft": "窑变纹理", "color": "暮山窑变，流淌釉色"},
        {"sku": "ZG-SB-04", "name": "柘红素陶·双宠分格食盘", "desc": "红陶素烧，干湿分格，双宠食盘", "craft": "素陶", "color": "柘红色"},
        {"sku": "ZG-SB-05", "name": "刻花麦穗·幼宠小食盆", "desc": "手刻麦穗纹，低矮浅碗，幼宠食盆", "craft": "刻花", "color": "红陶原色"},
        {"sku": "ZG-SB-06", "name": "人宠同系·一屋两碗礼盒", "desc": "宠物碗+主人碗，同纹同色，礼盒装", "craft": "绞胎彩纹", "color": "绞胎山河纹"},
        {"sku": "ZG-SB-07", "name": "人宠同系·同纹主人杯与猫碗", "desc": "猫碗+马克杯，同款绞胎纹样", "craft": "绞胎彩纹", "color": "绞胎纹样"},
    ],
    "water-bowls": [
        {"sku": "ZG-SW-01", "name": "流纹绞胎·自动蓄水陶碗", "desc": "绞胎流纹，宽口浅腹，可配蓄水胆", "craft": "绞胎彩纹", "color": "流纹绞胎"},
        {"sku": "ZG-SW-02", "name": "五色陶土·宽口饮水盆", "desc": "五色叠色，宽口设计，犬用水碗", "craft": "五色陶土", "color": "五色自然过渡"},
        {"sku": "ZG-SW-03", "name": "窑变天青·猫咪饮水器", "desc": "天青窑变釉，收口设计，猫用水碗", "craft": "窑变纹理", "color": "天青窑变"},
        {"sku": "ZG-SW-04", "name": "刻花莲瓣·防滑水碗", "desc": "手刻莲瓣纹，磨砂防滑，通用水碗", "craft": "刻花", "color": "红陶原色"},
        {"sku": "ZG-SW-05", "name": "素陶原色·大容量犬水盆", "desc": "大容量素陶，透气材质，犬用水盆", "craft": "素陶", "color": "素陶原色"},
        {"sku": "ZG-SW-06", "name": "人宠同系·晨光双杯套组", "desc": "宠碗+晨杯，晨光窑变，礼盒装", "craft": "窑变纹理", "color": "晨光窑变"},
        {"sku": "ZG-SW-07", "name": "人宠同系·手作双人茶碗与宠碗", "desc": "茶碗×2+宠碗，手刻花纹，家庭套组", "craft": "刻花", "color": "刻花纹样"},
    ],
    "tags": [
        {"sku": "ZG-GP-01", "name": "刻花骨朵·宠物名牌", "desc": "手刻骨朵纹，背面可刻名，小巧陶牌", "craft": "刻花", "color": "红陶原色"},
        {"sku": "ZG-GP-02", "name": "绞胎小圆牌·猫名定制", "desc": "绞胎细纹，轻量圆牌，猫用挂牌", "craft": "绞胎彩纹", "color": "绞胎纹理"},
        {"sku": "ZG-GP-03", "name": "五色陶土·爪印身份牌", "desc": "五色陶土，爪印压纹，犬用挂牌", "craft": "五色陶土", "color": "五色自然色"},
        {"sku": "ZG-GP-04", "name": "窑变釉·星野吊牌", "desc": "星野窑变釉，细碎晶点，纪念挂牌", "craft": "窑变纹理", "color": "星野窑变"},
        {"sku": "ZG-GP-05", "name": "柘红陶·平安锁宠物牌", "desc": "平安锁造型，手刻平安，犬用挂牌", "craft": "刻花", "color": "柘红色"},
        {"sku": "ZG-GP-06", "name": "手刻铃铛·防丢挂牌", "desc": "陶制铃铛，内置铜铃，手刻回纹", "craft": "刻花", "color": "红陶原色"},
        {"sku": "ZG-GP-07", "name": "人宠同系·刻花双牌礼盒", "desc": "宠物牌+钥匙扣，同纹成对，礼盒装", "craft": "刻花", "color": "刻花纹样"},
    ],
    "ornaments": [
        {"sku": "ZG-BJ-01", "name": "窑变釉·卧猫陶摆件", "desc": "卧猫造型，窑变釉色，桌面摆件", "craft": "窑变纹理", "color": "窑变温润色"},
        {"sku": "ZG-BJ-02", "name": "刻花瑞兽·犬守门摆件", "desc": "瑞兽造型，手刻卷草，犬用摆件", "craft": "刻花", "color": "红陶原色"},
        {"sku": "ZG-BJ-03", "name": "五色陶土·招财爪印摆件", "desc": "爪印+铜钱纹，招财寓意，小巧摆件", "craft": "五色陶土", "color": "五色陶土"},
        {"sku": "ZG-BJ-04", "name": "绞胎年轮·宠物与主人桌面像", "desc": "绞胎年轮纹，人宠抽象陶像，定制", "craft": "绞胎彩纹", "color": "年轮绞胎"},
        {"sku": "ZG-BJ-05", "name": "柘沟红陶·睡犬案头摆件", "desc": "红陶素烧，睡犬造型，案头摆件", "craft": "素陶", "color": "红陶素烧"},
        {"sku": "ZG-BJ-06", "name": "窑变星河·猫月摆件", "desc": "猫与弯月组合，星河窑变，卧室摆件", "craft": "窑变纹理", "color": "星河窑变"},
        {"sku": "ZG-BJ-07", "name": "刻花山河·宠物肖像陶盘", "desc": "手刻山河纹，宠物侧影，照片定制", "craft": "刻花", "color": "山河刻花"},
    ],
    "memorials": [
        {"sku": "ZG-JN-01", "name": "窑变星河·宠物纪念罐", "desc": "星河窑变釉，可刻名，密封陶盖", "craft": "窑变纹理", "color": "星河窑变"},
        {"sku": "ZG-JN-02", "name": "绞胎年轮·爪印纪念罐", "desc": "绞胎年轮纹，盖顶爪印，纪念罐", "craft": "绞胎彩纹", "color": "年轮绞胎"},
        {"sku": "ZG-JN-03", "name": "五色陶土·追思小罐", "desc": "五色过渡，小容量，附收纳袋", "craft": "五色陶土", "color": "五色过渡"},
        {"sku": "ZG-JN-04", "name": "刻花莲台·纪念陶罐", "desc": "莲台造型，手刻莲瓣云纹，纪念罐", "craft": "刻花", "color": "莲瓣云纹"},
        {"sku": "ZG-JN-05", "name": "柘红素陶·刻名纪念罐", "desc": "红陶素烧，可刻名与纪念语", "craft": "素陶", "color": "柘红素陶"},
        {"sku": "ZG-JN-06", "name": "窑变暮云·大容量纪念罐", "desc": "大容量，暮云窑变，层次丰富", "craft": "窑变纹理", "color": "暮云窑变"},
        {"sku": "ZG-JN-07", "name": "双生爪印·双宠纪念罐", "desc": "双爪印罐盖，可刻双名，双宠纪念", "craft": "刻花", "color": "双爪印刻花"},
    ]
}

def generate_prompt(product):
    """生成AI图像提示词"""
    base_style = """Product photography of handmade Chinese ceramic pottery on a wooden table with soft natural lighting. Clean minimalist background with subtle warm tones. Studio quality, professional product shot, centered composition, shallow depth of field, soft shadows."""

    product_desc = f"""
{product['name']} - traditional Zhegou pottery from Sishui.
Description: {product['desc']}
Craft style: {product['craft']}
Color: {product['color']}
The ceramic piece should show authentic handmade texture with visible clay grain and natural glaze variations.
"""

    return f"{base_style}\n{product_desc}"

def main():
    print("=" * 60)
    print("泗水柘沟土陶产品图片生成脚本")
    print("=" * 60)
    print()

    # 统计信息
    total_products = sum(len(products) for products in PRODUCTS.values())
    print(f"共需生成 {total_products} 张产品图片")
    print()

    # 输出目录
    output_base = Path("D:/dachuang/generated_product_images")
    output_base.mkdir(exist_ok=True)

    # 生成提示词文件
    prompts_file = output_base / "prompts.json"
    all_prompts = {}

    for category, products in PRODUCTS.items():
        print(f"\n类别: {category}")
        print("-" * 40)

        for product in products:
            sku = product['sku']
            prompt = generate_prompt(product)
            all_prompts[sku] = {
                "name": product['name'],
                "prompt": prompt,
                "output_path": f"{sku}.jpg"
            }
            print(f"  ✓ {sku}: {product['name']}")

    # 保存提示词
    with open(prompts_file, 'w', encoding='utf-8') as f:
        json.dump(all_prompts, f, ensure_ascii=False, indent=2)

    print()
    print("=" * 60)
    print(f"✓ 已生成 {total_products} 个产品的AI提示词")
    print(f"✓ 提示词已保存到: {prompts_file}")
    print()
    print("下一步:")
    print("1. 使用 Gemini AI 图像生成 API 批量生成图片")
    print("2. 或手动使用提示词在 AI 图像生成工具中生成")
    print("=" * 60)

if __name__ == "__main__":
    main()
