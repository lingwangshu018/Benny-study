// Benny Study homepage hero v0.1
(function () {
  const imageCandidates = [
    "public/images/home/hero-banner.png",
    "public/home/hero-banner.png",
    "assets/illustrations/hero-banner.png",
    "images/hero-banner.png"
  ];

  function greeting() {
    const hour = new Date().getHours();
    if (hour < 11) return "早上好，小宝。";
    if (hour < 18) return "下午好，小宝。";
    return "晚上好，小宝。";
  }

  function heroPicture() {
    const sources = imageCandidates.map((src, index) =>
      `<img class="hero-art${index ? " hero-art-fallback" : ""}" src="${src}" alt="兔兔和小狮子在温馨书房学习的插画" data-index="${index}">`
    ).join("");
    return `<div class="hero-art-frame">${sources}<div class="hero-art-placeholder">🐰📚🦁</div></div>`;
  }

  window.hero = function hero() {
    const exam = nextExam();
    const days = Math.max(0, daysUntil(exam.date));
    return `<section class="hero hero-home-v01">
      <div class="hero-copy">
        <span class="badge hero-badge">🌸 每天，都离梦想近一点</span>
        <h1>${greeting()}</h1>
        <p>今天不用一下子变得很厉害，只要把安排好的这一小段路认真走完。晚上仍然只留给错题，哥哥记得。</p>
        <div class="hero-actions">
          <button class="hero-primary" data-page="today" type="button">开始今天学习</button>
          <button class="hero-secondary" data-page="plan" type="button">查看每日计划</button>
        </div>
        <div class="hero-mini-notes">
          <span>📚 今日任务自动读取</span>
          <span>🌙 晚间只做错题</span>
        </div>
      </div>
      <div class="hero-visual">
        ${heroPicture()}
        <div class="countdown countdown-v01">
          <small>${esc(exam.name)}</small>
          <b>${days}<em>天</em></b>
          <span>${exam.date}</span>
        </div>
      </div>
    </section>`;
  };

  document.addEventListener("error", event => {
    const img = event.target;
    if (!(img instanceof HTMLImageElement) || !img.classList.contains("hero-art")) return;
    img.style.display = "none";
    const index = Number(img.dataset.index || 0);
    const next = img.parentElement?.querySelector(`.hero-art[data-index="${index + 1}"]`);
    if (next) next.style.display = "block";
  }, true);
})();
