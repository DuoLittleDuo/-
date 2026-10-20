"""语义检索服务：BGE 向量 + 关键词混合打分，失败时自动降级。"""

from __future__ import annotations

import hashlib
import json
import logging
import math
import os
import threading
import time
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
from sqlalchemy.orm import Session, joinedload

from ..config import INDEX_DIR, settings
from ..models import Product
from ..schemas import (
    ProductCardOut,
    RelatedItemOut,
    RelatedResponse,
    SearchItemOut,
    SearchResponse,
    product_card,
)
from . import search_text as st

# 必须在导入 fastembed / huggingface_hub 之前设置镜像地址
os.environ.setdefault("HF_ENDPOINT", settings.hf_endpoint)

logger = logging.getLogger(__name__)

INDEX_VERSION = 1
MATRIX_FILE = "product_embeddings.npy"
IDS_FILE = "index_ids.json"
META_FILE = "index_meta.json"


class SearchService:
    def __init__(self) -> None:
        self._model = None
        self._model_loaded = False
        self._model_error: str | None = None
        self._model_lock = threading.Lock()
        self._encode_lock = threading.Lock()

        self._ids: list[int] = []
        self._matrix: np.ndarray | None = None
        self._meta: dict = {}
        self._ready = False
        self._last_error: str | None = None
        self._build_lock = threading.Lock()

    # ---------- 模型 ----------

    def _ensure_model(self, force_retry: bool = False) -> bool:
        if not settings.semantic_enabled:
            self._model_error = "配置中已关闭语义检索"
            return False

        with self._model_lock:
            if self._model is not None:
                return True
            if self._model_loaded and not force_retry:
                return False

            try:
                os.environ.setdefault("HF_ENDPOINT", settings.hf_endpoint)
                from fastembed import TextEmbedding

                logger.info("正在加载中文向量模型 %s ...", settings.embedding_model)
                self._model = TextEmbedding(
                    model_name=settings.embedding_model,
                    cache_dir=str(settings.model_cache_dir),
                    threads=2,
                )
                self._model_error = None
                logger.info("向量模型加载完成")
            except Exception as exc:  # noqa: BLE001 - 任何失败都降级
                self._model = None
                self._model_error = f"{type(exc).__name__}: {exc}"
                logger.warning("向量模型加载失败，将使用关键词兜底：%s", self._model_error)
            finally:
                self._model_loaded = True

        return self._model is not None

    def _encode(self, texts: list[str], *, query: bool) -> np.ndarray:
        with self._encode_lock:
            if query and hasattr(self._model, "query_embed"):
                vectors = list(self._model.query_embed(texts))
            else:
                vectors = list(self._model.embed(texts))

        array = np.asarray(vectors, dtype=np.float32)
        norms = np.linalg.norm(array, axis=1, keepdims=True)
        norms[norms == 0] = 1.0
        return np.ascontiguousarray(array / norms)

    # ---------- 索引持久化 ----------

    @staticmethod
    def _content_hash(rows: list[tuple[int, str]]) -> str:
        payload = json.dumps(rows, ensure_ascii=False, sort_keys=True)
        return hashlib.sha256(payload.encode("utf-8")).hexdigest()

    def _index_paths(self) -> tuple[Path, Path, Path]:
        return (
            INDEX_DIR / MATRIX_FILE,
            INDEX_DIR / IDS_FILE,
            INDEX_DIR / META_FILE,
        )

    def _load_index_if_valid(self, content_hash: str, count: int) -> bool:
        matrix_path, ids_path, meta_path = self._index_paths()
        if not (matrix_path.exists() and ids_path.exists() and meta_path.exists()):
            return False

        try:
            meta = json.loads(meta_path.read_text(encoding="utf-8"))
            ids = json.loads(ids_path.read_text(encoding="utf-8"))
            matrix = np.load(matrix_path)

            if meta.get("version") != INDEX_VERSION:
                return False
            if meta.get("model") != settings.embedding_model:
                return False
            if meta.get("hash") != content_hash or meta.get("count") != count:
                return False
            if len(ids) != count or matrix.shape[0] != count:
                return False
            if matrix.dtype != np.float32:
                matrix = matrix.astype(np.float32)

            self._ids = [int(item) for item in ids]
            self._matrix = np.ascontiguousarray(matrix)
            self._meta = meta
            self._ready = True
            self._last_error = None
            logger.info("已加载语义索引：%s 个商品", count)
            return True
        except Exception as exc:  # noqa: BLE001
            logger.warning("读取语义索引失败，将重建：%s", exc)
            return False

    def _save_index(self, matrix: np.ndarray, ids: list[int], meta: dict) -> None:
        matrix_path, ids_path, meta_path = self._index_paths()
        INDEX_DIR.mkdir(parents=True, exist_ok=True)

        matrix_tmp = matrix_path.with_suffix(".npy.tmp")
        with open(matrix_tmp, "wb") as handle:
            np.save(handle, matrix)
        matrix_tmp.replace(matrix_path)

        ids_tmp = ids_path.with_suffix(".json.tmp")
        ids_tmp.write_text(json.dumps(ids), encoding="utf-8")
        ids_tmp.replace(ids_path)

        meta_tmp = meta_path.with_suffix(".json.tmp")
        meta_tmp.write_text(json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8")
        meta_tmp.replace(meta_path)

    # ---------- 索引构建 ----------

    def build_index(self, db: Session, *, force: bool = False) -> dict:
        started = time.perf_counter()
        with self._build_lock:
            rows = (
                db.query(Product.id, Product.search_text)
                .filter(Product.is_active.is_(True))
                .order_by(Product.id.asc())
                .all()
            )
            rows = [(int(row[0]), row[1] or "") for row in rows]

            if not rows:
                self._ready = False
                self._ids = []
                self._matrix = None
                return {
                    "ok": True,
                    "count": 0,
                    "duration_ms": round((time.perf_counter() - started) * 1000, 1),
                    "backend": "fastembed-onnx",
                    "model": settings.embedding_model,
                    "message": "暂无商品，索引为空",
                }

            content_hash = self._content_hash(rows)

            # 必须先加载模型：查询编码依赖它，即使索引可以直接从磁盘复用
            if not self._ensure_model(force_retry=force):
                self._ready = False
                self._last_error = self._model_error
                return {
                    "ok": False,
                    "count": 0,
                    "duration_ms": round((time.perf_counter() - started) * 1000, 1),
                    "backend": "keyword",
                    "model": settings.embedding_model,
                    "message": "向量模型不可用，搜索将使用关键词兜底",
                    "error": self._model_error,
                }

            if not force and self._load_index_if_valid(content_hash, len(rows)):
                return {
                    "ok": True,
                    "count": len(rows),
                    "duration_ms": round((time.perf_counter() - started) * 1000, 1),
                    "backend": "fastembed-onnx",
                    "model": settings.embedding_model,
                    "message": "索引已是最新，直接复用",
                }

            try:
                matrix = self._encode([text for _, text in rows], query=False)
            except Exception as exc:  # noqa: BLE001
                self._ready = False
                self._last_error = f"{type(exc).__name__}: {exc}"
                logger.exception("向量编码失败")
                return {
                    "ok": False,
                    "count": 0,
                    "duration_ms": round((time.perf_counter() - started) * 1000, 1),
                    "backend": "keyword",
                    "model": settings.embedding_model,
                    "message": "向量编码失败，搜索将使用关键词兜底",
                    "error": self._last_error,
                }

            ids = [product_id for product_id, _ in rows]
            meta = {
                "version": INDEX_VERSION,
                "model": settings.embedding_model,
                "dim": int(matrix.shape[1]),
                "count": len(ids),
                "hash": content_hash,
                "built_at": datetime.now(timezone.utc).isoformat(),
            }

            try:
                self._save_index(matrix, ids, meta)
            except Exception as exc:  # noqa: BLE001 - 保存失败不影响内存检索
                logger.warning("索引持久化失败：%s", exc)

            self._ids = ids
            self._matrix = matrix
            self._meta = meta
            self._ready = True
            self._last_error = None

            duration_ms = round((time.perf_counter() - started) * 1000, 1)
            logger.info("语义索引构建完成：%s 个商品，耗时 %.1f ms", len(ids), duration_ms)
            return {
                "ok": True,
                "count": len(ids),
                "duration_ms": duration_ms,
                "backend": "fastembed-onnx",
                "model": settings.embedding_model,
                "message": "索引构建完成",
            }

    def start_warmup(self) -> None:
        """后台预热，避免阻塞服务启动。"""

        def _run() -> None:
            from ..database import SessionLocal

            try:
                with SessionLocal() as db:
                    self.build_index(db)
            except Exception as exc:  # noqa: BLE001
                self._last_error = f"{type(exc).__name__}: {exc}"
                logger.exception("语义索引预热失败")

        threading.Thread(target=_run, name="search-warmup", daemon=True).start()

    # ---------- 检索 ----------

    def _score_product(
        self,
        product: Product,
        *,
        normalized_query: str,
        query_terms: list[str],
        similarity: float | None,
        detected_category: str | None,
        detected_pet: str | None,
    ) -> tuple[float, list[str], float]:
        lexical, matched, overlap = st.lexical_score(
            normalized_query,
            query_terms,
            name=product.name,
            document=product.search_text,
        )

        category_name = product.category.name if product.category is not None else ""
        category_bonus = 0.05 if detected_category and detected_category == category_name else 0.0

        pet_bonus = 0.0
        if detected_pet:
            if product.pet_type == detected_pet:
                pet_bonus = 0.09
            elif product.pet_type == "通用":
                pet_bonus = 0.025
            else:
                pet_bonus = -0.03

        document = product.search_text or ""
        exact_bonus = 0.03 if normalized_query and normalized_query in document else 0.0

        if similarity is not None:
            final = (
                settings.semantic_weight * similarity
                + settings.keyword_weight * lexical
                + category_bonus
                + pet_bonus
                + exact_bonus
            )
        else:
            final = lexical + category_bonus + pet_bonus + exact_bonus

        return min(1.0, final), matched, overlap

    def search(
        self,
        db: Session,
        query: str,
        *,
        category_id: int | None = None,
        page: int = 1,
        page_size: int = 12,
    ) -> SearchResponse:
        started = time.perf_counter()
        normalized_query = st.normalize_query(query)
        query_terms = st.find_query_terms(normalized_query)
        detected_category = st.detect_category(normalized_query)
        detected_pet = st.detect_pet(normalized_query)

        products = (
            db.query(Product)
            .options(joinedload(Product.category))
            .filter(Product.is_active.is_(True))
            .all()
        )
        if category_id is not None:
            products = [product for product in products if product.category_id == category_id]

        by_id = {product.id: product for product in products}

        similarities: dict[int, float] = {}
        semantic_available = bool(
            self._ready and self._matrix is not None and len(self._ids) and products
        )

        if semantic_available:
            try:
                query_vector = self._encode([normalized_query], query=True)[0]
                raw_scores = self._matrix @ query_vector
                for index, product_id in enumerate(self._ids):
                    if product_id in by_id:
                        similarities[product_id] = max(0.0, min(1.0, float(raw_scores[index])))
            except Exception as exc:  # noqa: BLE001
                self._last_error = f"{type(exc).__name__}: {exc}"
                logger.warning("查询向量编码失败，改用关键词兜底：%s", exc)
                semantic_available = False
                similarities = {}

        hybrid_items: list[SearchItemOut] = []
        keyword_items: list[SearchItemOut] = []

        for product in products:
            similarity = similarities.get(product.id) if semantic_available else None
            card = product_card(product)

            score, matched, _overlap = self._score_product(
                product,
                normalized_query=normalized_query,
                query_terms=query_terms,
                similarity=similarity,
                detected_category=detected_category,
                detected_pet=detected_pet,
            )

            reason = st.match_reason(
                similarity=(similarity * 100 if similarity is not None else None),
                matched=matched,
                category_name=card.category_name,
                pet_type=product.pet_type,
            )

            item = SearchItemOut(
                product=card,
                score=round(score, 4),
                similarity=round(similarity * 100, 1) if similarity is not None else None,
                match_reason=reason,
                matched_terms=matched[:6],
            )

            if similarity is not None and score >= settings.min_final_score:
                hybrid_items.append(item)

            # 同时准备纯关键词排序，供语义结果为空时兜底
            if similarity is not None:
                keyword_score, keyword_matched, _ = self._score_product(
                    product,
                    normalized_query=normalized_query,
                    query_terms=query_terms,
                    similarity=None,
                    detected_category=detected_category,
                    detected_pet=detected_pet,
                )
                if keyword_score > 0.02:
                    keyword_items.append(
                        SearchItemOut(
                            product=card,
                            score=round(keyword_score, 4),
                            similarity=None,
                            match_reason=st.match_reason(
                                similarity=None,
                                matched=keyword_matched,
                                category_name=card.category_name,
                                pet_type=product.pet_type,
                            ),
                            matched_terms=keyword_matched[:6],
                        )
                    )
            elif score > 0.02:
                keyword_items.append(item)

        if hybrid_items:
            mode = "hybrid"
            ranked = hybrid_items
        else:
            mode = "keyword"
            ranked = keyword_items

        ranked.sort(key=lambda item: (-item.score, -item.product.sales_count, item.product.id))

        # 自适应截断：只保留与最高分足够接近的结果，避免把整个商品库都当成搜索结果
        if ranked:
            if mode == "hybrid":
                cutoff = max(
                    settings.min_final_score,
                    ranked[0].score * settings.search_relative_ratio,
                )
            else:
                cutoff = max(0.25, ranked[0].score * 0.70)
            ranked = [item for item in ranked if item.score >= cutoff]

        total = len(ranked)
        pages = math.ceil(total / page_size) if total else 0
        start = (page - 1) * page_size
        page_items = ranked[start : start + page_size]

        return SearchResponse(
            query=query,
            normalized_query=normalized_query,
            mode=mode,
            semantic_ready=self._ready,
            total=total,
            page=page,
            page_size=page_size,
            pages=pages,
            took_ms=round((time.perf_counter() - started) * 1000, 1),
            items=page_items,
        )

    # ---------- 相关推荐 ----------

    def get_related(self, db: Session, product: Product, limit: int = 6) -> RelatedResponse:
        products = (
            db.query(Product)
            .options(joinedload(Product.category))
            .filter(Product.is_active.is_(True), Product.id != product.id)
            .all()
        )
        by_id = {item.id: item for item in products}

        items: list[RelatedItemOut] = []
        mode = "category"

        if self._ready and self._matrix is not None and product.id in self._ids:
            try:
                index = self._ids.index(product.id)
                similarities = self._matrix @ self._matrix[index]
                scored = [
                    (
                        product_id,
                        max(0.0, min(1.0, float(similarities[position]))),
                    )
                    for position, product_id in enumerate(self._ids)
                    if product_id != product.id and product_id in by_id
                ]
                scored.sort(key=lambda pair: pair[1], reverse=True)
                if scored:
                    items = [
                        RelatedItemOut(
                            product=product_card(by_id[product_id]),
                            similarity=round(similarity * 100, 1),
                        )
                        for product_id, similarity in scored[:limit]
                    ]
                    mode = "semantic"
            except Exception as exc:  # noqa: BLE001
                logger.warning("相关推荐语义计算失败，改用同类目兜底：%s", exc)

        if not items:
            pool = [item for item in products if item.category_id == product.category_id] or products
            pool.sort(key=lambda item: (-(item.hot_score or 0), -(item.sales_count or 0), item.id))
            items = [
                RelatedItemOut(product=product_card(item), similarity=None)
                for item in pool[:limit]
            ]
            mode = "category"

        return RelatedResponse(mode=mode, items=items)

    # ---------- 状态 ----------

    def status(self) -> dict:
        return {
            "enabled": settings.semantic_enabled,
            "ready": self._ready,
            "backend": "fastembed-onnx" if self._ready else "keyword",
            "model": settings.embedding_model,
            "index_count": len(self._ids),
            "last_error": self._last_error or self._model_error,
        }


search_service = SearchService()
