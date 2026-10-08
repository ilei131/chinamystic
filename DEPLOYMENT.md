# ChinaMystic TMA Stage 4 部署文档

> 目标：Vercel 托管 React 前端 + Cloudflare Workers API + Cloudflare D1 最小统计 + Gemini/OpenRouter AI + Telegram Bot + Ko-fi + TON Connect + Telegram Stars。

## 1. Stage 4 做了什么

本版本只增加前 5 项收入能力，不增加“深度解卦”和“继续追问”，也不做免费/付费 AI Provider 分流：

1. 解卦结果之后才显示「☕ 请我喝杯咖啡」入口。
2. 打赏弹窗提供 Ko-fi 与 TON 两种方式。
3. Ko-fi：跳转你的 Ko-fi 页面，由用户自行选择金额。
4. TON：使用 TON Connect，从用户自己的 TON 钱包直接向你的 TON 收款地址发送 TON；默认 0.1 / 0.5 / 1 TON，也可自定义金额。
5. Telegram：Bot 内提供 50 / 150 / 300 Stars，并支持 `/support 数量` 自定义 Stars 数量。

Telegram 内销售/提供数字商品或数字服务时，应使用 Telegram Stars（货币代码 XTR），而不是直接在 Telegram Mini App/Bot 内收 TON。Telegram 官方文档明确要求数字商品和数字服务使用 Stars。支付流程为 `sendInvoice → pre_checkout_query → successful_payment`。详见官方文档：

- https://core.telegram.org/bots/payments-stars

TON Connect 用于网站上的钱包连接和链上转账。官方要求 `tonconnect-manifest.json` 可通过 HTTPS、无鉴权直接 GET 访问。详见：

- https://docs.ton.org/applications/ton-connect/get-started

Ko-fi Free 模式下，一次性 tips 的 Ko-fi 服务费可以为 0%；PayPal/Stripe 自身的处理费仍可能产生。详见：

- https://help.ko-fi.com/hc/en-us/articles/360002506494-Does-Ko-fi-take-a-fee

---

## 2. 目录结构

```text
china-mystic-tma/
├─ apps/
│  ├─ web/                  # Vercel / React + Vite
│  │  ├─ public/
│  │  │  ├─ tonconnect-manifest.json
│  │  │  ├─ icon-180.png
│  │  │  ├─ terms.html
│  │  │  └─ privacy.html
│  │  ├─ scripts/write-ton-manifest.mjs
│  │  └─ src/App.tsx
│  └─ worker/               # Cloudflare Worker
│     ├─ src/index.ts
│     ├─ src/telegram/webhook.ts
│     └─ migrations/
├─ packages/divination-core/
├─ package.json
└─ DEPLOYMENT.md
```

---

## 3. 前置准备

建议使用：

- Node.js 20+
- npm 10+
- GitHub
- Vercel 账号
- Cloudflare 账号
- 一个 Telegram Bot
- 一个 TON 主网钱包
- 一个 Ko-fi 页面
- Gemini API Key 和/或 OpenRouter API Key

本项目不要求为用户建立账号，也不会把用户问题、IP、Cookie、seed、AI 完整回复写入 D1。

---

## 4. 本地安装

在项目根目录：

```bash
npm install
```

如果 npm 网络较慢，可先设置你自己的 npm registry，然后重新执行：

```bash
npm install
```

复制 Worker 本地变量：

```bash
cp apps/worker/.dev.vars.example apps/worker/.dev.vars
```

复制 Web 环境变量：

```bash
cp apps/web/.env.example apps/web/.env
```

编辑 `apps/web/.env`：

```env
VITE_API_BASE_URL=https://YOUR-WORKER.workers.dev
VITE_SITE_URL=https://YOUR-DOMAIN.com
VITE_KOFI_URL=https://ko-fi.com/YOUR_KOFI_NAME
VITE_TON_RECIPIENT=UQxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

注意：`VITE_*` 会被打进前端 JS，因此这里只能放公开配置。**不要把 Gemini、OpenRouter、Telegram Bot Token 或 SERVER_SECRET 放到 Vercel 前端变量中。**

---

## 5. 创建 Cloudflare D1

进入 Worker 目录：

```bash
cd apps/worker
npx wrangler login
```

创建数据库：

```bash
npx wrangler d1 create china-mystic-tma
```

命令会返回类似：

```text
database_name = "china-mystic-tma"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

把 `database_id` 填入：

```text
apps/worker/wrangler.jsonc
```

例如：

```jsonc
"d1_databases": [
  {
    "binding": "DB",
    "database_name": "china-mystic-tma",
    "database_id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    "migrations_dir": "migrations"
  }
]
```

然后执行本地迁移：

```bash
npx wrangler d1 migrations apply china-mystic-tma --local
```

部署前执行远程迁移：

```bash
npx wrangler d1 migrations apply china-mystic-tma --remote
```

Stage 4 不新增支付订单表。D1 仍然只有最小的 `daily_stats` 统计，不保存用户支付记录、钱包地址、问题或占卜历史。

---

## 6. 配置 Worker Secrets

进入：

```bash
cd apps/worker
```

### 6.1 SERVER_SECRET

生成随机密钥：

```bash
openssl rand -hex 32
```

设置：

```bash
npx wrangler secret put SERVER_SECRET
```

粘贴刚才生成的随机值。

### 6.2 Gemini

如果使用 Gemini：

```bash
npx wrangler secret put GEMINI_API_KEY
```

`GEMINI_MODEL` 在 `wrangler.jsonc` 中配置。

### 6.3 OpenRouter

如果使用 OpenRouter：

```bash
npx wrangler secret put OPENROUTER_API_KEY
```

默认模型是：

```text
openrouter/free
```

Stage 4 不根据用户是否付费来切换 AI Provider。AI 逻辑保持原 Stage 3：Gemini 优先，OpenRouter 作为备用；两者都不可用时仍返回程序计算出的卦象。

### 6.4 Telegram

创建 Bot 后设置：

```bash
npx wrangler secret put TELEGRAM_BOT_TOKEN
npx wrangler secret put TELEGRAM_WEBHOOK_SECRET
```

Webhook secret 可以使用：

```bash
openssl rand -hex 24
```

---

## 7. 部署 Worker

在 `apps/worker`：

```bash
npx wrangler deploy
```

成功后会得到类似：

```text
https://china-mystic-tma-api.your-subdomain.workers.dev
```

检查：

```text
https://china-mystic-tma-api.your-subdomain.workers.dev/health
```

应该返回类似：

```json
{
  "ok": true,
  "service": "china-mystic-tma-api"
}
```

把这个 Worker 地址填到 Vercel 的：

```text
VITE_API_BASE_URL
```

---

## 8. 配置 Ko-fi

进入 Ko-fi，创建自己的页面并连接 PayPal 或 Stripe。

然后得到类似：

```text
https://ko-fi.com/YOUR_NAME
```

在 Vercel 环境变量中配置：

```text
VITE_KOFI_URL=https://ko-fi.com/YOUR_NAME
```

项目不会在自己的 D1 中记录 Ko-fi 支付。

推荐 Ko-fi 页面只作为“自愿支持”入口，而不要把打赏按钮放到首页最顶部。Stage 4 已经把入口放在用户看到完整解卦之后。

---

## 9. 配置 TON 钱包

准备一个用于收款的 TON 主网地址，例如：

```text
UQxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

在 Vercel 中配置：

```text
VITE_TON_RECIPIENT=你的 TON 主网收款地址
```

不要把助记词、私钥、钱包密码等任何秘密放进项目。

### TON Connect Manifest

项目已经包含：

```text
apps/web/public/tonconnect-manifest.json
```

生产构建时，如果设置了：

```text
VITE_SITE_URL=https://your-domain.com
```

构建脚本会自动生成正确的：

```json
{
  "url": "https://your-domain.com",
  "name": "ChinaMystic TMA",
  "iconUrl": "https://your-domain.com/icon-180.png",
  "termsOfUseUrl": "https://your-domain.com/terms.html",
  "privacyPolicyUrl": "https://your-domain.com/privacy.html"
}
```

部署后直接检查：

```text
https://your-domain.com/tonconnect-manifest.json
```

必须能在浏览器直接打开 JSON，不能需要登录，也不能被 Cloudflare Challenge 拦截。

### TON 金额

前端默认：

```text
0.1 TON
0.5 TON
1 TON
```

也支持输入自定义金额。

TON Connect 的交易金额使用 nanogram：

```text
1 TON = 1,000,000,000 nanogram
```

代码已经自动完成换算。

**重要：** TON Connect 是网站的钱包连接/链上交互方式。用户在自己的钱包里确认交易，项目永远拿不到用户私钥。

---

## 10. 部署 Vercel

推荐把整个项目仓库连接到 Vercel，而不是只上传 `apps/web`。

Vercel 项目设置：

### Root Directory

```text
.
```

### Build Command

```bash
npm run build:web
```

### Output Directory

```text
dist
```

### Install Command

```bash
npm install
```

### Vercel Environment Variables

至少设置：

```text
VITE_API_BASE_URL=https://你的-worker.workers.dev
VITE_SITE_URL=https://你的正式域名
VITE_KOFI_URL=https://ko-fi.com/你的名称
VITE_TON_RECIPIENT=你的TON收款地址
```

建议分别给：

```text
Production
Preview
Development
```

配置不同的值。

生产环境必须使用真实域名作为 `VITE_SITE_URL`，这样 TON Connect Manifest 才会自动生成正确的 URL。

---

## 11. Telegram Bot Webhook

假设：

```text
BOT_TOKEN=123456:ABC...
WORKER=https://china-mystic-tma-api.your-subdomain.workers.dev
WEBHOOK_SECRET=你的随机secret
```

执行：

```bash
curl -sS -X POST "https://api.telegram.org/bot${BOT_TOKEN}/setWebhook" \
  -d "url=${WORKER}/telegram/webhook" \
  -d "secret_token=${WEBHOOK_SECRET}"
```

检查：

```bash
curl -sS "https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo"
```

重点检查：

```text
url
pending_update_count
last_error_message
```

如果 `url` 正确，Telegram 就会把消息发送给 Worker。

---

## 12. Telegram Stars 打赏

用户在 Bot 里发送：

```text
/support
```

Bot 会显示：

```text
⭐ 50
⭐ 150
⭐ 300
```

点击后 Bot 使用：

```text
sendInvoice
currency = XTR
provider_token = ""
```

处理流程：

```text
用户点击 Stars
      ↓
Telegram Invoice
      ↓
pre_checkout_query
      ↓
answerPreCheckoutQuery
      ↓
successful_payment
      ↓
Bot 回复感谢信息
```

自定义金额：

```text
/support 100
```

表示支持 100 Stars。

当前实现允许：

```text
1 - 10000 Stars
```

### 为什么不是直接转 TON？

因为这是 Telegram Bot 内的数字商品/数字服务支付场景。Telegram 官方文档明确规定这类交易使用 Telegram Stars，货币代码为 `XTR`；不能在 Bot/Mini App 内用加密货币替代 Stars。

因此：

```text
网站：TON Connect
Telegram：Telegram Stars
```

是本项目 Stage 4 的设计。

Telegram Stars 后续可以按 Telegram 当前规则进行提现/兑换，具体以 Telegram/Fragment 当时的规则为准。

---

## 13. Telegram 必测命令

### /start

应该返回：

```text
🔮 ChinaMystic TMA
发送 /divine 你的问题 开始梅花易数起卦。
发送 /support 可以自愿支持项目。
```

### /divine

例如：

```text
/divine 我今年适合换工作吗？
```

### /support

应该出现 50 / 150 / 300 Stars。

### 自定义

```text
/support 88
```

### /terms

应该返回支付和文化解读相关条款。

### /paysupport

应该返回支付问题处理说明。

`/paysupport` 是 Telegram 数字商品支付场景需要提供的支付支持入口。

---

## 14. 本地开发

### Worker

```bash
cd apps/worker
npx wrangler dev
```

### Web

另开一个终端：

```bash
npm run dev:web
```

然后访问 Vite 给出的地址。

本地 TON Connect 需要注意：钱包连接最终要求 HTTPS 环境更可靠。正式测试建议先部署一个 Vercel Preview URL，再用 Preview 域名测试 TON Connect。

---

## 15. 构建检查

根目录执行：

```bash
npm run test:core
npm run build:web
npm run build:worker
```

完整安装后还可以执行：

```bash
npm install
```

如果 `npm install` 因网络超时失败，不代表代码本身有问题；先解决 npm registry / 网络问题，再重新执行构建。

---

## 16. GitHub + Vercel + Cloudflare 推荐部署顺序

建议严格按这个顺序：

```text
1. GitHub 建仓库
        ↓
2. 推送 Stage 4 代码
        ↓
3. Cloudflare 登录
        ↓
4. 创建 D1
        ↓
5. 配置 D1 database_id
        ↓
6. 设置 Worker Secrets
        ↓
7. 部署 Worker
        ↓
8. 检查 /health
        ↓
9. 创建/配置 Ko-fi
        ↓
10. 准备 TON 收款地址
        ↓
11. 创建 Vercel 项目
        ↓
12. 设置 VITE_* 环境变量
        ↓
13. 部署 Vercel
        ↓
14. 检查 tonconnect-manifest.json
        ↓
15. 设置 Telegram Webhook
        ↓
16. 测试网页起卦
        ↓
17. 测试 Ko-fi
        ↓
18. 测试 TON 小额主网交易
        ↓
19. 测试 Telegram /support
```

---

## 17. 正式上线前检查清单

### 网站

- [ ] 首页可以正常打开
- [ ] 输入问题可以起卦
- [ ] 传统时间起卦正常
- [ ] 灵机起卦正常
- [ ] AI 正常返回
- [ ] AI 不可用时仍有卦象结果
- [ ] 结果页才出现打赏按钮
- [ ] Ko-fi 按钮正常
- [ ] TON 钱包可以连接
- [ ] 0.1 TON 测试交易正常
- [ ] 自定义 TON 金额正常
- [ ] `tonconnect-manifest.json` 可以公开访问
- [ ] terms/privacy 可以访问

### Telegram

- [ ] /start 正常
- [ ] /divine 正常
- [ ] /support 正常
- [ ] 50 Stars invoice 正常
- [ ] 150 Stars invoice 正常
- [ ] 300 Stars invoice 正常
- [ ] /support 88 正常
- [ ] pre_checkout_query 正常
- [ ] successful_payment 正常
- [ ] /terms 正常
- [ ] /paysupport 正常
- [ ] webhook 没有错误

### 隐私

- [ ] D1 没有 users/divinations 用户历史表
- [ ] 不保存用户问题
- [ ] 不保存原始 IP
- [ ] 不保存 Cookie
- [ ] 不保存 seed
- [ ] 不保存钱包地址
- [ ] 不保存 Telegram 用户历史
- [ ] 不保存 AI 完整回复

---

## 18. 支付安全注意事项

### TON

永远不要把：

```text
助记词
私钥
钱包密码
```

放进：

```text
GitHub
Vercel 环境变量
Cloudflare Worker 普通 vars
前端代码
```

本项目只需要公开的 TON 收款地址。

### Telegram

以下内容必须只存在 Cloudflare Worker Secret：

```text
TELEGRAM_BOT_TOKEN
TELEGRAM_WEBHOOK_SECRET
```

不要提交到 GitHub。

### Gemini / OpenRouter

API Key 也只能放 Worker Secret，不要放 `VITE_*`。

---

## 19. Stage 4 的收入链路

最终用户体验是：

```text
输入问题
  ↓
免费起卦
  ↓
AI 解卦
  ↓
用户获得完整结果
  ↓
如果觉得有帮助
  ↓
┌─────────────────────────┐
│ ☕ 请我喝杯咖啡          │
│                         │
│ Ko-fi                   │
│ TON 0.1 / 0.5 / 1 / 自定义 │
└─────────────────────────┘
```

Telegram：

```text
/divine 问题
    ↓
免费结果
    ↓
/support
    ↓
⭐ 50 / 150 / 300
    ↓
或 /support 88
```

这个版本没有强制注册、没有强制付款、没有付费墙，也没有在首页用大面积支付按钮打断用户。

---

## 20. 为什么 Stage 4 不增加支付数据库

你的产品定位是“免费起卦 + AI 解读 + 自愿支持”。因此当前阶段没有必要为了统计收入而建立自己的支付订单系统。

支付发生在：

```text
Ko-fi → Ko-fi / PayPal / Stripe
TON → TON 区块链
Telegram → Telegram Stars
```

ChinaMystic 自己只负责提供入口。

这样做的好处：

- D1 几乎不会随着用户量增长
- 不保存用户支付敏感信息
- 不需要自己处理银行卡数据
- 不需要自己保存 TON 钱包私钥
- 不需要实现复杂的支付回调订单系统
- 项目维护成本低

如果未来要做真正的付费数字产品，再单独设计订单系统即可，不需要现在提前加入。

---

## 21. 常见问题

### Q1：TON Connect 是否需要后端？

当前“自愿打赏”不需要。用户钱包直接向你的收款地址发送交易。

### Q2：网站需要保存打赏记录吗？

不需要。当前 Stage 4 设计就是无支付订单数据库。

### Q3：Telegram Stars 是否直接进入我的 TON 钱包？

不是实时直接转到 TON 钱包。Stars 是 Telegram 的支付体系，后续按 Telegram 当前规则处理余额和提现。不要把 UI 文案写成“直接支付到 TON 钱包”。

### Q4：能不能在 Telegram 里让用户直接支付 TON？

本项目不这么做。对于 Bot/Mini App 内数字商品/服务，使用 Telegram Stars。

### Q5：Ko-fi 是否必须显示二维码？

不需要。手机用户直接点击 Ko-fi 更自然；桌面端以后如果有需要，可以另外增加二维码，但 Stage 4 没有强制加入二维码。

### Q6：为什么没有把打赏按钮放首页？

因为首页第一目标是完成一次有效起卦。只有用户看到完整结果以后，才更容易产生“感谢/支持”的自然动机。

---

## 22. Stage 4 验收结论

Stage 4 的目标不是建立一个复杂的商业支付平台，而是用最低工程成本验证：

```text
免费产品体验
       ↓
用户认可
       ↓
自愿支持
       ↓
Ko-fi / TON / Telegram Stars
```

如果后续数据显示大量用户愿意支持，再考虑正式支付产品、会员、内容社区等更复杂的商业化能力。
