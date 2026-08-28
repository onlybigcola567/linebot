import assert from "node:assert/strict";
import test from "node:test";

import {
  generateNursingReply,
  NURSING_POSTDOC_INSTRUCTIONS,
  OPENAI_MODEL,
} from "../lib/openai.mjs";

test("使用固定的 gpt-5.6-luna 與護理博士後提示詞", async () => {
  let request;
  const client = {
    responses: {
      create: async (payload) => {
        request = payload;
        return { output_text: "這是測試回覆。" };
      },
    },
  };

  const answer = await generateNursingReply("我最近睡不好，怎麼辦？", {
    apiKey: "test-key",
    client,
  });

  assert.equal(answer, "這是測試回覆。");
  assert.equal(request.model, OPENAI_MODEL);
  assert.equal(request.model, "gpt-5.6-luna");
  assert.equal(request.store, false);
  assert.equal(request.reasoning.effort, "low");
  assert.equal(request.instructions, NURSING_POSTDOC_INSTRUCTIONS);
  assert.equal(request.input, "我最近睡不好，怎麼辦？");
});

test("沒有 API key 且沒有注入 client 時會拒絕請求", async () => {
  await assert.rejects(
    () => generateNursingReply("測試", { apiKey: "" }),
    /缺少 OPENAI_API_KEY/,
  );
});

