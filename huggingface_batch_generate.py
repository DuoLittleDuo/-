"""
使用 Hugging Face Inference API 批量生成产品图片
完全免费，无需充值
"""

import os
import json
import time
from pathlib import Path
import requests

# Hugging Face配置
HF_TOKEN = os.getenv("HF_TOKEN")  # 可选，不设置也能用，但有速率限制
API_URL = "https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell"

def generate_product_image(sku, name, prompt, output_path):
    """使用Hugging Face API生成单张产品图片"""
    try:
        print(f"\n[{sku}] {name}")
        print("  生成中...", end=" ", flush=True)

        headers = {}
        if HF_TOKEN:
            headers["Authorization"] = f"Bearer {HF_TOKEN}"

        payload = {
            "inputs": prompt,
            "parameters": {
                "num_inference_steps": 4,  # Schnell模型用4步即可
                "guidance_scale": 0.0
            }
        }

        response = requests.post(API_URL, headers=headers, json=payload, timeout=60)

        if response.status_code == 200:
            # 保存图片
            with open(output_path, 'wb') as f:
                f.write(response.content)
            print(f"✓ 已保存")
            return True
        elif response.status_code == 503:
            print(f"⏳ 模型加载中，等待30秒后重试...")
            time.sleep(30)
            # 重试一次
            response = requests.post(API_URL, headers=headers, json=payload, timeout=60)
            if response.status_code == 200:
                with open(output_path, 'wb') as f:
                    f.write(response.content)
                print(f"  ✓ 已保存")
                return True
            else:
                print(f"  ✗ 失败: {response.status_code}")
                return False
        else:
            print(f"✗ 错误: {response.status_code} - {response.text[:100]}")
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
    print(f"模型: Flux Schnell (Hugging Face)")
    print(f"共需生成: {len(prompts)} 张图片")
    print(f"输出目录: {output_dir}")
    print(f"分辨率: 1024x1024")
    print(f"费用: 完全免费")

    if not HF_TOKEN:
        print("提示: 未设置HF_TOKEN，使用公共API（有速率限制）")
        print("      如需更快速度，访问 https://huggingface.co/settings/tokens 获取token")
        print("      然后运行: $env:HF_TOKEN='your-token'")

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

            # 避免速率限制，每张图间隔5秒
            time.sleep(5)

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
