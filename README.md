# 基礎 LINE Bot

這是一個可部署於 Vercel 的基礎 LINE 回聲機器人。使用者傳送文字後，機器人會回覆相同內容。

## 功能

- 接收 LINE Messaging API webhook
- 使用 HMAC-SHA256 驗證 webhook 簽章
- 回覆文字訊息，略過圖片及其他非文字事件
- 提供健康檢查端點
- 包含 Node.js 內建測試，不需安裝程式相依套件

## 專案結構

```text
api/index.mjs       健康檢查
api/webhook.mjs     LINE webhook
lib/line.mjs        簽章驗證與回覆邏輯
test/line.test.mjs  單元測試
```

## 本機測試

需要 Node.js 20 或更新版本。

```bash
npm test
```

## LINE 設定

1. 在 [LINE Developers Console](https://developers.line.biz/console/) 建立或選擇 Messaging API channel。
2. 取得 Channel secret 與 Channel access token。這兩項都是機密資訊，不可提交到 Git。
3. 部署完成後，將 Webhook URL 設為：

   ```text
   https://你的-vercel-網域/api/webhook
   ```

4. 按下 **Verify**，確認回傳成功。
5. 開啟 **Use webhook**。如需 webhook redelivery，請閱讀 LINE 官方說明後再啟用。
6. 若 LINE Official Account Manager 仍啟用預設自動回應，請視需求關閉，避免同一訊息收到兩次回覆。

LINE 官方文件：

- [建立回覆機器人](https://developers.line.biz/en/docs/messaging-api/building-bot/)
- [接收 webhook](https://developers.line.biz/en/docs/messaging-api/receiving-messages/)
- [驗證 Webhook URL](https://developers.line.biz/en/docs/messaging-api/verify-webhook-url/)

## Vercel 部署

登入 Vercel CLI 後，在專案根目錄執行：

```bash
vercel
vercel env add LINE_CHANNEL_SECRET production
vercel env add LINE_CHANNEL_ACCESS_TOKEN production
vercel --prod
```

環境變數新增後需要重新部署，新的 deployment 才會讀取新值。也可以在 Vercel 專案的 Settings → Environment Variables 設定這兩項變數。

## API

| 方法 | 路徑 | 用途 |
|---|---|---|
| `GET` | `/api` | 確認服務可存取 |
| `GET` | `/api/webhook` | 確認 webhook Function 可存取 |
| `POST` | `/api/webhook` | 接收並處理 LINE webhook |

## 安全與使用限制

- 程式只在記憶體中處理訊息，不主動寫入資料庫。
- webhook 一律先驗證 `x-line-signature`，驗證失敗會回傳 HTTP 401。
- `.env`、`.env.local` 與 Vercel 專案設定不會納入 Git。
- 不要把 Channel secret、Channel access token 或其他憑證貼到 issue、commit、聊天內容或公開畫面。
- 此專案是教學用基礎範例，尚未實作持久化、重複事件防護、流量限制、監控或告警。
- 若用於健康照護或研究情境，不應透過此基礎版本傳送可識別個人資料或敏感健康資訊。正式使用前需依最新法規與機構規範完成隱私、安全及研究倫理評估。
