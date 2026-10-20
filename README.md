# 柘沟陶宠 · 宠物陶器文创商城

> 非遗土陶 × 宠物经济 × AI 语义检索  
> 大创项目「AI 赋能柘沟土陶 · 宠物陶制文创开发与宠物经济转化」演示网站

---

## 📌 开发进度（实时更新）

> 最后更新：2026-10-18

| 阶段 | 内容 | 状态 |
|---|---|---|
| 0 | 需求梳理与技术方案 | ✅ 已完成 |
| 1 | 后端骨架：配置、数据库、数据模型 | ✅ 已完成 |
| 2 | 请求/响应模型、认证与收藏 | ✅ 已完成 |
| 3 | 商品、类目、种子数据（35 件） | ✅ 已完成 |
| 4 | 语义检索服务（BGE + 混合打分 + 兜底） | ✅ 已完成 |
| 5 | 后端全部接口（认证/商品/搜索/收藏/管理） | ✅ 已完成 |
| 6 | 前端骨架、登录页与全部页面组件 | ✅ 已完成 |
| 7 | 前端依赖安装与生产构建 | ✅ 已完成（115 个模块，构建通过） |
| 8 | 后端依赖安装（fastembed / onnxruntime） | ✅ 已完成 |
| 9 | 初始化数据（5 类目 / 35 商品 / 2 账号） | ✅ 已完成 |
| 10 | 语义模型下载与索引构建（35 件） | ✅ 已完成 |
| 11 | 前后端联调、页面渲染与接口验收 | ✅ 28 / 28 项通过 |
| 12 | 购物车与订单后端（结算/支付/收货/取消/库存回滚） | ✅ 已完成 |
| 13 | 购物车、结算、订单列表与详情前端 | ✅ 已完成 |
| 14 | 接口验收扩展 | ✅ 45 / 45 项通过 |
| 15 | 真实浏览器端到端购买流程 | ✅ 全部通过 |

**当前状态**：网站已可运行，完整购买链路可用。前端 http://localhost:5173，接口文档 http://127.0.0.1:8000/docs。

### 搜索验收结果

| 搜索词 | 模式 | 返回 | 第一名 |
|---|---|---|---|
| 狗吃饭的碗 | AI 语义 | 7 件 | 山河绞胎·犬用陶瓷食盆 |
| 猫咪喝水器皿 | AI 语义 | 5 件 | 窑变天青·猫咪饮水器 |
| 给狗狗的陶瓷饭盆 | AI 语义 | 6 件 | 山河绞胎·犬用陶瓷食盆 |
| 宠物纪念罐 | AI 语义 | 7 件 | 窑变星河·宠物纪念罐 |
| 人宠同系 | AI 语义 | 6 件 | 人宠同系·刻花双牌礼盒 |
| 绞胎 | AI 语义 | 6 件 | 山河绞胎·犬用陶瓷食盆 |
| 猫挂牌 | AI 语义 | 4 件 | 绞胎小圆牌·猫名定制 |
| 量子猫粮 | AI 语义 | 6 件 | 猫用食盆（弱相关，无精确匹配） |

关键词兜底模式已用独立实例验证：关闭语义检索后，三条核心搜索词仍返回正确类目，`mode=keyword`、相似度为 `null`。

### 交易闭环验收

- 加入购物车、修改数量、移除、清空、按选中条目结算
- 下单时校验库存并扣减；取消待支付订单后恢复库存
- 模拟支付 → 待收货 → 确认收货 → 已完成
- 浏览器 E2E：登录 → 商品详情加购 → 购物车 → 结算 → 支付 → 收货 → 订单列表，全部通过

> 若 pip 在清华镜像上出现依赖解析异常，可改用官方源重试：
> `backend\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt -i https://pypi.org/simple`

---

## ✨ 项目功能

- **登录 / 注册**：JWT Bearer 认证，密码 PBKDF2-SHA256 加盐哈希
- **首页**：品牌 Hero、大搜索框、示例搜索词、类目入口、热销推荐
- **AI 语义搜索**：本地 `BAAI/bge-small-zh-v1.5` 中文向量模型 + 关键词混合打分
  - 搜「狗吃饭的碗」→ 命中「宠物食盆」
  - 搜「猫咪喝水器皿」→ 命中「宠物水碗」
  - 模型不可用时自动降级为关键词检索，演示不中断
- **商品详情**：价格、纹样标签、工艺规格、文化故事、语义相关推荐
- **收藏**：登录用户收藏 / 取消收藏，跨会话保存
- **购物车**：加入、修改数量、选中结算、移除、清空，带库存校验
- **订单**：结算下单、订单列表与详情、模拟支付、确认收货、取消订单与库存回滚
- **管理接口**：重建向量索引、搜索与订单统计（Swagger 演示）

本期不做：真实支付与物流、AI 纹样生成、3D 预览、真实商品图片、管理后台页面。

---

## 🧱 技术栈

| 层 | 技术 |
|---|---|
| 前端 | React 18 + Vite + React Router + Tailwind CSS |
| 后端 | Python 3.11 + FastAPI + SQLAlchemy 2 |
| 数据库 | SQLite（WAL 模式） |
| 语义检索 | fastembed (ONNX) + `BAAI/bge-small-zh-v1.5` + NumPy 余弦相似度 |
| 认证 | PyJWT + PBKDF2-HMAC-SHA256 |

---

## 🚀 启动方式（Windows PowerShell）

> 环境要求：Python 3.10+（推荐 3.11）、Node 18+

### 1. 后端

```powershell
cd d:\dachuang
python -m venv backend\.venv
backend\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt
Copy-Item backend\.env.example backend\.env
python -c "import secrets; print(secrets.token_urlsafe(48))"
# 把输出填入 backend\.env 的 SECRET_KEY
```

> 更省事的方式：直接运行 `.\start-backend.ps1`，首次会自动生成带随机密钥的 `.env`、检查数据并启动。
> 需要精确复现当前环境时，可用 `backend\requirements.lock.txt` 替代 `requirements.txt`。

首次初始化数据并下载语义模型（约 90MB，走国内镜像）：

```powershell
$env:HF_ENDPOINT = "https://hf-mirror.com"
cd d:\dachuang\backend
.\.venv\Scripts\python.exe -m app.seed --reset
```

启动接口服务：

```powershell
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

- 接口文档：http://127.0.0.1:8000/docs
- 健康检查：http://127.0.0.1:8000/api/health

### 2. 前端

另开一个终端：

```powershell
cd d:\dachuang\frontend
npm install
npm run dev
```

打开 http://localhost:5173

### 3. 演示账号

| 角色 | 账号 | 密码 |
|---|---|---|
| 普通用户 | `demo` | `demo123456` |
| 管理员 | `admin` | `admin123456` |

### 4. 接口验收

后端启动后，在 `backend` 目录运行：

```powershell
.\.venv\Scripts\python.exe smoke_test.py
```

脚本会自动验收健康检查、登录、类目、商品、8 组搜索词、相关推荐、收藏、购物车、下单、支付、收货、取消、库存回滚、管理员重建索引与统计，共 45 项，并打印每组的模式、耗时与 Top3。

### 5. 浏览器端到端测试

后端和前端都启动后，另开终端运行：

```powershell
cd d:\dachuang\frontend
npm run e2e
```

脚本会复用本机 Edge/Chrome，真实走一遍「登录 → 加购 → 购物车 → 结算 → 支付 → 收货 → 订单列表」。可通过 `E2E_BROWSER` 环境变量指定浏览器路径。

---

## 🔍 语义检索说明

商品检索文档由名称、副标题、描述、类目、纹样标签、宠物类型、材质、工艺，以及人工维护的**领域别名**共同组成（如食盆类包含「狗碗 / 猫碗 / 饭盆 / 吃饭的碗 / 宠物餐具」）。

查询流程：

1. 文本归一化，检测类目词、宠物词、工艺词
2. BGE 模型编码查询，计算与全部商品的余弦相似度
3. 词法分 = 0.60 × 领域词覆盖率 + 0.25 × 中文二元组重合 + 0.15 × 商品名命中
4. 最终分 = 0.75 × 语义相似度 + 0.25 × 词法分 + 类目 / 宠物 / 精确命中加成
5. 先过滤低于绝对阈值的结果，再只保留与最高分相差 20% 以内的结果；语义不可用时自动走关键词兜底

向量索引持久化在 `backend/data/search/`，启动时校验内容哈希，商品内容变化后才重建。

---

## 📁 目录结构

```
dachuang/
├─ backend/
│  ├─ app/
│  │  ├─ main.py            # FastAPI 入口
│  │  ├─ config.py          # 配置
│  │  ├─ database.py        # 数据库
│  │  ├─ models.py          # 数据模型
│  │  ├─ schemas.py         # 请求/响应模型
│  │  ├─ auth.py            # 密码哈希与 JWT
│  │  ├─ seed.py            # 种子数据
│  │  ├─ routers/           # API 路由（认证/商品/搜索/收藏/购物车/订单/管理）
│  │  └─ services/          # 语义检索
│  ├─ data/                 # SQLite 与向量索引（自动生成）
│  ├─ smoke_test.py         # 45 项接口验收
│  └─ requirements.txt
├─ frontend/
│  ├─ src/
│  │  ├─ pages/             # 登录/首页/搜索/详情/收藏/购物车/结算/订单
│  │  ├─ context/           # 认证/收藏/购物车状态
│  │  └─ components/        # 共用组件
│  └─ e2e/shop.mjs          # 浏览器端到端购买流程
└─ README.md
```

---

## ⚠️ 注意事项

- `backend/.env` 中的 `SECRET_KEY` 与演示账号密码，部署到公网前必须修改。
- 答辩现场可提前下载模型后设置 `HF_HUB_OFFLINE=1`，实现完全离线演示。
- 订单支付与收货均为模拟操作，不接入真实支付渠道。
- 若不慎删除 `backend/data/`，重新运行 `python -m app.seed --reset` 即可恢复（会同时清空购物车与订单）。
