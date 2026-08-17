const menuButton = document.getElementById("menuButton");
const sidebar = document.getElementById("sidebar");
const brandToggle = document.getElementById("brandToggle");
const reopenSidebar = document.getElementById("reopenSidebar");

function isMobileLayout() {
  return window.matchMedia("(max-width: 1440px)").matches;
}
function setSidebarCollapsed(collapsed) {
  if (!sidebar || !brandToggle || !reopenSidebar) return;
  document.body.classList.toggle("sidebar-collapsed", collapsed);
  brandToggle.setAttribute("aria-expanded", String(!collapsed));
  reopenSidebar.setAttribute("aria-expanded", String(!collapsed));
  brandToggle.setAttribute("aria-label", collapsed ? "サイドバーを開く" : "サイドバーを閉じる");
  reopenSidebar.setAttribute("aria-label", collapsed ? "サイドバーを開く" : "サイドバーを閉じる");
}
function setMobileSidebarOpen(open) {
  document.body.classList.toggle("menu-open", open);
  menuButton?.setAttribute("aria-expanded", String(open));
  menuButton?.setAttribute("aria-label", open ? "サイドバーを閉じる" : "サイドバーを開く");
  reopenSidebar?.setAttribute("aria-expanded", String(open));
  reopenSidebar?.setAttribute("aria-label", open ? "サイドバーを閉じる" : "サイドバーを開く");
  brandToggle?.setAttribute("aria-expanded", String(open));
}

function closeMobileSidebar() {
  setMobileSidebarOpen(false);
}

brandToggle?.addEventListener("click", (event) => {
  if (isMobileLayout()) {
    event.preventDefault();
    event.stopPropagation();
    closeMobileSidebar();
    return;
  }
  setSidebarCollapsed(true);
});

reopenSidebar?.addEventListener("click", () => {
  if (isMobileLayout()) {
    setMobileSidebarOpen(!document.body.classList.contains("menu-open"));
    return;
  }
  setSidebarCollapsed(false);
});

menuButton?.addEventListener("click", () => {
  setMobileSidebarOpen(!document.body.classList.contains("menu-open"));
});

sidebar?.addEventListener("click", (event) => {
  if (event.target.closest("a") && isMobileLayout()) closeMobileSidebar();
});

window.addEventListener("resize", () => {
  if (isMobileLayout()) {
    document.body.classList.remove("sidebar-collapsed");
  } else {
    closeMobileSidebar();
  }
});

    const navLinks = [...document.querySelectorAll(".nav a")];

    navLinks.forEach((link) => {
      link.addEventListener("click", (event) => {
        navLinks.forEach((item) => item.classList.remove("is-selected"));
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
    });

    document.addEventListener("click", (event) => {
      const clickedOutside =
        document.body.classList.contains("menu-open") &&
        sidebar && menuButton && !sidebar.contains(event.target) &&
        !menuButton.contains(event.target) &&
        !reopenSidebar?.contains(event.target);

      if (clickedOutside) {
        closeMobileSidebar();
      }
    });
