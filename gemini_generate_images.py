"""
使用 Google Gemini Imagen 3 批量生成产品图片
要求: pip install google-genai pillow
"""

import os
import json
import time
from pathlib import Path

try:
    from google import genai
    from google.genai import types
except ImportError:
    print("正在安装依赖...")
    os.system("pip install google-genai pillow")
    from google import genai
    from google.genai import types

# 检查API密钥
API_KEY = os.getenv("GEMINI_API_KEY")
if not API_KEY:
    print("\n" + "="*70)
    print("⚠️  需要设置 GEMINI_API_KEY")
    print("="*70)
    print("\n步骤:")
    print("1. 访问 https://aistudio.google.com/apikey")
    print("2. 创建API密钥（免费）")
    print("3. 在PowerShell中运行: $env:GEMINI_API_KEY='your-key-here'")
    print("4. 重新运行此脚本\n")
    exit(1)

# 配置客户端
client = genai.Client(api_key=API_KEY)

def generate_product_image(sku, name, prompt, output_path):
    """使用Imagen 3生成单张产品图片"""
    try:
        print(f"\n[{sku}] {name}")
        print("  生成中...", end=" ", flush=True)

        # 使用Imagen 3生成图片
        response = client.models.generate_images(
            model='imagen-3.0-generate-001',
            prompt=prompt,
            config=types.GenerateImagesConfig(
                number_of_images=1,
                aspect_ratio='1:1',  # 1024x1024
                safety_filter_level='block_only_high',
                person_generation='allow_adult'
            )
        )

        if response.generated_images:
            # 保存图片
            image = response.generated_images[0].image
            image_data = image.image_data

            with open(output_path, 'wb') as f:
                f.write(image_data)

            print(f"✓ 已保存")
            return True
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
    print(f"模型: Google Imagen 3")
    print(f"共需生成: {len(prompts)} 张图片")
    print(f"输出目录: {output_dir}")
    print(f"分辨率: 1024x1024")
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
            time.sleep(2)

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
