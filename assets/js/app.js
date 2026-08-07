"use strict";

const DATA_PATHS = {
  news: "./assets/data/news.json",
  tools: "./assets/data/tools.json",
};

const state = {
  news: [],
  tools: [],
  currentNews: 0,
  newsTimer: null,
};

const qs = (selector, root = document) => root.querySelector(selector);
const qsa = (selector, root = document) => [...root.querySelectorAll(selector)];

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDate(dateValue) {
  if (!dateValue) return "";
  const d = new Date(dateValue);
  if (Number.isNaN(d.getTime())) return dateValue;
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

async function loadJson(path) {
  const response = await fetch(`${path}?v=${Date.now()}`, { cache: "no-store" });
  if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
  return response.json();
}

function setupSidebar() {
  const menuButton = qs("#menuButton");
  const sidebar = qs("#sidebar");
  const brandToggle = qs("#brandToggle");
  const reopenSidebar = qs("#reopenSidebar");

  if (!sidebar) return;

  function setSidebarCollapsed(collapsed) {
    document.body.classList.toggle("sidebar-collapsed", collapsed);
    brandToggle?.setAttribute("aria-expanded", String(!collapsed));
    reopenSidebar?.setAttribute("aria-expanded", String(!collapsed));
    brandToggle?.setAttribute("aria-label", collapsed ? "サイドバーを開く" : "サイドバーを閉じる");
  }

  brandToggle?.addEventListener("click", () => {
    if (window.innerWidth <= 980) {
      document.body.classList.remove("menu-open");
      menuButton?.setAttribute("aria-expanded", "false");
      return;
    }
    setSidebarCollapsed(true);
  });

  reopenSidebar?.addEventListener("click", () => setSidebarCollapsed(false));

  menuButton?.addEventListener("click", () => {
    const isOpen = document.body.classList.toggle("menu-open");
    menuButton.setAttribute("aria-expanded", String(isOpen));
  });

  sidebar.addEventListener("click", (event) => {
    const link = event.target.closest("a");
    if (!link) return;

    if (window.innerWidth <= 980) {
      document.body.classList.remove("menu-open");
      menuButton?.setAttribute("aria-expanded", "false");
    }

    qsa(".nav a").forEach((item) => item.classList.remove("is-selected"));
    link.classList.add("is-selected");

    const rect = link.getBoundingClientRect();
    const ripple = document.createElement("span");
    ripple.className = "nav-ripple";
    ripple.style.left = `${event.clientX - rect.left}px`;
    ripple.style.top = `${event.clientY - rect.top}px`;
    link.appendChild(ripple);

    link.classList.remove("click-flash");
    void link.offsetWidth;
    link.classList.add("click-flash");

    window.setTimeout(() => ripple.remove(), 700);
    window.setTimeout(() => link.classList.remove("click-flash"), 600);
  });

  document.addEventListener("click", (event) => {
    const clickedOutside =
      document.body.classList.contains("menu-open") &&
      !sidebar.contains(event.target) &&
      !menuButton?.contains(event.target);

    if (clickedOutside) {
      document.body.classList.remove("menu-open");
      menuButton?.setAttribute("aria-expanded", "false");
    }
  });
}

function newsSlideTemplate(item, index) {
  const badge = escapeHtml(item.badge || item.source || "INFO");
  return `
    <article class="news-slide${index === 0 ? " is-active" : ""}" data-index="${index}">
      <div class="news-meta">
        <time class="news-date">${escapeHtml(formatDate(item.publishedAt))}</time>
        <span class="news-badge">${badge}</span>
      </div>
      <h4 class="news-slide-title">${escapeHtml(item.title)}</h4>
      <p class="news-summary">${escapeHtml(item.summary || "公式サイトで詳細をご確認ください。")}</p>
      <a class="news-readmore" href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer">続きを読む →</a>
    </article>
  `;
}

function renderNews(newsData) {
  const viewport = qs("#newsViewport");
  const controls = qs("#newsControls");
  const dots = qs("#newsDots");
  if (!viewport || !controls || !dots) return;

  state.news = Array.isArray(newsData.items) ? newsData.items.slice(0, 6) : [];
  state.currentNews = 0;

  if (!state.news.length) {
    viewport.innerHTML = '<div class="data-error">最新情報を取得できませんでした。</div>';
    controls.hidden = true;
    return;
  }

  viewport.innerHTML = state.news.map(newsSlideTemplate).join("");
  dots.innerHTML = state.news
    .map((_, i) => `<button class="news-dot${i === 0 ? " is-active" : ""}" type="button" data-slide="${i}" aria-label="${i + 1}件目"></button>`)
    .join("");
  controls.hidden = state.news.length <= 1;

  qsa(".news-dot", dots).forEach((dot) => {
    dot.addEventListener("click", () => {
      showNews(Number(dot.dataset.slide));
      startNewsAutoPlay();
    });
  });

  startNewsAutoPlay();
}

function showNews(nextIndex) {
  if (!state.news.length) return;

  const slides = qsa(".news-slide");
  const dots = qsa(".news-dot");
  const oldIndex = state.currentNews;
  const next = (nextIndex + slides.length) % slides.length;
  if (oldIndex === next) return;

  const oldSlide = slides[oldIndex];
  const newSlide = slides[next];

  oldSlide?.classList.add("is-leaving");
  oldSlide?.classList.remove("is-active");
  newSlide?.classList.remove("is-leaving");
  newSlide?.classList.add("is-active");

  dots.forEach((dot, i) => dot.classList.toggle("is-active", i === next));
  state.currentNews = next;

  window.setTimeout(() => oldSlide?.classList.remove("is-leaving"), 450);
}

function startNewsAutoPlay() {
  window.clearInterval(state.newsTimer);
  if (state.news.length <= 1) return;
  state.newsTimer = window.setInterval(() => showNews(state.currentNews + 1), 5500);
}

function toolStatusLabel(status) {
  if (status === "NEW") return "NEW";
  if (status === "UPDATE") return "UPDATE";
  return "";
}

function recentToolTemplate(tool) {
  const status = toolStatusLabel(tool.status);
  const href = tool.enabled && tool.path ? tool.path : "#";
  const disabled = !tool.enabled;
  return `
    <a class="recent-tool-item${disabled ? " is-disabled" : ""}"
       href="${escapeHtml(href)}"
       ${disabled ? 'aria-disabled="true"' : ""}>
      <div class="recent-tool-icon">${escapeHtml(tool.icon || "◇")}</div>
      <div class="recent-tool-copy">
        <div class="recent-tool-meta">
          <span class="recent-tool-badge${status === "NEW" ? " new" : ""}">${escapeHtml(status || "INFO")}</span>
          <time>${escapeHtml(formatDate(tool.updatedAt))}</time>
        </div>
        <h4>${escapeHtml(tool.name)}</h4>
        <p>${escapeHtml(tool.updateNote || tool.description || "")}</p>
      </div>
      <span class="recent-tool-arrow">${disabled ? "—" : "→"}</span>
    </a>
  `;
}

function toolCardTemplate(tool) {
  const disabled = !tool.enabled;
  const href = tool.enabled && tool.path ? tool.path : "#";
  return `
    <a class="tool-card${disabled ? " disabled" : ""}"
       href="${escapeHtml(href)}"
       ${disabled ? 'aria-disabled="true"' : ""}>
      <div>
        <div class="tool-top">
          <span class="tool-icon">${escapeHtml(tool.icon || "◇")}</span>
          <span class="tool-category">${escapeHtml(tool.category || "UTILITY")}</span>
        </div>
        <h4 class="tool-name">${escapeHtml(tool.name)}</h4>
        <p class="tool-description">${escapeHtml(tool.description || "")}</p>
      </div>
      <span class="tool-arrow">${disabled ? "準備中" : "ツールを開く →"}</span>
    </a>
  `;
}

function renderTools(toolsData) {
  const list = qs("#toolList");
  const recent = qs("#recentToolList");
  const count = qs("#toolCount");
  if (!list || !recent) return;

  state.tools = Array.isArray(toolsData.tools) ? toolsData.tools : [];
  const visible = state.tools.filter((tool) => tool.visible !== false);

  list.innerHTML = visible.length
    ? visible.map(toolCardTemplate).join("")
    : '<div class="data-error">登録されているツールはありません。</div>';

  const recentTools = visible
    .filter((tool) => tool.status === "NEW" || tool.status === "UPDATE")
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .slice(0, 3);

  recent.innerHTML = recentTools.length
    ? recentTools.map(recentToolTemplate).join("")
    : '<div class="data-empty">最近の新規・更新ツールはありません。</div>';

  if (count) count.textContent = `登録数 ${visible.length}`;

  document.addEventListener("click", (event) => {
    const disabled = event.target.closest('[aria-disabled="true"]');
    if (disabled) event.preventDefault();
  }, { once: true });
}

async function initData() {
  try {
    const [news, tools] = await Promise.all([
      loadJson(DATA_PATHS.news),
      loadJson(DATA_PATHS.tools),
    ]);
    renderNews(news);
    renderTools(tools);
  } catch (error) {
    console.error(error);
    qs("#newsViewport")?.replaceChildren(Object.assign(document.createElement("div"), {
      className: "data-error",
      textContent: "データを読み込めませんでした。ページを再読み込みしてください。",
    }));
  }
}

document.addEventListener("DOMContentLoaded", () => {
  setupSidebar();

  qs("#newsPrev")?.addEventListener("click", () => {
    showNews(state.currentNews - 1);
    startNewsAutoPlay();
  });

  qs("#newsNext")?.addEventListener("click", () => {
    showNews(state.currentNews + 1);
    startNewsAutoPlay();
  });

  const carousel = qs("#newsCarousel");
  carousel?.addEventListener("mouseenter", () => window.clearInterval(state.newsTimer));
  carousel?.addEventListener("mouseleave", startNewsAutoPlay);
  carousel?.addEventListener("focusin", () => window.clearInterval(state.newsTimer));
  carousel?.addEventListener("focusout", startNewsAutoPlay);

  initData();
});
