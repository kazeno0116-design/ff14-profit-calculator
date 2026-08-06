const menuButton = document.getElementById("menuButton");
    const sidebar = document.getElementById("sidebar");
    const brandToggle = document.getElementById("brandToggle");
    const reopenSidebar = document.getElementById("reopenSidebar");

    function setSidebarCollapsed(collapsed) {
      document.body.classList.toggle("sidebar-collapsed", collapsed);
      brandToggle.setAttribute("aria-expanded", String(!collapsed));
      reopenSidebar.setAttribute("aria-expanded", String(!collapsed));
      brandToggle.setAttribute("aria-label", collapsed ? "サイドバーを開く" : "サイドバーを閉じる");
    }

    brandToggle.addEventListener("click", () => {
      if (window.innerWidth <= 980) {
        document.body.classList.remove("menu-open");
        menuButton.setAttribute("aria-expanded", "false");
        return;
      }
      setSidebarCollapsed(true);
    });

    reopenSidebar.addEventListener("click", () => {
      setSidebarCollapsed(false);
    });

    menuButton.addEventListener("click", () => {
      const isOpen = document.body.classList.toggle("menu-open");
      menuButton.setAttribute("aria-expanded", String(isOpen));
    });

    sidebar.addEventListener("click", (event) => {
      if (event.target.closest("a") && window.innerWidth <= 980) {
        document.body.classList.remove("menu-open");
        menuButton.setAttribute("aria-expanded", "false");
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

    const newsSlides = [...document.querySelectorAll(".news-slide")];
    const newsDots = [...document.querySelectorAll(".news-dot")];
    const newsPrev = document.getElementById("newsPrev");
    const newsNext = document.getElementById("newsNext");
    const newsCarousel = document.getElementById("newsCarousel");

    let currentNews = 0;
    let newsTimer;

    function showNews(nextIndex) {
      const oldIndex = currentNews;
      currentNews = (nextIndex + newsSlides.length) % newsSlides.length;

      if (oldIndex === currentNews) return;

      const oldSlide = newsSlides[oldIndex];
      const newSlide = newsSlides[currentNews];

      oldSlide.classList.add("is-leaving");
      oldSlide.classList.remove("is-active");

      newSlide.classList.remove("is-leaving");
      newSlide.classList.add("is-active");

      newsDots.forEach((dot, index) => {
        dot.classList.toggle("is-active", index === currentNews);
      });

      window.setTimeout(() => oldSlide.classList.remove("is-leaving"), 450);
    }

    function startNewsAutoPlay() {
      window.clearInterval(newsTimer);
      newsTimer = window.setInterval(() => {
        showNews(currentNews + 1);
      }, 5500);
    }

    newsPrev.addEventListener("click", () => {
      showNews(currentNews - 1);
      startNewsAutoPlay();
    });

    newsNext.addEventListener("click", () => {
      showNews(currentNews + 1);
      startNewsAutoPlay();
    });

    newsDots.forEach((dot) => {
      dot.addEventListener("click", () => {
        showNews(Number(dot.dataset.slide));
        startNewsAutoPlay();
      });
    });

    newsCarousel.addEventListener("mouseenter", () => window.clearInterval(newsTimer));
    newsCarousel.addEventListener("mouseleave", startNewsAutoPlay);
    newsCarousel.addEventListener("focusin", () => window.clearInterval(newsTimer));
    newsCarousel.addEventListener("focusout", startNewsAutoPlay);

    startNewsAutoPlay();

    document.addEventListener("click", (event) => {
      const clickedOutside =
        document.body.classList.contains("menu-open") &&
        !sidebar.contains(event.target) &&
        !menuButton.contains(event.target);

      if (clickedOutside) {
        document.body.classList.remove("menu-open");
        menuButton.setAttribute("aria-expanded", "false");
      }
    });
