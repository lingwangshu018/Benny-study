// Benny Study · GitHub Release 附件读取兼容补丁 v0.2
(function () {
  const nativeFetch = window.fetch.bind(window);
  const RELEASE_LIST_RE = /^https:\/\/api\.github\.com\/repos\/([^/]+)\/([^/]+)\/releases(?:\?|$)/i;
  const VIDEO_RE = /\.(mp4|m4v|webm|mov)$/i;
  const TARGET_NAME = "Benny Study 私人视频仓";
  const TARGET_TAG = "study-videos";

  function isExactTarget(release) {
    return release && (
      release.tag_name === TARGET_TAG ||
      release.name === TARGET_NAME ||
      String(release.body || "").includes("课程视频和同名")
    );
  }

  function videoCount(release) {
    return Array.isArray(release?.assets)
      ? release.assets.filter(asset => VIDEO_RE.test(String(asset?.name || ""))).length
      : 0;
  }

  function assetCount(release) {
    return Array.isArray(release?.assets) ? release.assets.length : 0;
  }

  async function fetchAssets(owner, repo, release, headers) {
    try {
      const url = `https://api.github.com/repos/${owner}/${repo}/releases/${release.id}/assets?per_page=100`;
      const response = await nativeFetch(url, { method: "GET", headers });
      if (!response.ok) {
        return { ...release, assets: Array.isArray(release.assets) ? release.assets : [], _bennyAssetStatus: response.status };
      }
      const assets = await response.json();
      return {
        ...release,
        assets: Array.isArray(assets) ? assets : [],
        _bennyAssetStatus: response.status
      };
    } catch (error) {
      return {
        ...release,
        assets: Array.isArray(release.assets) ? release.assets : [],
        _bennyAssetStatus: 0,
        _bennyAssetError: String(error?.message || error)
      };
    }
  }

  function chooseStudyRelease(releases) {
    const exact = releases.filter(isExactTarget);
    const exactWithVideos = exact.filter(item => videoCount(item) > 0);
    if (exactWithVideos.length) {
      return exactWithVideos.sort((a, b) => videoCount(b) - videoCount(a) || assetCount(b) - assetCount(a))[0];
    }

    const draftWithVideos = releases.filter(item => item?.draft && videoCount(item) > 0);
    if (draftWithVideos.length) {
      return draftWithVideos.sort((a, b) => videoCount(b) - videoCount(a) || assetCount(b) - assetCount(a))[0];
    }

    return exact.sort((a, b) => assetCount(b) - assetCount(a) || String(b.updated_at || "").localeCompare(String(a.updated_at || "")))[0] || null;
  }

  function publishDebug(releases, selected) {
    const details = releases.map(item => ({
      id: item.id,
      name: item.name || "",
      tag: item.tag_name || "",
      draft: Boolean(item.draft),
      status: item._bennyAssetStatus,
      assets: assetCount(item),
      videos: videoCount(item),
      filenames: (item.assets || []).map(asset => asset.name)
    }));
    window.__bennyReleaseProbe = {
      checkedAt: new Date().toISOString(),
      releaseCount: releases.length,
      selectedId: selected?.id || null,
      selectedVideos: videoCount(selected),
      releases: details
    };
  }

  function decorateEmptyMessage() {
    const status = document.getElementById("studyVideoCloudStatus");
    const probe = window.__bennyReleaseProbe;
    if (!status || !probe || !/还是空|没有新视频|同步失败/.test(status.textContent || "")) return;
    const selected = probe.releases.find(item => String(item.id) === String(probe.selectedId));
    const summary = `检查到 ${probe.releaseCount} 个 Release；选中草稿附件 ${selected?.assets ?? 0} 个、视频 ${selected?.videos ?? 0} 个${selected?.status ? `（接口 ${selected.status}）` : ""}。`;
    if (!status.textContent.includes("检查到")) status.textContent += ` ${summary}`;
  }

  window.fetch = async function patchedFetch(input, init) {
    const response = await nativeFetch(input, init);
    try {
      const url = typeof input === "string" ? input : input?.url || String(input || "");
      const match = url.match(RELEASE_LIST_RE);
      if (!match || !response.ok || /\/releases\/\d+\/assets(?:\?|$)/i.test(url)) return response;

      const releases = await response.clone().json();
      if (!Array.isArray(releases)) return response;

      const headers = init?.headers || (typeof Request !== "undefined" && input instanceof Request ? input.headers : undefined);
      const checked = [];
      for (const release of releases) {
        checked.push(await fetchAssets(match[1], match[2], release, headers));
      }

      const selected = chooseStudyRelease(checked);
      publishDebug(checked, selected);

      let patched = checked;
      if (selected) {
        const selectedForApp = {
          ...selected,
          name: TARGET_NAME,
          tag_name: TARGET_TAG
        };
        patched = [selectedForApp, ...checked.filter(item => item.id !== selected.id)];
      }

      const responseHeaders = new Headers(response.headers);
      responseHeaders.delete("content-length");
      responseHeaders.delete("content-encoding");
      responseHeaders.set("content-type", "application/json; charset=utf-8");

      setTimeout(decorateEmptyMessage, 80);
      return new Response(JSON.stringify(patched), {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders
      });
    } catch (error) {
      window.__bennyReleaseProbe = { checkedAt: new Date().toISOString(), patchError: String(error?.message || error) };
      return response;
    }
  };

  const observer = new MutationObserver(() => decorateEmptyMessage());
  observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true });
})();
