// Benny Study · GitHub Release 视频下载通道
(function () {
  const PROXY_KEY = "benny-study-video-proxy-url";
  const ASSET_API_RE = /^https:\/\/api\.github\.com\/repos\/[^/]+\/[^/]+\/releases\/assets\/\d+(?:\?.*)?$/i;
  const originalFetch = window.fetch.bind(window);

  function normalizedProxyUrl() {
    const raw = String(localStorage.getItem(PROXY_KEY) || "").trim();
    if (!raw) return "";
    try {
      const url = new URL(raw);
      if (url.protocol !== "https:") return "";
      return url.toString();
    } catch {
      return "";
    }
  }

  window.fetch = function fetchWithVideoProxy(input, init = {}) {
    const target = typeof input === "string" ? input : input?.url || String(input || "");
    if (!ASSET_API_RE.test(target)) return originalFetch(input, init);

    const proxy = normalizedProxyUrl();
    if (!proxy) {
      return Promise.reject(new Error("GitHub 已找到视频，但浏览器不能直接读取附件。请先在右上角设置里填写“视频下载通道”。"));
    }

    const proxyUrl = new URL(proxy);
    proxyUrl.searchParams.set("url", target);
    const headers = new Headers(init?.headers || (typeof Request !== "undefined" && input instanceof Request ? input.headers : undefined));

    return originalFetch(proxyUrl.toString(), {
      ...init,
      method: "GET",
      headers,
      redirect: "follow"
    });
  };

  function updateProxyState() {
    const state = document.getElementById("studyVideoProxyState");
    if (!state) return;
    const ready = Boolean(normalizedProxyUrl());
    state.className = `video-cloud-proxy-state ${ready ? "is-ready" : "is-missing"}`;
    state.innerHTML = ready
      ? `<span>✅ 视频下载通道已配置</span><button type="button" id="studyVideoProxyEdit">修改</button>`
      : `<span>⚠️ 还差一步：配置视频下载通道后才能把附件下载到浏览器。</span><button type="button" id="studyVideoProxyEdit">去配置</button>`;
    document.getElementById("studyVideoProxyEdit")?.addEventListener("click", () => {
      if (typeof openSettings === "function") openSettings();
      setTimeout(fillProxyInput, 0);
    });
  }

  function fillProxyInput() {
    const input = document.getElementById("videoProxyInput");
    if (input) input.value = localStorage.getItem(PROXY_KEY) || "";
  }

  function saveProxyInput() {
    const input = document.getElementById("videoProxyInput");
    if (!input) return;
    const raw = input.value.trim();
    if (!raw) {
      localStorage.removeItem(PROXY_KEY);
      updateProxyState();
      return;
    }
    try {
      const value = new URL(raw);
      if (value.protocol !== "https:") throw new Error("地址必须以 https:// 开头");
      localStorage.setItem(PROXY_KEY, value.toString());
      const status = document.getElementById("cloudStatus");
      if (status) status.textContent = "设置已保存。视频下载通道也准备好啦。";
      updateProxyState();
    } catch (error) {
      const status = document.getElementById("cloudStatus");
      if (status) status.textContent = `视频下载通道地址无效：${error.message || error}`;
    }
  }

  function injectSettingsField() {
    const grid = document.querySelector("#settingsDialog .form-grid");
    if (!grid || document.getElementById("videoProxyInput")) return;
    const label = document.createElement("label");
    label.className = "span-2";
    label.id = "videoProxyLabel";
    label.innerHTML = `视频下载通道（Cloudflare Worker）<input id="videoProxyInput" type="url" placeholder="https://你的名称.你的账户.workers.dev/">`;
    grid.appendChild(label);
    fillProxyInput();

    const saveButton = document.getElementById("saveSettingsButton");
    if (saveButton && saveButton.dataset.videoProxyBound !== "true") {
      saveButton.dataset.videoProxyBound = "true";
      saveButton.addEventListener("click", saveProxyInput);
    }
  }

  function injectPanelState() {
    const panel = document.getElementById("studyVideoCloudPanel");
    if (!panel || document.getElementById("studyVideoProxyState")) return;
    const state = document.createElement("div");
    state.id = "studyVideoProxyState";
    panel.appendChild(state);
    updateProxyState();
  }

  function improveFetchError() {
    const status = document.getElementById("studyVideoCloudStatus");
    if (!status || status.dataset.proxyWatched === "true") return;
    status.dataset.proxyWatched = "true";
    const observer = new MutationObserver(() => {
      const text = status.textContent || "";
      if (/同步失败：Failed to fetch/i.test(text)) {
        status.textContent = "已经找到云端视频，但 GitHub 的附件下载被浏览器拦住了。请先配置下方的视频下载通道。";
        status.className = "video-cloud-status is-error";
      }
    });
    observer.observe(status, { childList: true, characterData: true, subtree: true });
  }

  function injectAll() {
    injectSettingsField();
    injectPanelState();
    improveFetchError();
  }

  document.getElementById("settingsButton")?.addEventListener("click", () => setTimeout(() => {
    injectSettingsField();
    fillProxyInput();
  }, 0));

  const root = document.documentElement;
  const observer = new MutationObserver(injectAll);
  observer.observe(root, { childList: true, subtree: true });
  injectAll();
})();
