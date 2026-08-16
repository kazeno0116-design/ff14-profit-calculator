/* V163: real page navigations start at the top. Same-document tabs/accordions are untouched.
   Cross-page hash links keep their intentional section target (e.g. glossary term links). */
if ("scrollRestoration" in history) history.scrollRestoration="manual";
window.addEventListener("pageshow",()=>{
  if(!location.hash) window.scrollTo({top:0,left:0,behavior:"auto"});
});

document.addEventListener("focusin",e=>{const t=e.target;if(t.matches("input[type=number],input[type=text],textarea")) requestAnimationFrame(()=>t.select?.());});

document.addEventListener("DOMContentLoaded",()=>{
  /* V176: turn the existing hierarchy text into an accessible breadcrumb.
     Parent levels use the already-defined sidebar destinations, so installed
     app users can return without relying on browser history controls. */
  const crumb=document.querySelector(".crumb");
  if(crumb){
    const labels=crumb.textContent
      .split("/")
      .map(label=>label.trim())
      .filter((label,index,all)=>label && label!==all[index-1]);
    const navLinks=[...document.querySelectorAll(".sidebar .nav a")];
    const hrefFor=label=>navLinks.find(link=>{
      const text=link.querySelector("span:last-child")?.textContent.trim();
      return text===label;
    })?.getAttribute("href");

    crumb.setAttribute("role","navigation");
    crumb.setAttribute("aria-label","現在位置");
    crumb.replaceChildren();

    labels.forEach((label,index)=>{
      const isCurrent=index===labels.length-1;
      const item=document.createElement("span");
      item.className="crumb-item";

      if(!isCurrent){
        const href=hrefFor(label);
        if(href){
          const link=document.createElement("a");
          link.href=href;
          link.textContent=label;
          item.appendChild(link);
        }else{
          item.textContent=label;
        }
      }else{
        item.classList.add("is-current");
        item.setAttribute("aria-current","page");
        item.textContent=label;
      }

      crumb.appendChild(item);
    });
  }

  /* The home page has its own sidebar controller (assets/js/pages/index.js).
     Do not initialize the generic controller there: doing both creates a second
     toggle inside the brand area and changes the established home-sidebar layout. */
  if(document.getElementById("brandToggle") && document.getElementById("menuButton")) return;

  const sidebar=document.querySelector(".sidebar");
  const layout=document.querySelector(".layout");
  if(!sidebar||!layout)return;

  sidebar.id ||= "sidebar";
  const brand=sidebar.querySelector(".brand");

  let brandToggle=brand?.querySelector(".portal-brand-toggle");
  if(brand && !brandToggle){
    brandToggle=document.createElement("button");
    brandToggle.type="button";
    brandToggle.className="portal-brand-toggle";
    brandToggle.setAttribute("aria-controls",sidebar.id);
    brandToggle.setAttribute("aria-expanded","true");
    brandToggle.setAttribute("aria-label","サイドバーを閉じる");
    brand.insertBefore(brandToggle,brand.firstChild);
  }

  let reopenSidebar=document.querySelector(".portal-reopen-sidebar");
  if(!reopenSidebar){
    reopenSidebar=document.createElement("button");
    reopenSidebar.type="button";
    reopenSidebar.className="portal-reopen-sidebar";
    reopenSidebar.setAttribute("aria-controls",sidebar.id);
    reopenSidebar.setAttribute("aria-expanded","false");
    reopenSidebar.setAttribute("aria-label","サイドバーを開く");
    document.body.insertBefore(reopenSidebar,layout);
  }

  const isMobile=()=>matchMedia("(max-width:900px)").matches;
  const setCollapsed=(collapsed)=>{
    if(isMobile()) return;
    document.body.classList.toggle("portal-sidebar-collapsed",collapsed);
    brandToggle?.setAttribute("aria-expanded",String(!collapsed));
    reopenSidebar.setAttribute("aria-expanded",String(!collapsed));
    brandToggle?.setAttribute("aria-label",collapsed?"サイドバーを開く":"サイドバーを閉じる");
    reopenSidebar.setAttribute("aria-label",collapsed?"サイドバーを開く":"サイドバーを閉じる");
  };

  brandToggle?.addEventListener("click",()=>{
    if(isMobile()){
      document.body.classList.remove("mobile-nav-open");
    }else{
      setCollapsed(true);
    }
  });

  reopenSidebar.addEventListener("click",()=>{
    if(isMobile()){
      document.body.classList.add("mobile-nav-open");
    }else{
      setCollapsed(false);
    }
  });

  let mobileToggle=document.querySelector(".mobile-menu-toggle");
  if(!mobileToggle){
    mobileToggle=document.createElement("button");
    mobileToggle.className="mobile-menu-toggle portal-square-toggle";
    mobileToggle.type="button";
    mobileToggle.setAttribute("aria-label","サイドバーを開く");
    mobileToggle.innerHTML="<span class='portal-square-glyph' aria-hidden='true'></span>";
    document.body.appendChild(mobileToggle);
  }
  const overlay=document.createElement("div");
  overlay.className="mobile-nav-overlay";
  document.body.appendChild(overlay);
  const closeMobile=()=>document.body.classList.remove("mobile-nav-open");
  mobileToggle.addEventListener("click",()=>document.body.classList.add("mobile-nav-open"));
  overlay.addEventListener("click",closeMobile);
  document.querySelectorAll(".sidebar a").forEach(a=>a.addEventListener("click",closeMobile));

  // V125: legacy sidebar navigation selection/click effects.
  const navLinks=[...document.querySelectorAll(".sidebar .nav a")];
  navLinks.forEach(link=>{
    link.addEventListener("click",event=>{
      navLinks.forEach(item=>item.classList.remove("is-selected"));
      link.classList.add("is-selected");

      const rect=link.getBoundingClientRect();
      const ripple=document.createElement("span");
      ripple.className="nav-ripple";
      ripple.style.left=`${event.clientX-rect.left}px`;
      ripple.style.top=`${event.clientY-rect.top}px`;
      link.appendChild(ripple);

      link.classList.remove("click-flash");
      void link.offsetWidth;
      link.classList.add("click-flash");

      window.setTimeout(()=>ripple.remove(),700);
      window.setTimeout(()=>link.classList.remove("click-flash"),600);
    });
  });

  document.addEventListener("keydown",e=>{
    if(e.key!=="Escape")return;
    closeMobile();
    if(!isMobile())setCollapsed(false);
  });
  window.addEventListener("resize",()=>{
    if(isMobile()){
      document.body.classList.remove("portal-sidebar-collapsed");
    }else{
      closeMobile();
    }
  });
});
