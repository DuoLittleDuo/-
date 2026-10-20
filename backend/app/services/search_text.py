"""中文检索文本处理：归一化、领域别名、关键词打分。

不依赖任何 AI 库，模型不可用时也由这里提供关键词兜底能力。
"""

import re
import unicodedata

# 类目 -> 用户可能输入的别名（领域词表）
CATEGORY_ALIASES: dict[str, list[str]] = {
    "宠物食盆": [
        "食盆", "狗碗", "猫碗", "饭盆", "饭碗", "吃饭的碗", "狗吃饭的碗",
        "猫吃饭的碗", "宠物餐具", "宠物食器", "陶瓷饭盆", "宠物碗", "喂食盆",
    ],
    "宠物水碗": [
        "水碗", "水盆", "饮水盆", "饮水器", "喝水器", "喝水碗", "喝水器皿",
        "猫咪喝水器皿", "狗喝水碗", "宠物水具", "自动饮水", "蓄水碗", "喝水盆",
    ],
    "宠物挂牌": [
        "挂牌", "名牌", "狗牌", "猫牌", "身份牌", "吊牌", "防丢牌", "项圈牌", "宠物牌",
    ],
    "宠物摆件": [
        "摆件", "雕像", "桌面装饰", "陶艺摆件", "宠物雕像", "案头摆件", "装饰摆件",
    ],
    "宠物纪念罐": [
        "纪念罐", "骨灰罐", "骨灰盒", "纪念盒", "追思罐", "追思盒", "宠物骨灰",
        "纪念陶罐", "纪念器",
    ],
}

PET_ALIASES: dict[str, list[str]] = {
    "猫": ["猫咪", "小猫", "喵星人", "猫", "喵"],
    "犬": ["狗狗", "小狗", "汪星人", "犬", "狗", "汪"],
}

CRAFT_TERMS = [
    "五色陶土", "五色土", "绞胎彩纹", "绞胎", "窑变纹理", "窑变", "刻花", "素陶", "红陶", "澄泥",
]

_ALIAS_PAIRS = sorted(
    [(alias, category) for category, aliases in CATEGORY_ALIASES.items() for alias in aliases],
    key=lambda item: len(item[0]),
    reverse=True,
)
_PET_PAIRS = sorted(
    [(alias, pet) for pet, aliases in PET_ALIASES.items() for alias in aliases],
    key=lambda item: len(item[0]),
    reverse=True,
)


def normalize_query(text: str) -> str:
    text = unicodedata.normalize("NFKC", text or "")
    text = re.sub(r"\s+", " ", text).strip().lower()
    return text[:100]


def cjk_bigrams(text: str) -> set[str]:
    """中文按相邻二字切分；英文/数字按整词保留。"""
    text = text or ""
    grams: set[str] = set()
    for sequence in re.findall(r"[㐀-鿿]+", text):
        if len(sequence) == 1:
            grams.add(sequence)
        else:
            for index in range(len(sequence) - 1):
                grams.add(sequence[index : index + 2])
    for word in re.findall(r"[a-z0-9]{2,}", text):
        grams.add(word)
    return grams


def detect_category(normalized_query: str) -> str | None:
    for alias, category in _ALIAS_PAIRS:
        if alias in normalized_query:
            return category
    return None


def detect_pet(normalized_query: str) -> str | None:
    for alias, pet in _PET_PAIRS:
        if alias in normalized_query:
            return pet
    return None


def find_query_terms(normalized_query: str) -> list[str]:
    """找出查询中出现的领域词、宠物词与工艺词（去重、保持出现顺序）。"""
    terms: list[str] = []
    for alias, _category in _ALIAS_PAIRS:
        if alias in normalized_query and alias not in terms:
            terms.append(alias)
    for alias, _pet in _PET_PAIRS:
        if alias in normalized_query and alias not in terms:
            terms.append(alias)
    for craft in CRAFT_TERMS:
        if craft in normalized_query and craft not in terms:
            terms.append(craft)
    return terms


def build_search_document(
    *,
    name: str,
    subtitle: str | None,
    description: str | None,
    category_name: str,
    tags: list[str] | None,
    pet_type: str,
    material: str | None,
    craft: str | None,
    spec_text: str | None,
) -> str:
    """拼装用于向量化与关键词匹配的检索文档。"""
    tags = tags or []
    parts: list[str] = [
        name,
        subtitle or "",
        description or "",
        category_name,
        " ".join(tags),
        pet_type,
        material or "",
        craft or "",
        spec_text or "",
    ]
    parts.extend(CATEGORY_ALIASES.get(category_name, []))

    if pet_type in PET_ALIASES:
        parts.extend(PET_ALIASES[pet_type])
    else:
        parts.extend(["猫", "狗", "猫咪", "狗狗", "宠物"])

    if "人宠同系" in tags:
        parts.extend(["人宠同系", "人宠同款", "主人和宠物", "情侣杯", "礼盒", "套装"])

    return " ".join(part for part in parts if part)


def lexical_score(
    normalized_query: str,
    query_terms: list[str],
    *,
    name: str,
    document: str,
) -> tuple[float, list[str], float]:
    """返回 (词法分, 命中词, 中文二元组重合率)。"""
    document = document or ""
    name = name or ""

    matched = [term for term in query_terms if term in document or term in name]
    term_coverage = len(matched) / len(query_terms) if query_terms else 0.0

    query_grams = cjk_bigrams(normalized_query)
    document_grams = cjk_bigrams(document)
    overlap = len(query_grams & document_grams) / len(query_grams) if query_grams else 0.0

    name_hit = 1.0 if any(term in name for term in matched) else 0.0
    lexical = 0.60 * term_coverage + 0.25 * overlap + 0.15 * name_hit
    return lexical, matched, overlap


def match_reason(
    *,
    similarity: float | None,
    matched: list[str],
    category_name: str,
    pet_type: str,
) -> str:
    parts: list[str] = []
    if similarity is not None and similarity >= 45:
        parts.append("语义相近")
    if matched:
        parts.append("关键词命中：" + "、".join(matched[:3]))
    if category_name:
        parts.append(category_name)
    if pet_type and pet_type != "通用":
        parts.append(f"{pet_type}用")
    return " · ".join(parts) or "相关推荐"
