"""
使用 Flux AI 批量生成产品图片（通过 Replicate API）
Flux Schnell - 免费、快速、高质量
"""

import os
import json
import time
from pathlib import Path
import requests

try:
    import replicate
except ImportError:
    print("正在安装依赖...")
    os.system("pip install replicate requests")
    import replicate

# 设置API密钥：只从环境变量读取，不要把密钥写进代码
API_KEY = os.getenv("REPLICATE_API_TOKEN")
if not API_KEY:
    raise SystemExit("请先设置环境变量 REPLICATE_API_TOKEN")
os.environ["REPLICATE_API_TOKEN"] = API_KEY

def generate_product_image(sku, name, prompt, output_path):
    """使用Flux Schnell生成单张产品图片"""
    try:
        print(f"\n[{sku}] {name}")
        print("  生成中...", end=" ", flush=True)

        # 使用Flux Schnell模型（免费且快速）
        output = replicate.run(
            "black-forest-labs/flux-schnell",
            input={
                "prompt": prompt,
                "num_outputs": 1,
                "aspect_ratio": "1:1",
                "output_format": "jpg",
                "output_quality": 95
            }
        )

        if output and len(output) > 0:
            # 下载图片
            image_url = output[0]
            response = requests.get(image_url)

            if response.status_code == 200:
                with open(output_path, 'wb') as f:
                    f.write(response.content)
                print(f"✓ 已保存")
                return True
            else:
                print(f"✗ 下载失败")
                return False
        else:
            print(f"✗ 未生成图片")
            return False

    except Exception as e:
        print(f"✗ 错误: {str(e)}")
        return False

def main():
    # 读取提示词
    prompts_file = Path("D:/dachuang/generated_product_images/prompts.json")
    if not prompts_file.exists():
        print("错误: 未找到 prompts.json")
        return

    with open(prompts_file, 'r', encoding='utf-8') as f:
        prompts = json.load(f)

    # 输出目录
    output_dir = Path("D:/dachuang/frontend/public/images/products")
    output_dir.mkdir(parents=True, exist_ok=True)

    print("="*70)
    print("🎨 泗水柘沟土陶产品图片批量生成")
    print("="*70)
    print(f"模型: Flux Schnell (Black Forest Labs)")
    print(f"共需生成: {len(prompts)} 张图片")
    print(f"输出目录: {output_dir}")
    print(f"分辨率: 1024x1024")
    print(f"费用: 完全免费")
    print("="*70)

    success = 0
    failed = 0
    failed_skus = []

    # 按类别组织
    categories = {
        "🥣 宠物食盆": ["ZG-SB-01", "ZG-SB-02", "ZG-SB-03", "ZG-SB-04", "ZG-SB-05", "ZG-SB-06", "ZG-SB-07"],
        "💧 宠物水碗": ["ZG-SW-01", "ZG-SW-02", "ZG-SW-03", "ZG-SW-04", "ZG-SW-05", "ZG-SW-06", "ZG-SW-07"],
        "🐾 宠物挂牌": ["ZG-GP-01", "ZG-GP-02", "ZG-GP-03", "ZG-GP-04", "ZG-GP-05", "ZG-GP-06", "ZG-GP-07"],
        "🏺 宠物摆件": ["ZG-BJ-01", "ZG-BJ-02", "ZG-BJ-03", "ZG-BJ-04", "ZG-BJ-05", "ZG-BJ-06", "ZG-BJ-07"],
        "🕯️ 宠物纪念罐": ["ZG-JN-01", "ZG-JN-02", "ZG-JN-03", "ZG-JN-04", "ZG-JN-05", "ZG-JN-06", "ZG-JN-07"],
    }

    for category, skus in categories.items():
        print(f"\n{category}")
        print("-"*70)

        for sku in skus:
            if sku not in prompts:
                continue

            data = prompts[sku]
            output_path = output_dir / f"{sku}.jpg"

            if generate_product_image(sku, data['name'], data['prompt'], output_path):
                success += 1
            else:
                failed += 1
                failed_skus.append(sku)

            # 避免API限流
            time.sleep(1)

    # 总结
    print("\n" + "="*70)
    print("✨ 生成完成!")
    print("="*70)
    print(f"✓ 成功: {success}/{len(prompts)} 张")

    if failed > 0:
        print(f"✗ 失败: {failed} 张")
        print(f"失败的SKU: {', '.join(failed_skus)}")

    print(f"\n图片保存位置: {output_dir}")
    print("="*70)

if __name__ == "__main__":
    main()
