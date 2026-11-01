"""为商品图生成 WebP 衍生物（不改后端，不动原图）。

输出到 frontend/public/images/products/opt/：
    {sku}-480.webp / -960.webp / -1440.webp   等比缩放
    {sku}-detail-960.webp                      中心 70% 裁切，用作「釉面」细节图

用法（项目根目录）：
    python frontend/scripts/optimize_images.py
"""

from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "frontend" / "public" / "images" / "products"
OUT = SRC / "opt"

WIDTHS = (480, 960, 1440)
QUALITY = 82
DETAIL_WIDTH = 960
DETAIL_CROP = 0.7


def resize_to_width(image: Image.Image, width: int) -> Image.Image:
    if image.width <= width:
        return image.copy()
    height = round(image.height * width / image.width)
    return image.resize((width, height), Image.LANCZOS)


def center_crop(image: Image.Image, ratio: float) -> Image.Image:
    w = round(image.width * ratio)
    h = round(image.height * ratio)
    left = (image.width - w) // 2
    top = (image.height - h) // 2
    return image.crop((left, top, left + w, top + h))


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    sources = sorted(SRC.glob("*.jpg"))
    if not sources:
        raise SystemExit(f"没有在 {SRC} 找到商品图")

    total = 0
    for path in sources:
        sku = path.stem
        with Image.open(path) as raw:
            image = raw.convert("RGB")

            for width in WIDTHS:
                target = OUT / f"{sku}-{width}.webp"
                resize_to_width(image, width).save(target, "WEBP", quality=QUALITY, method=6)
                total += 1

            detail = resize_to_width(center_crop(image, DETAIL_CROP), DETAIL_WIDTH)
            detail.save(OUT / f"{sku}-detail-{DETAIL_WIDTH}.webp", "WEBP", quality=QUALITY + 2, method=6)
            total += 1

    size = sum(p.stat().st_size for p in OUT.glob("*.webp"))
    print(f"完成：{len(sources)} 张原图 → {total} 个 WebP 衍生物，共 {size / 1024 / 1024:.1f} MB → {OUT}")


if __name__ == "__main__":
    main()
