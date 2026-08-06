// Benny Study · Cloudflare Worker
// 作用：只代理 lingwangshu018/Benny-study 的 Release 附件下载。
// Token 不保存在 Worker；Benny Study 会在每次请求时临时发送。

const ALLOWED_ASSET = /^https:\/\/api\.github\.com\/repos\/lingwangshu018\/Benny-study\/releases\/assets\/\d+$/i;

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,OPTIONS",
    "Access-Control-Allow-Headers": "Authorization,Accept,X-GitHub-Api-Version,Content-Type",
    "Access-Control-Expose-Headers": "Content-Length,Content-Type,Content-Disposition",
    "Access-Control-Max-Age": "86400",
    "Cache-Control": "no-store"
  };
}

function textResponse(message, status) {
  return new Response(message, {
    status,
    headers: {
      ...corsHeaders(),
      "Content-Type": "text/plain; charset=utf-8"
    }
  });
}

function streamedResponse(response) {
  const headers = new Headers(corsHeaders());
  for (const name of ["content-type", "content-length", "content-disposition", "etag", "last-modified"]) {
    const value = response.headers.get(name);
    if (value) headers.set(name, value);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

export default {
  async fetch(request) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }
    if (request.method !== "GET") return textResponse("Only GET is allowed.", 405);

    const requestUrl = new URL(request.url);
    const target = requestUrl.searchParams.get("url") || "";
    if (!ALLOWED_ASSET.test(target)) return textResponse("Invalid or disallowed asset URL.", 400);

    const authorization = request.headers.get("Authorization") || "";
    if (!/^Bearer\s+\S+/i.test(authorization)) return textResponse("Missing GitHub authorization.", 401);

    const first = await fetch(target, {
      method: "GET",
      redirect: "manual",
      headers: {
        Accept: "application/octet-stream",
        Authorization: authorization,
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "Benny-Study-Video-Proxy"
      }
    });

    if ([301, 302, 303, 307, 308].includes(first.status)) {
      const location = first.headers.get("Location");
      if (!location) return textResponse("GitHub returned a redirect without a download location.", 502);
      const second = await fetch(location, { method: "GET", redirect: "follow" });
      return streamedResponse(second);
    }

    return streamedResponse(first);
  }
};
