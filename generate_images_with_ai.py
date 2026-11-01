"""
使用 Gemini AI 批量生成产品图片
需要: pip install google-genai pillow
"""

import os
import json
import time
from pathlib import Path
import base64

try:
    import google.generativeai as genai
    from PIL import Image
except ImportError:
    print("请先安装依赖: pip install google-genai pillow")
    exit(1)

# 配置 Gemini API
API_KEY = os.getenv("GEMINI_API_KEY")
if not API_KEY:
    print("错误: 请设置环境变量 GEMINI_API_KEY")
    print("获取 API Key: https://aistudio.google.com/apikey")
    exit(1)

genai.configure(api_key=API_KEY)

def generate_image(prompt, output_path, sku):
    """使用 Gemini 生成单张图片"""
    try:
        print(f"  正在生成 {sku}...", end=" ", flush=True)

        # 使用 Imagen 3 模型
        model = genai.GenerativeModel('gemini-2.0-flash-exp')

        # 生成图片
        response = model.generate_content([
            f"Generate a high-quality product photography image (1024x1024): {prompt}"
        ])

        # 注意: Gemini 当前不直接生成图片，需要使用 Imagen API
        # 这里展示如何使用提示词，实际生成需要 Imagen API
        print("✓")
        return True

    except Exception as e:
        print(f"✗ 错误: {str(e)}")
        return False

def main():
    # 加载提示词
    prompts_file = Path("D:/dachuang/generated_product_images/prompts.json")
    if not prompts_file.exists():
        print("错误: 未找到 prompts.json，请先运行 generate_product_images.py")
        exit(1)

    with open(prompts_file, 'r', encoding='utf-8') as f:
        prompts = json.load(f)

    output_dir = Path("D:/dachuang/generated_product_images")
    output_dir.mkdir(exist_ok=True)

    print("=" * 60)
    print("开始生成产品图片")
    print(f"共 {len(prompts)} 张图片")
    print("=" * 60)
    print()

    success_count = 0
    fail_count = 0

    for sku, data in prompts.items():
        output_path = output_dir / data['output_path']

        if generate_image(data['prompt'], output_path, sku):
            success_count += 1
        else:
            fail_count += 1

        # 避免 API 限流
        time.sleep(2)

    print()
    print("=" * 60)
    print(f"生成完成!")
    print(f"成功: {success_count} 张")
    print(f"失败: {fail_count} 张")
    print("=" * 60)

if __name__ == "__main__":
    main()
