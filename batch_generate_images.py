"""
使用 Gemini Imagen 3 批量生成产品图片
"""

import os
import json
import time
from pathlib import Path

try:
    import google.generativeai as genai
    from PIL import Image
    import io
    import requests
except ImportError:
    print("正在安装依赖...")
    os.system("pip install google-generativeai pillow requests")
    import google.generativeai as genai
    from PIL import Image
    import io
    import requests

# 配置
API_KEY = os.getenv("GEMINI_API_KEY")
if not API_KEY:
    print("\n⚠️  未找到 GEMINI_API_KEY 环境变量")
    print("请访问 https://aistudio.google.com/apikey 获取 API Key")
    print("\n设置方法:")
    print("Windows PowerShell: $env:GEMINI_API_KEY='your-key-here'")
    print("然后重新运行此脚本")
    exit(1)

genai.configure(api_key=API_KEY)

def generate_single_image(sku, name, prompt, output_path):
    """生成单张产品图片"""
    try:
        print(f"\n正在生成: {sku} - {name}")

        # 使用 Imagen 3 模型生成图片
        model = genai.ImageGenerationModel("imagen-3.0-generate-001")

        result = model.generate_images(
            prompt=prompt,
            number_of_images=1,
            safety_filter_level="block_only_high",
            person_generation="allow_adult",
            aspect_ratio="1:1",
        )

        if result.images:
            # 保存图片
            image = result.images[0]
            image._pil_image.save(output_path, "JPEG", quality=95)
            print(f"  ✓ 已保存到: {output_path}")
            return True
        else:
            print(f"  ✗ 生成失败: 未返回图片")
            return False

    except Exception as e:
        print(f"  ✗ 错误: {str(e)}")
        return False

def main():
    # 加载提示词
    prompts_file = Path("D:/dachuang/generated_product_images/prompts.json")
    with open(prompts_file, 'r', encoding='utf-8') as f:
        prompts = json.load(f)

    # 创建输出目录
    output_dir = Path("D:/dachuang/frontend/public/images/products")
    output_dir.mkdir(parents=True, exist_ok=True)

    print("=" * 70)
    print("🎨 泗水柘沟土陶产品图片批量生成")
    print("=" * 70)
    print(f"共需生成: {len(prompts)} 张图片")
    print(f"输出目录: {output_dir}")
    print(f"模型: Imagen 3.0")
    print("=" * 70)

    success = 0
    failed = 0

    for i, (sku, data) in enumerate(prompts.items(), 1):
        print(f"\n[{i}/{len(prompts)}]", end=" ")

        output_path = output_dir / f"{sku}.jpg"

        if generate_single_image(sku, data['name'], data['prompt'], output_path):
            success += 1
        else:
            failed += 1

        # 避免API限流
        if i < len(prompts):
            time.sleep(3)

    print("\n" + "=" * 70)
    print("✨ 生成完成!")
    print(f"✓ 成功: {success} 张")
    if failed > 0:
        print(f"✗ 失败: {failed} 张")
    print("=" * 70)

if __name__ == "__main__":
    main()
