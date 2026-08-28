export default {
  async fetch(request) {
    if (request.method !== "GET") {
      return Response.json(
        { ok: false, message: "不支援的請求方法" },
        { status: 405, headers: { Allow: "GET" } },
      );
    }

    return Response.json({
      ok: true,
      service: "linebot",
      webhook: "/api/webhook",
    });
  },
};
