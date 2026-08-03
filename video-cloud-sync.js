// Benny Study · GitHub 草稿 Release 视频同步 v0.1
(function () {
  const PAGE_ID = "videos";
  const DB_NAME = "benny-study-media";
  const DB_VERSION = 1;
  const STORE_NAME = "videos";
  const SETTINGS_KEY = "benny-study-github-settings";
  const RELEASE_TAG = "study-videos";
  const AUTO_SYNC_KEY = "benny-study-video-cloud-auto";
  const SYNCED_ASSETS_KEY = "benny-study-video-cloud-synced-assets";
  const LAST_SYNC_KEY = "benny-study-video-cloud-last-sync";
  const AUTO_SYNC_COOLDOWN_MS = 5 * 60 * 1000;
  const VIDEO_RE = /\.(mp4|m4v|webm|mov)$/i;
  const SUBTITLE_RE = /\.(srt|vtt)$/i;

  let dbPromise = null;
  let syncing = false;
  let subtitleObjectUrl = "";
  let autoSyncScheduled = false;

  function readJson(key, fallback) {
    try {
      const value = JSON.parse(localStorage.getItem(key) || "null");
      return value ?? fallback;
    } catch {
      return fallback;
    }
  }

  function getSettings() {
    const value = readJson(SETTINGS_KEY, {});
    return {
      repo: String(value.repo || "").trim(),
      branch: String(value.branch || "main").trim() || "main",
      token: String(value.token || "").trim()
    };
  }

  function isAutoSyncEnabled() {
    const stored = localStorage.getItem(AUTO_SYNC_KEY);
    return stored === null ? true : stored === "true";
  }

  function setAutoSyncEnabled(enabled) {
    localStorage.setItem(AUTO_SYNC_KEY, String(Boolean(enabled)));
  }

  function getSyncedAssets() {
    return new Set(readJson(SYNCED_ASSETS_KEY, []).map(String));
  }

  function saveSyncedAssets(set) {
    localStorage.setItem(SYNCED_ASSETS_KEY, JSON.stringify([...set]));
  }

  function newId() {
    return globalThis.crypto?.randomUUID?.() || `cloud-video-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  function baseName(name) {
    return String(name || "").replace(/\.[^.]+$/, "").trim().toLowerCase();
  }

  function mimeForAsset(asset) {
    if (asset.content_type?.startsWith("video/")) return asset.content_type;
    if (/\.webm$/i.test(asset.name)) return "video/webm";
    if (/\.mov$/i.test(asset.name)) return "video/quicktime";
    return "video/mp4";
  }

  function formatBytes(bytes) {
    const value = Number(bytes) || 0;
    if (value < 1024) return `${value} B`;
    if (value < 1024 ** 2) return `${(value / 1024).toFixed(1)} KB`;
    if (value < 1024 ** 3) return `${(value / 1024 ** 2).toFixed(1)} MB`;
    return `${(value / 1024 ** 3).toFixed(2)} GB`;
  }

  function openDatabase() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
          store.createIndex("addedAt", "addedAt");
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error("本地视频库打开失败。"));
    });
    return dbPromise;
  }

  async function getAllVideos() {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const request = tx.objectStore(STORE_NAME).getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error || new Error("本地视频列表读取失败。"));
    });
  }

  async function putVideo(record) {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).put(record);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error || new Error("云端视频保存失败。"));
      tx.onabort = () => reject(tx.error || new Error("云端视频保存已取消。"));
    });
  }

  function parseErrorBody(text, status) {
    if (!text) return `GitHub 请求失败：${status}`;
    try {
      const data = JSON.parse(text);
      return data.message || `GitHub 请求失败：${status}`;
    } catch {
      return text.slice(0, 180) || `GitHub 请求失败：${status}`;
    }
  }

  async function githubApi(path, options = {}) {
    const settings = getSettings();
    if (!settings.repo || !settings.token) {
      throw new Error("请先点右上角齿轮，保存 GitHub 仓库和 Token。Token 需要 Contents 读写权限。");
    }
    const url = `https://api.github.com/repos/${settings.repo}${path ? `/${path}` : ""}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${settings.token}`,
        "X-GitHub-Api-Version": "2022-11-28",
        ...(options.headers || {})
      }
    });
    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(parseErrorBody(text, response.status));
    }
    return response;
  }

  async function getRepositoryInfo() {
    return githubApi("").then(response => response.json());
  }

  async function listReleases() {
    const response = await githubApi("releases?per_page=100");
    return response.json();
  }

  async function findVideoRelease() {
    const releases = await listReleases();
    return releases.find(item => item.tag_name === RELEASE_TAG || item.name === "Benny Study 私人视频仓") || null;
  }

  async function createDraftRelease() {
    const settings = getSettings();
    const response = await githubApi("releases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tag_name: RELEASE_TAG,
        target_commitish: settings.branch,
        name: "Benny Study 私人视频仓",
        body: "把课程视频和同名 .srt / .vtt 字幕拖到附件区。请始终保持为草稿，不要发布。",
        draft: true,
        prerelease: false,
        generate_release_notes: false
      })
    });
    return response.json();
  }

  async function forceDraft(release) {
    if (release.draft) return release;
    const response = await githubApi(`releases/${release.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ draft: true })
    });
    return response.json();
  }

  async function ensureVideoRelease() {
    const repo = await getRepositoryInfo();
    let release = await findVideoRelease();
    if (!release) release = await createDraftRelease();
    if (!repo.private && !release.draft) release = await forceDraft(release);
    return { repo, release };
  }

  async function downloadAsset(asset, accept = "application/octet-stream") {
    return githubApi(`releases/assets/${asset.id}`, { headers: { Accept: accept } });
  }

  async function downloadSubtitle(asset) {
    const response = await downloadAsset(asset, "application/octet-stream");
    return response.text();
  }

  function setCloudStatus(message, tone = "") {
    const status = document.getElementById("studyVideoCloudStatus");
    if (!status) return;
    status.textContent = message || "";
    status.className = `video-cloud-status ${tone ? `is-${tone}` : ""}`;
  }

  function settingsReady() {
    const settings = getSettings();
    return Boolean(settings.repo && settings.token);
  }

  function openGitHubSettings() {
    if (typeof openSettings === "function") openSettings();
    setCloudStatus("先保存 GitHub Token；保存后回到这里点“上传视频”。", "notice");
  }

  async function openUploadPage() {
    if (!settingsReady()) {
      openGitHubSettings();
      return;
    }
    const button = document.getElementById("studyVideoCloudUpload");
    if (button) button.disabled = true;
    try {
      setCloudStatus("正在准备私人视频仓…");
      const { repo, release } = await ensureVideoRelease();
      if (!repo.private) {
        setCloudStatus("视频仓已经自动锁成“草稿”。上传后千万不要点“发布 Release”。", "notice");
      } else {
        setCloudStatus("视频仓准备好了。把视频拖进附件区，保存草稿后回来同步。", "success");
      }
      window.open(release.html_url, "_blank", "noopener,noreferrer");
    } catch (error) {
      setCloudStatus(`视频仓打开失败：${error.message || error}`, "error");
    } finally {
      if (button) button.disabled = false;
    }
  }

  function findSubtitleForVideo(videoAsset, subtitleMap) {
    return subtitleMap.get(baseName(videoAsset.name)) || null;
  }

  async function syncSubtitlesForExistingVideos(videos, subtitleMap) {
    let updated = 0;
    for (const record of videos) {
      if (!record.cloudAssetId) continue;
      const subtitle = subtitleMap.get(baseName(record.cloudAssetName || record.name));
      if (!subtitle || String(record.cloudSubtitleAssetId || "") === String(subtitle.id)) continue;
      setCloudStatus(`正在给“${record.name}”配字幕…`);
      const text = await downloadSubtitle(subtitle);
      await putVideo({
        ...record,
        subtitleName: subtitle.name,
        subtitleText: text,
        cloudSubtitleAssetId: String(subtitle.id),
        updatedAt: new Date().toISOString()
      });
      updated += 1;
    }
    return updated;
  }

  async function syncCloudVideos({ automatic = false } = {}) {
    if (syncing) return;
    if (!settingsReady()) {
      if (!automatic) openGitHubSettings();
      return;
    }
    syncing = true;
    const syncButton = document.getElementById("studyVideoCloudSync");
    if (syncButton) syncButton.disabled = true;
    try {
      setCloudStatus(automatic ? "正在自动检查 GitHub 视频仓…" : "正在检查 GitHub 视频仓…");
      const { repo, release } = await ensureVideoRelease();
      if (!repo.private && !release.draft) {
        throw new Error("视频 Release 不是草稿，附件可能公开。请先把它改回草稿。");
      }

      const assets = (release.assets || []).filter(asset => asset.state === "uploaded");
      const videoAssets = assets.filter(asset => VIDEO_RE.test(asset.name));
      const subtitleMap = new Map(assets.filter(asset => SUBTITLE_RE.test(asset.name)).map(asset => [baseName(asset.name), asset]));
      const localVideos = await getAllVideos();
      const localCloudIds = new Set(localVideos.map(item => String(item.cloudAssetId || "")).filter(Boolean));
      const localNameSizes = new Set(localVideos.map(item => `${String(item.name).toLowerCase()}|${Number(item.size) || 0}`));
      const syncedAssets = getSyncedAssets();
      const pending = videoAssets.filter(asset => {
        const id = String(asset.id);
        const sameFile = localNameSizes.has(`${String(asset.name).toLowerCase()}|${Number(asset.size) || 0}`);
        if (localCloudIds.has(id) || sameFile) {
          syncedAssets.add(id);
          return false;
        }
        return !syncedAssets.has(id);
      });

      const subtitleUpdates = await syncSubtitlesForExistingVideos(localVideos, subtitleMap);
      if (!pending.length) {
        saveSyncedAssets(syncedAssets);
        localStorage.setItem(LAST_SYNC_KEY, String(Date.now()));
        setCloudStatus(
          subtitleUpdates
            ? `没有新视频，补上了 ${subtitleUpdates} 份字幕。`
            : videoAssets.length
              ? `云端有 ${videoAssets.length} 条视频，这台设备已经同步完啦。`
              : "视频仓还是空的。点“上传视频”把课程拖进去。",
          "success"
        );
        if (subtitleUpdates && typeof render === "function" && currentPage === PAGE_ID) render();
        return;
      }

      let imported = 0;
      let totalBytes = 0;
      for (let index = 0; index < pending.length; index += 1) {
        const asset = pending[index];
        setCloudStatus(`正在下载 ${index + 1}/${pending.length}：${asset.name}（${formatBytes(asset.size)}）…`);
        const response = await downloadAsset(asset);
        const blob = await response.blob();
        const subtitleAsset = findSubtitleForVideo(asset, subtitleMap);
        let subtitleText = "";
        if (subtitleAsset) {
          setCloudStatus(`视频已下载，正在配同名字幕：${subtitleAsset.name}…`);
          subtitleText = await downloadSubtitle(subtitleAsset);
        }
        const now = new Date().toISOString();
        await putVideo({
          id: newId(),
          name: asset.name,
          type: mimeForAsset(asset),
          size: blob.size || Number(asset.size) || 0,
          blob,
          addedAt: now,
          updatedAt: now,
          currentTime: 0,
          duration: 0,
          playbackRate: Number(localStorage.getItem("benny-study-video-rate") || 1),
          completed: false,
          source: "github-release",
          cloudAssetId: String(asset.id),
          cloudAssetName: asset.name,
          cloudReleaseId: String(release.id),
          cloudReleaseTag: RELEASE_TAG,
          cloudUpdatedAt: asset.updated_at || now,
          subtitleName: subtitleAsset?.name || "",
          subtitleText,
          cloudSubtitleAssetId: subtitleAsset ? String(subtitleAsset.id) : ""
        });
        syncedAssets.add(String(asset.id));
        if (subtitleAsset) syncedAssets.add(String(subtitleAsset.id));
        imported += 1;
        totalBytes += blob.size || Number(asset.size) || 0;
      }

      saveSyncedAssets(syncedAssets);
      localStorage.setItem(LAST_SYNC_KEY, String(Date.now()));
      setCloudStatus(`同步完成：新增 ${imported} 条视频，共 ${formatBytes(totalBytes)}。`, "success");
      if (typeof render === "function" && currentPage === PAGE_ID) render();
    } catch (error) {
      setCloudStatus(`同步失败：${error.message || error}`, "error");
    } finally {
      syncing = false;
      const currentButton = document.getElementById("studyVideoCloudSync");
      if (currentButton) currentButton.disabled = false;
    }
  }

  function toWebVtt(text, name = "") {
    let content = String(text || "").replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n").trim();
    if (!content) return "";
    if (/^WEBVTT(?:\s|$)/i.test(content)) return `${content}\n`;
    content = content.replace(
      /(\d{1,2}:\d{2}:\d{2}),(\d{3})\s*-->\s*(\d{1,2}:\d{2}:\d{2}),(\d{3})/g,
      "$1.$2 --> $3.$4"
    );
    return `WEBVTT\n\nNOTE Imported from ${String(name || "SRT").replace(/[\r\n]/g, " ")}\n\n${content}\n`;
  }

  function revokeSubtitleUrl() {
    if (!subtitleObjectUrl) return;
    URL.revokeObjectURL(subtitleObjectUrl);
    subtitleObjectUrl = "";
  }

  async function attachCloudSubtitle() {
    if (currentPage !== PAGE_ID) {
      revokeSubtitleUrl();
      return;
    }
    const player = document.getElementById("studyVideoPlayer");
    if (!player || player.dataset.cloudSubtitleChecked === "true") return;
    player.dataset.cloudSubtitleChecked = "true";
    const activeId = localStorage.getItem("benny-study-active-video") || "";
    if (!activeId) return;
    const videos = await getAllVideos();
    const record = videos.find(item => item.id === activeId);
    if (!record?.subtitleText) return;

    const vtt = toWebVtt(record.subtitleText, record.subtitleName);
    if (!vtt) return;
    revokeSubtitleUrl();
    subtitleObjectUrl = URL.createObjectURL(new Blob([vtt], { type: "text/vtt;charset=utf-8" }));
    const track = document.createElement("track");
    track.kind = "subtitles";
    track.label = "中文字幕";
    track.srclang = "zh-CN";
    track.src = subtitleObjectUrl;
    track.default = true;
    track.dataset.cloudSubtitle = "true";
    track.addEventListener("load", () => {
      try {
        for (const textTrack of player.textTracks) textTrack.mode = "showing";
      } catch {}
    });
    player.appendChild(track);
  }

  function injectCloudPanel() {
    if (currentPage !== PAGE_ID) return;
    const page = document.querySelector(".video-library-page");
    const hero = page?.querySelector(".video-library-hero");
    if (!page || !hero || document.getElementById("studyVideoCloudPanel")) {
      attachCloudSubtitle().catch(() => {});
      return;
    }

    const settings = getSettings();
    const panel = document.createElement("section");
    panel.id = "studyVideoCloudPanel";
    panel.className = "video-cloud-panel";
    panel.innerHTML = `<div class="video-cloud-copy">
      <span class="video-cloud-icon">☁️</span>
      <div><strong>GitHub 私人视频仓</strong><p>上传到草稿 Release，换设备进入这里后自动下载。代码仓公开也不会把草稿附件展示给别人。</p></div>
    </div>
    <div class="video-cloud-actions">
      <button class="secondary" id="studyVideoCloudUpload" type="button">上传视频</button>
      <button class="primary" id="studyVideoCloudSync" type="button">立即同步</button>
      <label class="video-cloud-auto"><input id="studyVideoCloudAuto" type="checkbox" ${isAutoSyncEnabled() ? "checked" : ""}> 自动同步新视频</label>
    </div>
    <p class="video-cloud-status" id="studyVideoCloudStatus">${settings.repo ? `视频仓：${settings.repo} · 标签 ${RELEASE_TAG}` : "还没设置 GitHub Token。"}</p>`;
    hero.insertAdjacentElement("afterend", panel);

    const footer = page.querySelector(".video-queue-card > footer span");
    if (footer) footer.textContent = "本地导入只留在当前设备；GitHub 同步的视频来自私人草稿 Release。删除本机视频不会删除云端原件。";

    document.getElementById("studyVideoCloudUpload")?.addEventListener("click", openUploadPage);
    document.getElementById("studyVideoCloudSync")?.addEventListener("click", () => syncCloudVideos({ automatic: false }));
    document.getElementById("studyVideoCloudAuto")?.addEventListener("change", event => {
      setAutoSyncEnabled(event.target.checked);
      setCloudStatus(event.target.checked ? "已开启：进入学习视频页时会自动检查新视频。" : "已关闭自动同步，需要时点“立即同步”。", "success");
      if (event.target.checked) syncCloudVideos({ automatic: true });
    });

    attachCloudSubtitle().catch(() => {});
    scheduleAutoSync();
  }

  function scheduleAutoSync() {
    if (autoSyncScheduled || !isAutoSyncEnabled() || !settingsReady()) return;
    const lastSync = Number(localStorage.getItem(LAST_SYNC_KEY) || 0);
    if (Date.now() - lastSync < AUTO_SYNC_COOLDOWN_MS) return;
    autoSyncScheduled = true;
    setTimeout(() => {
      autoSyncScheduled = false;
      if (currentPage === PAGE_ID) syncCloudVideos({ automatic: true });
    }, 500);
  }

  const app = document.getElementById("app");
  if (!app) return;
  const observer = new MutationObserver(() => injectCloudPanel());
  observer.observe(app, { childList: true, subtree: true });
  window.addEventListener("hashchange", () => setTimeout(injectCloudPanel, 0));
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") setTimeout(injectCloudPanel, 0);
  });
  injectCloudPanel();
})();