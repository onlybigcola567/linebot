import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";

import {
  getTextReplyRequests,
  replyText,
  validateSignature,
} from "../lib/line.mjs";

test("接受正確的 LINE webhook 簽章", () => {
  const body = JSON.stringify({ events: [] });
  const secret = "test-channel-secret";
  const signature = createHmac("sha256", secret)
    .update(body)
    .digest("base64");

  assert.equal(validateSignature(body, signature, secret), true);
});

test("拒絕錯誤的 LINE webhook 簽章", () => {
  assert.equal(validateSignature("{}", "invalid-signature", "secret"), false);
});

test("只建立 active 模式的文字訊息回覆", () => {
  const replies = getTextReplyRequests([
    {
      type: "message",
      mode: "active",
      replyToken: "reply-token-1",
      message: { type: "text", text: "你好" },
    },
    {
      type: "message",
      mode: "active",
      replyToken: "reply-token-2",
      message: { type: "image", id: "image-id" },
    },
    {
      type: "message",
      mode: "standby",
      replyToken: "reply-token-3",
      message: { type: "text", text: "不應回覆" },
    },
  ]);

  assert.deepEqual(replies, [
    { replyToken: "reply-token-1", text: "你好" },
  ]);
});

test("以正確格式呼叫 LINE 回覆 API", async () => {
  let capturedRequest;
  const fakeFetch = async (url, options) => {
    capturedRequest = { url, options };
    return new Response(null, { status: 200 });
  };

  await replyText(
    { replyToken: "reply-token", text: "測試訊息" },
    "access-token",
    fakeFetch,
  );

  assert.equal(
    capturedRequest.url,
    "https://api.line.me/v2/bot/message/reply",
  );
  assert.equal(capturedRequest.options.method, "POST");
  assert.equal(
    capturedRequest.options.headers.Authorization,
    "Bearer access-token",
  );
  assert.deepEqual(JSON.parse(capturedRequest.options.body), {
    replyToken: "reply-token",
    messages: [{ type: "text", text: "測試訊息" }],
  });
});
