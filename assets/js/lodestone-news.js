
(() => {
  const viewport = document.querySelector("#newsCarousel .news-viewport");
  const dotsWrap = document.querySelector("#newsCarousel .news-dots");
  const prev = document.getElementById("newsPrev");
  const next = document.getElementById("newsNext");
  const carousel = document.getElementById("newsCarousel");
  const updated = document.getElementById("newsUpdatedAt");
  if (!viewport || !dotsWrap || !prev || !next || !carousel) return;

  let slides = [];
  let dots = [];
  let current = 0;
  let timer = null;

  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[c]));

  function refreshRefs() {
    slides = [...viewport.querySelectorAll(".news-slide")];
    dots = [...dotsWrap.querySelectorAll(".news-dot")];
  }

  function show(index) {
    if (!slides.length) return;
    current = (index + slides.length) % slides.length;
    slides.forEach((s, i) => s.classList.toggle("is-active", i === current));
    dots.forEach((d, i) => d.classList.toggle("is-active", i === current));
  }

  function start() {
    window.clearInterval(timer);
    if (slides.length > 1) timer = window.setInterval(() => show(current + 1), 5500);
  }

  function bind() {
    prev.onclick = () => { show(current - 1); start(); };
    next.onclick = () => { show(current + 1); start(); };
    dots.forEach((d, i) => d.onclick = () => { show(i); start(); });
    carousel.onmouseenter = () => window.clearInterval(timer);
    carousel.onmouseleave = start;
    carousel.onfocusin = () => window.clearInterval(timer);
    carousel.onfocusout = start;
    start();
  }

  function render(data) {
    if (!data || !Array.isArray(data.items) || !data.items.length) return;
    viewport.innerHTML = data.items.map((n, i) => `
      <article class="news-slide ${i===0 ? "is-active" : ""}" data-index="${i}">
        <div class="news-meta">
          <time class="news-date">${esc(n.date || "更新")}</time>
          <span class="news-badge">${esc(n.badge || "INFO")}</span>
        </div>
        <h4 class="news-slide-title">${esc(n.title)}</h4>
        <p class="news-summary">${esc(n.summary || "公式Lodestoneで詳細を確認できます。")}</p>
        <a class="news-readmore" href="${esc(n.url)}" target="_blank" rel="noopener noreferrer">公式で続きを読む →</a>
      </article>
    `).join("");
    dotsWrap.innerHTML = data.items.map((_, i) =>
      `<button class="news-dot ${i===0 ? "is-active" : ""}" type="button" data-slide="${i}" aria-label="${i+1}件目"></button>`
    ).join("");
    if (updated && data.updated_at) {
      try {
        const dt = new Date(data.updated_at);
        updated.textContent = `最終確認 ${dt.toLocaleString("ja-JP", {timeZone:"Asia/Tokyo"})}`;
      } catch (_) {}
    }
    current = 0;
    refreshRefs();
    bind();
  }

  refreshRefs();
  bind();

  fetch("./assets/data/lodestone-news.json", {cache:"no-store"})
    .then(r => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    })
    .then(render)
    .catch(err => console.warn("Lodestone news fallback is being used:", err));
})();
