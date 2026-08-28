import { createHmac, timingSafeEqual } from "node:crypto";

const LINE_REPLY_ENDPOINT = "https://api.line.me/v2/bot/message/reply";

export function validateSignature(rawBody, signature, channelSecret) {
  if (!rawBody || !signature || !channelSecret) {
    return false;
  }

  const expected = createHmac("sha256", channelSecret)
    .update(rawBody)
    .digest();
  const received = Buffer.from(signature, "base64");

  return (
    expected.length === received.length && timingSafeEqual(expected, received)
  );
}

export function getTextReplyRequests(events = []) {
  return events
    .filter(
      (event) =>
        event?.type === "message" &&
        event?.mode !== "standby" &&
        event?.message?.type === "text" &&
        typeof event?.message?.text === "string" &&
        typeof event?.replyToken === "string",
    )
    .map((event) => ({
      replyToken: event.replyToken,
      text: event.message.text,
    }));
}

export async function replyText(
  { replyToken, text },
  channelAccessToken,
  fetchImplementation = fetch,
) {
  const response = await fetchImplementation(LINE_REPLY_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${channelAccessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      replyToken,
      messages: [{ type: "text", text }],
    }),
  });

  if (!response.ok) {
    const details = (await response.text()).slice(0, 500);
    throw new Error(`LINE 回覆 API 失敗（${response.status}）：${details}`);
  }
}

