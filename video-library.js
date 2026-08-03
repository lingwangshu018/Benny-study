// Benny Study · 本地学习视频库 v0.1
(function () {
  const PAGE_ID = "videos";
  const DB_NAME = "benny-study-media";
  const DB_VERSION = 1;
  const STORE_NAME = "videos";
  const ACTIVE_VIDEO_KEY = "benny-study-active-video";
  const DEFAULT_RATE_KEY = "benny-study-video-rate";
  const SAVE_INTERVAL_MS = 4000;
  const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3];

  let dbPromise = null;
  let selectedVideoId = localStorage.getItem(ACTIVE_VIDEO_KEY) || "";
  let activeObjectUrl = "";
  let lastProgressSaveAt = 0;
  let pageGeneration = 0;

  if (!NAV_ITEMS.some(([id]) => id === PAGE_ID)) {
    const todayIndex = NAV_ITEMS.findIndex(([id]) => id === "today");
    NAV_ITEMS.splice(todayIndex >= 0 ? todayIndex + 1 : NAV_ITEMS.length, 0, [PAGE_ID, "学习视频"]);
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
      request.onblocked = () => reject(new Error("视频库正在被另一个页面占用，请关闭其他 Benny Study 页面后重试。"));
    });
    return dbPromise;
  }

  async function useStore(mode, callback) {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, mode);
      const store = tx.objectStore(STORE_NAME);
      let result;
      try {
        result = callback(store);
      } catch (error) {
        reject(error);
        return;
      }
      tx.oncomplete = () => resolve(result);
      tx.onerror = () => reject(tx.error || new Error("本地视频库操作失败。"));
      tx.onabort = () => reject(tx.error || new Error("本地视频库操作已取消。"));
    });
  }

  async function requestResult(request) {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error("读取视频失败。"));
    });
  }

  async function getAllVideos() {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const request = tx.objectStore(STORE_NAME).getAll();
      request.onsuccess = () => {
        const videos = request.result || [];
        videos.sort((a, b) => String(b.addedAt).localeCompare(String(a.addedAt)));
        resolve(videos);
      };
      request.onerror = () => reject(request.error || new Error("视频列表读取失败。"));
    });
  }

  async function getVideo(id) {
    const db = await openDatabase();
    const tx = db.transaction(STORE_NAME, "readonly");
    return requestResult(tx.objectStore(STORE_NAME).get(id));
  }

  async function putVideo(record) {
    return useStore("readwrite", store => store.put(record));
  }

  async function deleteVideo(id) {
    return useStore("readwrite", store => store.delete(id));
  }

  function newId() {
    if (globalThis.crypto?.randomUUID) return crypto.randomUUID();
    return `video-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  function formatBytes(bytes) {
    const value = Number(bytes) || 0;
    if (value < 1024) return `${value} B`;
    if (value < 1024 ** 2) return `${(value / 1024).toFixed(1)} KB`;
    if (value < 1024 ** 3) return `${(value / 1024 ** 2).toFixed(1)} MB`;
    return `${(value / 1024 ** 3).toFixed(2)} GB`;
  }

  function formatClock(seconds) {
    const total = Math.max(0, Math.floor(Number(seconds) || 0));
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    return h ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}` : `${m}:${String(s).padStart(2, "0")}`;
  }

  function progressOf(video) {
    const duration = Number(video.duration) || 0;
    const current = Number(video.currentTime) || 0;
    if (!duration) return video.completed ? 100 : 0;
    return Math.min(100, Math.max(0, Math.round(current / duration * 100)));
  }

  function renderVideoPage() {
    return `<section class="video-library-page">
      <header class="video-library-hero">
        <div>
          <span class="badge">🎬 只看今天要看的</span>
          <h1>学习视频</h1>
          <p>把课程视频直接放进 Benny Study。这里没有推荐流、热榜和弹幕，只有今天该完成的内容。</p>
        </div>
        <div class="video-library-hero-actions">
          <button class="primary" id="studyVideoImport" type="button">＋ 导入今日视频</button>
          <input id="studyVideoInput" type="file" accept="video/*,.mp4,.m4v,.webm,.mov" multiple hidden>
          <small id="studyVideoStorage">正在读取本地空间…</small>
        </div>
      </header>

      <div id="studyVideoStatus" class="video-library-status" aria-live="polite"></div>

      <div class="video-library-layout">
        <article class="video-player-card" id="studyVideoPlayerHost">
          <div class="video-player-empty">
            <div class="video-empty-mascot">🐰🎧</div>
            <h2>先把今天的课程放进来吧</h2>
            <p>支持一次导入多个视频；刷新或退出后，视频和播放进度仍会留在这台设备里。</p>
            <button class="primary" id="studyVideoEmptyImport" type="button">选择本地视频</button>
          </div>
        </article>

        <aside class="video-queue-card">
          <header>
            <div><h2>今日视频篮子</h2><p>看完一条，删掉一条。</p></div>
            <span class="video-queue-count" id="studyVideoCount">0 条</span>
          </header>
          <div class="video-queue" id="studyVideoQueue">
            <div class="video-queue-loading">正在打开视频篮子…</div>
          </div>
          <footer>
            <span>视频只保存在当前浏览器或 APK，不会上传 GitHub，也不会进入 JSON 存档。</span>
          </footer>
        </aside>
      </div>
    </section>`;
  }

  function setStatus(message, tone = "") {
    const status = document.getElementById("studyVideoStatus");
    if (!status) return;
    status.textContent = message || "";
    status.className = `video-library-status ${tone ? `is-${tone}` : ""}`;
  }

  async function updateStorageLabel(videos = null) {
    const label = document.getElementById("studyVideoStorage");
    if (!label) return;
    const list = videos || await getAllVideos();
    const videoBytes = list.reduce((sum, item) => sum + (Number(item.size) || 0), 0);
    let text = `视频共 ${formatBytes(videoBytes)}`;
    if (navigator.storage?.estimate) {
      try {
        const estimate = await navigator.storage.estimate();
        if (estimate.quota) text += ` · 应用空间 ${formatBytes(estimate.usage || 0)} / ${formatBytes(estimate.quota)}`;
      } catch {}
    }
    label.textContent = text;
  }

  function queueItem(video) {
    const pct = progressOf(video);
    const isActive = video.id === selectedVideoId;
    const stateLabel = video.completed || pct >= 99 ? "已看完" : pct > 0 ? `已看 ${pct}%` : "未开始";
    return `<article class="video-queue-item ${isActive ? "is-active" : ""} ${video.completed ? "is-completed" : ""}" data-video-id="${esc(video.id)}">
      <button class="video-queue-main" type="button" data-video-action="play" data-video-id="${esc(video.id)}">
        <span class="video-queue-icon">${video.completed ? "✅" : isActive ? "▶" : "🎞️"}</span>
        <span class="video-queue-copy">
          <strong title="${esc(video.name)}">${esc(video.name)}</strong>
          <small>${formatBytes(video.size)} · ${video.duration ? formatClock(video.duration) : "待读取时长"}</small>
          <span class="video-queue-progress"><i style="width:${pct}%"></i></span>
          <em>${stateLabel}</em>
        </span>
      </button>
      <button class="video-queue-delete" type="button" data-video-action="delete" data-video-id="${esc(video.id)}" aria-label="删除 ${esc(video.name)}">删除</button>
    </article>`;
  }

  async function refreshLibrary(generation = pageGeneration) {
    const videos = await getAllVideos();
    if (generation !== pageGeneration || currentPage !== PAGE_ID) return;

    const queue = document.getElementById("studyVideoQueue");
    const count = document.getElementById("studyVideoCount");
    if (!queue || !count) return;

    count.textContent = `${videos.length} 条`;
    queue.innerHTML = videos.length
      ? videos.map(queueItem).join("")
      : `<div class="video-queue-empty"><span>🌙</span><strong>视频篮子是空的</strong><p>每天只放今天要看的，看完就清空。</p></div>`;

    await updateStorageLabel(videos);

    if (!videos.length) {
      selectedVideoId = "";
      localStorage.removeItem(ACTIVE_VIDEO_KEY);
      showEmptyPlayer();
      return;
    }

    if (!videos.some(item => item.id === selectedVideoId)) selectedVideoId = videos[0].id;
    localStorage.setItem(ACTIVE_VIDEO_KEY, selectedVideoId);
    await loadVideo(selectedVideoId, generation);
  }

  function showEmptyPlayer() {
    revokeActiveUrl();
    const host = document.getElementById("studyVideoPlayerHost");
    if (!host) return;
    host.innerHTML = `<div class="video-player-empty">
      <div class="video-empty-mascot">🐰🎧</div>
      <h2>今天的视频已经清空啦</h2>
      <p>休息一下，或者把下一条明确要看的课程导进来。</p>
      <button class="primary" id="studyVideoEmptyImport" type="button">导入视频</button>
    </div>`;
    document.getElementById("studyVideoEmptyImport")?.addEventListener("click", openFilePicker);
  }

  function revokeActiveUrl() {
    if (!activeObjectUrl) return;
    URL.revokeObjectURL(activeObjectUrl);
    activeObjectUrl = "";
  }

  async function loadVideo(id, generation = pageGeneration) {
    const record = await getVideo(id);
    if (!record || generation !== pageGeneration || currentPage !== PAGE_ID) return;

    selectedVideoId = id;
    localStorage.setItem(ACTIVE_VIDEO_KEY, id);
    document.querySelectorAll(".video-queue-item").forEach(item => item.classList.toggle("is-active", item.dataset.videoId === id));

    revokeActiveUrl();
    activeObjectUrl = URL.createObjectURL(record.blob);
    const savedRate = Number(record.playbackRate || localStorage.getItem(DEFAULT_RATE_KEY) || 1);
    const host = document.getElementById("studyVideoPlayerHost");
    if (!host) return;

    host.innerHTML = `<div class="video-player-heading">
      <div><span>${record.completed ? "✅ 已看完" : "🎬 正在学习"}</span><h2 title="${esc(record.name)}">${esc(record.name)}</h2><p>${formatBytes(record.size)} · 导入于 ${new Date(record.addedAt).toLocaleString()}</p></div>
      <button class="danger video-finish-delete" id="studyVideoDeleteActive" type="button">看完删除</button>
    </div>
    <div class="video-stage">
      <video id="studyVideoPlayer" controls playsinline preload="metadata" src="${activeObjectUrl}"></video>
    </div>
    <div class="video-control-deck">
      <div class="video-skip-controls">
        <button class="secondary" id="studyVideoBack" type="button">↶ 10 秒</button>
        <button class="secondary" id="studyVideoForward" type="button">10 秒 ↷</button>
        <button class="secondary" id="studyVideoFullscreen" type="button">全屏</button>
      </div>
      <label class="video-speed-control">播放速度
        <select id="studyVideoRate">${SPEEDS.map(rate => `<option value="${rate}" ${Math.abs(rate - savedRate) < 0.01 ? "selected" : ""}>${rate}×</option>`).join("")}</select>
      </label>
      <div class="video-progress-copy"><strong id="studyVideoProgressText">${formatClock(record.currentTime)} / ${record.duration ? formatClock(record.duration) : "--:--"}</strong><span>自动记住进度</span></div>
    </div>`;

    const player = document.getElementById("studyVideoPlayer");
    const rateSelect = document.getElementById("studyVideoRate");
    if (!player || !rateSelect) return;

    player.addEventListener("loadedmetadata", async () => {
      const duration = Number.isFinite(player.duration) ? player.duration : 0;
      const resumeAt = Math.min(Number(record.currentTime) || 0, Math.max(0, duration - 0.25));
      if (resumeAt > 0) player.currentTime = resumeAt;
      player.playbackRate = savedRate;
      if (duration && Math.abs((record.duration || 0) - duration) > 1) {
        record.duration = duration;
        record.updatedAt = new Date().toISOString();
        await putVideo(record);
        updateQueueProgress(record);
      }
      updatePlayerProgress(player, record);
    });

    player.addEventListener("timeupdate", () => {
      updatePlayerProgress(player, record);
      const now = Date.now();
      if (now - lastProgressSaveAt >= SAVE_INTERVAL_MS) {
        lastProgressSaveAt = now;
        persistPlayerState(player, record).catch(() => {});
      }
    });
    player.addEventListener("pause", () => persistPlayerState(player, record).catch(() => {}));
    player.addEventListener("ratechange", () => {
      rateSelect.value = String(player.playbackRate);
      localStorage.setItem(DEFAULT_RATE_KEY, String(player.playbackRate));
      persistPlayerState(player, record).catch(() => {});
    });
    player.addEventListener("ended", async () => {
      record.completed = true;
      record.currentTime = Number(player.duration) || record.currentTime;
      await persistPlayerState(player, record, true);
      setStatus("这一条看完啦！可以点“看完删除”把它从篮子里清掉。", "success");
      document.querySelector(".video-player-heading > div > span")?.replaceChildren(document.createTextNode("✅ 已看完"));
    });
    player.addEventListener("error", () => setStatus("这个视频格式暂时无法播放。优先使用 MP4（H.264/AAC）会最稳。", "error"));

    rateSelect.addEventListener("change", () => { player.playbackRate = Number(rateSelect.value) || 1; });
    document.getElementById("studyVideoBack")?.addEventListener("click", () => { player.currentTime = Math.max(0, player.currentTime - 10); });
    document.getElementById("studyVideoForward")?.addEventListener("click", () => { player.currentTime = Math.min(player.duration || Infinity, player.currentTime + 10); });
    document.getElementById("studyVideoFullscreen")?.addEventListener("click", async () => {
      try {
        if (player.requestFullscreen) await player.requestFullscreen();
        else if (player.webkitEnterFullscreen) player.webkitEnterFullscreen();
      } catch {}
    });
    document.getElementById("studyVideoDeleteActive")?.addEventListener("click", () => confirmDelete(record.id, record.name));
  }

  function updatePlayerProgress(player, record) {
    const current = Number(player.currentTime) || 0;
    const duration = Number(player.duration) || Number(record.duration) || 0;
    const text = document.getElementById("studyVideoProgressText");
    if (text) text.textContent = `${formatClock(current)} / ${duration ? formatClock(duration) : "--:--"}`;
    updateQueueProgress({ ...record, currentTime: current, duration });
  }

  function updateQueueProgress(record) {
    const item = document.querySelector(`.video-queue-item[data-video-id="${CSS.escape(record.id)}"]`);
    if (!item) return;
    const pct = progressOf(record);
    const bar = item.querySelector(".video-queue-progress i");
    const label = item.querySelector("em");
    if (bar) bar.style.width = `${pct}%`;
    if (label) label.textContent = record.completed || pct >= 99 ? "已看完" : pct > 0 ? `已看 ${pct}%` : "未开始";
    item.classList.toggle("is-completed", Boolean(record.completed || pct >= 99));
  }

  async function persistPlayerState(player, record, completed = false) {
    if (!player || !record) return;
    record.currentTime = Number(player.currentTime) || 0;
    record.duration = Number(player.duration) || Number(record.duration) || 0;
    record.playbackRate = Number(player.playbackRate) || 1;
    record.completed = completed || (record.duration > 0 && record.currentTime >= record.duration - 1);
    record.updatedAt = new Date().toISOString();
    await putVideo(record);
    updateQueueProgress(record);
  }

  async function importFiles(fileList) {
    const files = [...fileList].filter(file => file.type.startsWith("video/") || /\.(mp4|m4v|webm|mov)$/i.test(file.name));
    if (!files.length) {
      setStatus("没有识别到可导入的视频文件。", "error");
      return;
    }

    setStatus(`正在把 ${files.length} 条视频放进今日篮子…`);
    try {
      if (navigator.storage?.persist) navigator.storage.persist().catch(() => {});
      let firstId = "";
      for (const file of files) {
        const id = newId();
        if (!firstId) firstId = id;
        await putVideo({
          id,
          name: file.name,
          type: file.type || "video/mp4",
          size: file.size,
          blob: file.slice(0, file.size, file.type || "video/mp4"),
          addedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          currentTime: 0,
          duration: 0,
          playbackRate: Number(localStorage.getItem(DEFAULT_RATE_KEY) || 1),
          completed: false
        });
      }
      selectedVideoId = firstId;
      localStorage.setItem(ACTIVE_VIDEO_KEY, firstId);
      setStatus(`已导入 ${files.length} 条视频。今天只看这里，别去推荐页乱逛啦。`, "success");
      await refreshLibrary(pageGeneration);
    } catch (error) {
      const quota = error?.name === "QuotaExceededError" || /quota|空间|storage/i.test(error?.message || "");
      setStatus(quota ? "设备可用空间不足。先删除看完的视频，或换一个更小的视频再导入。" : `导入失败：${error.message || error}`, "error");
    }
  }

  function openFilePicker() {
    document.getElementById("studyVideoInput")?.click();
  }

  async function confirmDelete(id, name) {
    if (!confirm(`确定删除“${name}”吗？删除后不会进入回收站。`)) return;
    try {
      if (id === selectedVideoId) revokeActiveUrl();
      await deleteVideo(id);
      if (id === selectedVideoId) selectedVideoId = "";
      setStatus("视频已从这台设备删除。", "success");
      await refreshLibrary(pageGeneration);
    } catch (error) {
      setStatus(`删除失败：${error.message || error}`, "error");
    }
  }

  function bindVideoPageEvents() {
    document.getElementById("studyVideoImport")?.addEventListener("click", openFilePicker);
    document.getElementById("studyVideoEmptyImport")?.addEventListener("click", openFilePicker);
    document.getElementById("studyVideoInput")?.addEventListener("change", event => {
      const files = event.target.files;
      if (files?.length) importFiles(files);
      event.target.value = "";
    });
    document.getElementById("studyVideoQueue")?.addEventListener("click", event => {
      const button = event.target.closest("[data-video-action]");
      if (!button) return;
      const id = button.dataset.videoId;
      if (button.dataset.videoAction === "play") loadVideo(id, pageGeneration).catch(error => setStatus(error.message, "error"));
      if (button.dataset.videoAction === "delete") {
        const name = button.closest(".video-queue-item")?.querySelector("strong")?.textContent || "这条视频";
        confirmDelete(id, name);
      }
    });
  }

  function teardownPlayer() {
    const player = document.getElementById("studyVideoPlayer");
    if (player) {
      const id = selectedVideoId;
      getVideo(id).then(record => record && persistPlayerState(player, record)).catch(() => {});
      player.pause();
      player.removeAttribute("src");
      player.load();
    }
    revokeActiveUrl();
  }

  const originalRender = render;
  render = function renderWithVideoLibrary() {
    teardownPlayer();
    if (currentPage !== PAGE_ID) {
      originalRender();
      return;
    }

    pageGeneration += 1;
    const generation = pageGeneration;
    document.getElementById("app").innerHTML = renderVideoPage();
    bindVideoPageEvents();
    refreshLibrary(generation).catch(error => setStatus(`视频库打开失败：${error.message || error}`, "error"));
  };

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "hidden") return;
    const player = document.getElementById("studyVideoPlayer");
    if (!player || !selectedVideoId) return;
    getVideo(selectedVideoId).then(record => record && persistPlayerState(player, record)).catch(() => {});
  });

  setupNav();
  render();
})();
