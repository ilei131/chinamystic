# TON Connect 配置

1. 在 Vercel 设置 `VITE_SITE_URL=https://你的正式域名`。
2. 设置 `VITE_TON_RECIPIENT=你的 TON 钱包地址`。
3. 修改 `apps/web/public/tonconnect-manifest.json` 中的 `url` 和 `iconUrl` 为正式 HTTPS 域名。
4. 部署后确认 `https://你的域名/tonconnect-manifest.json` 可以直接访问，且不会触发登录或 Cloudflare Challenge。
5. TON Connect 交易金额使用 nanoTON：1 TON = 1,000,000,000 nanoTON。

本项目只负责发起交易请求，不保存用户私钥。
