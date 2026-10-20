/**
 * 真实浏览器端到端测试：登录 → 商品详情 → 购物车 → 结算 → 支付 → 收货。
 *
 * 前置条件：
 *   1. 后端运行在 http://127.0.0.1:8000
 *   2. 前端运行在 http://localhost:5173
 *   3. 已安装 Edge 或 Chrome（playwright-core 直接复用系统浏览器）
 *
 * 运行：
 *   npm run e2e
 */

import fs from 'node:fs'
import { chromium } from 'playwright-core'

const BASE = process.env.E2E_BASE_URL || 'http://localhost:5173'
const CANDIDATES = [
  process.env.E2E_BROWSER,
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
].filter(Boolean)

const executablePath = CANDIDATES.find((candidate) => fs.existsSync(candidate))
if (!executablePath) {
  console.error('[e2e] 未找到 Edge/Chrome，请通过 E2E_BROWSER 指定浏览器路径')
  process.exit(1)
}

const pageErrors = []

function log(message) {
  console.log(`[e2e] ${message}`)
}

const browser = await chromium.launch({ headless: true, executablePath })
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })

page.on('pageerror', (error) => pageErrors.push(String(error)))

try {
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' })
  await page.fill('input[autocomplete="username"]', 'demo')
  await page.fill('input[autocomplete="current-password"]', 'demo123456')
  await page.getByRole('button', { name: '登录', exact: true }).click()
  await page.waitForURL(`${BASE}/`, { timeout: 15000 })
  log('登录成功')

  await page.evaluate(async () => {
    const token = localStorage.getItem('zgtc_token')
    if (token) {
      await fetch('/api/cart', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
    }
  })

  await page.goto(`${BASE}/product/1`, { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: '加入购物车' }).waitFor()
  await page.getByRole('button', { name: '增加数量' }).click()
  await page.getByRole('button', { name: '加入购物车' }).click()
  await page.getByText('已加入购物车').waitFor()
  log('加入购物车成功')

  await page.getByRole('link', { name: /去购物车结算/ }).click()
  await page.waitForURL(`${BASE}/cart`)
  await page.getByRole('heading', { name: '购物车' }).waitFor()
  log('购物车页面正常')

  await page.getByRole('button', { name: '去结算' }).click()
  await page.waitForURL(/\/checkout/)
  await page.getByRole('heading', { name: '确认订单' }).waitFor()
  log('进入结算页')

  await page.getByPlaceholder('请输入手机号').fill('13800138000')
  await page
    .getByPlaceholder('省 / 市 / 区县 / 详细地址')
    .fill('山东省济宁市泗水县柘沟镇演示路 1 号')
  await page.getByRole('button', { name: '提交订单' }).click()
  await page.waitForURL(/\/orders\/\d+/, { timeout: 20000 })
  await page.getByText('下单成功').waitFor()
  log('订单创建成功')

  await page.getByRole('button', { name: '模拟支付' }).click()

  const letter = page.getByRole('dialog', { name: /致我亲爱的毛孩子/ })
  await letter.waitFor()
  await page.getByRole('button', { name: '收好这封信' }).click()
  await letter.waitFor({ state: 'detached' })
  log('支付后「致毛孩子」信卡出现并关闭')

  await page.getByText('待收货', { exact: true }).first().waitFor()
  log('模拟支付成功')

  await page.getByRole('button', { name: '确认收货' }).click()
  await page.getByText('已完成', { exact: true }).first().waitFor()
  log('确认收货成功')

  await page.goto(`${BASE}/cart`, { waitUntil: 'networkidle' })
  await page.getByText('购物车还是空的').waitFor()
  log('结算后购物车已清空')

  await page.goto(`${BASE}/orders`, { waitUntil: 'networkidle' })
  await page.getByRole('heading', { name: '我的订单' }).waitFor()
  await page.getByText('已完成', { exact: true }).first().waitFor()
  log('订单列表正常')

  if (pageErrors.length > 0) {
    throw new Error(`页面运行时报错：${pageErrors.join(' | ')}`)
  }

  log('全部通过')
} catch (error) {
  console.error('[e2e] 失败：', error)
  await fs.promises.mkdir('e2e', { recursive: true }).catch(() => {})
  await page.screenshot({ path: 'e2e/failure.png', fullPage: true }).catch(() => {})
  process.exitCode = 1
} finally {
  await browser.close()
}
