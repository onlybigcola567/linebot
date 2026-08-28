import {
  getTextReplyRequests,
  replyText,
  validateSignature,
} from "../lib/line.mjs";
import { generateNursingReply } from "../lib/openai.mjs";

export default {
  async fetch(request) {
    if (request.method === "GET") {
      return Response.json({ ok: true, message: "LINE webhook 運作中" });
    }

    if (request.method !== "POST") {
      return Response.json(
        { ok: false, message: "不支援的請求方法" },
        { status: 405, headers: { Allow: "GET, POST" } },
      );
    }

    const channelSecret = process.env.LINE_CHANNEL_SECRET;
    const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;

    if (!channelSecret) {
      console.error("缺少 LINE_CHANNEL_SECRET 環境變數");
      return Response.json(
        { ok: false, message: "伺服器尚未完成設定" },
        { status: 500 },
      );
    }

    const rawBody = await request.text();
    const signature = request.headers.get("x-line-signature");

    if (!validateSignature(rawBody, signature, channelSecret)) {
      return Response.json(
        { ok: false, message: "簽章驗證失敗" },
        { status: 401 },
      );
    }

    let payload;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return Response.json(
        { ok: false, message: "JSON 格式錯誤" },
        { status: 400 },
      );
    }

    const replies = getTextReplyRequests(payload.events);

    if (replies.length === 0) {
      return Response.json({ ok: true, handled: 0 });
    }

    if (!channelAccessToken || !process.env.OPENAI_API_KEY) {
      console.error("缺少 LINE_CHANNEL_ACCESS_TOKEN 或 OPENAI_API_KEY 環境變數");
      return Response.json(
        { ok: false, message: "伺服器尚未完成設定" },
        { status: 500 },
      );
    }

    try {
      await Promise.all(
        replies.map(async (reply) => {
          const answer = await generateNursingReply(reply.text);
          await replyText(
            { replyToken: reply.replyToken, text: answer },
            channelAccessToken,
          );
        }),
      );
      return Response.json({ ok: true, handled: replies.length });
    } catch (error) {
      console.error(error);
      return Response.json(
        { ok: false, message: "訊息回覆失敗" },
        { status: 502 },
      );
    }
  },
};
