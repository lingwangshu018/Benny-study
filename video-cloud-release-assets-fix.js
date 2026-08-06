// Benny Study · GitHub Release 附件读取兼容补丁
(function () {
  const nativeFetch = window.fetch.bind(window);
  const RELEASE_LIST_RE = /^https:\/\/api\.github\.com\/repos\/([^/]+)\/([^/]+)\/releases(?:\?|$)/i;

  window.fetch = async function patchedFetch(input, init) {
    const response = await nativeFetch(input, init);
    try {
      const url = typeof input === "string" ? input : input?.url || String(input || "");
      const match = url.match(RELEASE_LIST_RE);
      if (!match || !response.ok || /\/releases\/\d+\/assets(?:\?|$)/i.test(url)) return response;

      const releases = await response.clone().json();
      if (!Array.isArray(releases)) return response;

      const target = releases.find(item => item && (item.tag_name === "study-videos" || item.name === "Benny Study 私人视频仓"));
      if (!target?.id) return response;

      const headers = init?.headers || (typeof Request !== "undefined" && input instanceof Request ? input.headers : undefined);
      const assetUrl = `https://api.github.com/repos/${match[1]}/${match[2]}/releases/${target.id}/assets?per_page=100`;
      const assetResponse = await nativeFetch(assetUrl, { method: "GET", headers });
      if (!assetResponse.ok) return response;

      const assets = await assetResponse.json();
      if (!Array.isArray(assets)) return response;

      const patched = releases.map(item => item?.id === target.id ? { ...item, assets } : item);
      const responseHeaders = new Headers(response.headers);
      responseHeaders.delete("content-length");
      responseHeaders.delete("content-encoding");
      responseHeaders.set("content-type", "application/json; charset=utf-8");

      return new Response(JSON.stringify(patched), {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders
      });
    } catch {
      return response;
    }
  };
})();
