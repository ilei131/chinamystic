# ChinaMystic TMA

> Traditional Chinese Divination × Modern AI

ChinaMystic TMA is a serverless Meihua Yishu (梅花易数) divination app designed for Vercel + Cloudflare Workers + D1 + Gemini/OpenRouter + Telegram.

## Divination rules

### Standard / Time mode

This project uses a clearly documented conventional time-based Meihua Yishu rule:

1. Convert the local solar time to Chinese lunar year/month/day.
2. Use the year's Earthly Branch sequence number (子=1, 丑=2, …, 亥=12).
3. Upper trigram = `(yearBranchNo + lunarMonth + lunarDay) mod 8`, with remainder 0 mapped to 8.
4. Lower trigram = `(yearBranchNo + lunarMonth + lunarDay + hourBranchNo) mod 8`, with remainder 0 mapped to 8.
5. Moving line = `(yearBranchNo + lunarMonth + lunarDay + hourBranchNo) mod 6`, with remainder 0 mapped to 6.
6. The moving line is counted from bottom to top: 1 = 初爻 … 6 = 上爻.
7. If the moving line is in the lower trigram, upper is 体 and lower is 用. If it is in the upper trigram, lower is 体 and upper is 用.
8. The changed hexagram is obtained by flipping the moving line.

This is an implementation convention, not a claim that there is one universally authoritative historical formula. The UI explicitly labels it as the project's rule.

### Mystic / Entropy mode

The modern mode derives three deterministic values from SHA-256 of:

`serverSecret + anonymousCookieId + hashedIP + timestampBucket + question`

It maps the digest to upper trigram, lower trigram and moving line. AI never creates or changes the hexagram.

## Architecture

- `apps/web`: React + Vite frontend, deployable to Vercel.
- `apps/worker`: Cloudflare Worker API, D1, AI providers and Telegram webhook.
- `packages/divination-core`: provider-independent hexagram and Meihua logic.
- `lunar-typescript`: lunar calendar conversion; MIT licensed, zero runtime dependencies. See npm package: https://www.npmjs.com/package/lunar-typescript

Cloudflare currently documents Wrangler + D1 bindings through `wrangler.jsonc`; D1 databases are created with `wrangler d1 create`. See Cloudflare's current docs.

## Local setup

```bash
npm install

# frontend
npm run dev:web

# worker
npm run dev:worker
```

Copy `apps/worker/.dev.vars.example` to `apps/worker/.dev.vars`.

## Create D1

```bash
cd apps/worker
npx wrangler d1 create china-mystic-tma
```

Put the returned database ID into `wrangler.jsonc`, then:

```bash
npx wrangler d1 migrations apply china-mystic-tma --local
npx wrangler d1 migrations apply china-mystic-tma --remote
```

## AI configuration

Set one or both:

- `GEMINI_API_KEY`
- `OPENROUTER_API_KEY`

The Worker prefers Gemini and falls back to OpenRouter when configured. If both are unavailable, the API still returns the deterministic divination result without an AI interpretation.

## Frontend configuration

Set `VITE_API_BASE_URL` to your Worker URL, for example:

```text
https://china-mystic-tma-api.<your-subdomain>.workers.dev
```

## Telegram

Set Worker secrets:

```bash
npx wrangler secret put TELEGRAM_BOT_TOKEN
npx wrangler secret put TELEGRAM_WEBHOOK_SECRET
```

Then call Telegram `setWebhook` with:

```text
https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://<WORKER>/telegram/webhook&secret_token=<SECRET>
```

## Safety / privacy

- IP addresses are never stored raw; the Worker hashes the IP with a server secret.
- The anonymous cookie is not an authentication credential.
- Do not store sensitive personal information in the question field.
- Divination is presented as cultural/entertainment interpretation, not factual prediction or professional advice.

## 第二阶段：轻量 D1 与经典资料

D1 不保存用户历史，也不保存问题、IP、Cookie、seed、AI 回复或完整卦辞。唯一表为 `daily_stats`，每天最多一行，用于匿名统计起卦次数和 AI 成功/失败次数。

经典资料属于静态应用数据，不进入 D1。项目自带 64 卦核心卦辞；运行：

```bash
npm run sync:zhouyi
```

会生成 `apps/worker/src/data/classical.generated.ts`，把 64 卦的卦辞、六爻爻辞等资料随 Worker 一起打包。这样数据库容量与用户占卜次数无关。

> 注意：同步脚本使用公开 GitHub 数据集作为机器可读转录来源。正式商业化前建议锁定一个你认可的古籍底本并自行校对，尤其是异体字、标点和版本差异。

## D1 迁移

如果之前已经执行过 `0001_init.sql`，执行：

```bash
npx wrangler d1 migrations apply china-mystic-tma --remote
```

`0002_minimal_daily_stats.sql` 会删除旧的 `users` / `divinations` 表并建立唯一的 `daily_stats` 表。

## 第三阶段：程序化梅花易数分析

Stage 3 保持 Stage 2 的隐私策略不变，并新增程序化分析字段：

- 互卦：二、三、四爻为下卦，三、四、五爻为上卦。
- 错卦：六爻阴阳全部反转。
- 综卦：六爻上下倒置。
- 体用五行：程序根据八卦五行自动计算。
- 体用关系：比和、体生用、用生体、体克用、用克体。

这些内容由 `packages/divination-core` 计算，Gemini/OpenRouter **不能重新推导、修改或重新起卦**。AI 只负责把程序已经确定的卦象、体用和经典资料转化为自然语言解读。

前端结果页也会展示互卦、错卦、综卦和体用关系，方便用户理解解卦依据。

### Stage 3 验证

推荐在 Node 20+ 环境执行：

```bash
npm install
npm run test:core
npm run build:web
npm run build:worker
```

如果 npm 网络安装失败，先配置可用的 npm registry 后重新执行；本项目本身不依赖付费运行时服务。

## 隐私原则

Worker 使用 Cookie/IP/时间/问题参与“灵机起卦”的 seed，但这些值不会写入 D1。IP 只在内存中参与 SHA-256 计算，Cookie 仅作为匿名随机种子，不作为用户账户。D1 最多保留每天一行的匿名系统统计。

## Stage 4：自愿支持 / 打赏

Stage 4 在不增加用户历史和支付订单 D1 表的前提下加入：

- 解卦结果页的「☕ 请我喝杯咖啡」入口
- Ko-fi 支持
- TON Connect：0.1 / 0.5 / 1 TON + 自定义金额
- Telegram Stars：50 / 150 / 300 Stars + `/support 数量`
- Telegram `/terms` 与 `/paysupport`

详细部署、Vercel、Cloudflare Worker/D1、Ko-fi、TON Connect、Telegram Webhook 和 Stars 配置步骤见：

**`DEPLOYMENT.md`**
