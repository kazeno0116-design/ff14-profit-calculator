document.addEventListener("focusin",e=>{const t=e.target;if(t.matches("input[type=number],input[type=text],textarea")) requestAnimationFrame(()=>t.select?.());});

document.addEventListener("DOMContentLoaded",()=>{
  const sidebar=document.querySelector(".sidebar");
  const layout=document.querySelector(".layout");
  if(!sidebar||!layout)return;

  const desktopToggle=document.createElement("button");
  desktopToggle.type="button";
  desktopToggle.className="portal-desktop-sidebar-toggle portal-square-toggle";
  desktopToggle.setAttribute("aria-label","サイドバーを閉じる");
  desktopToggle.setAttribute("aria-expanded","true");
  desktopToggle.innerHTML="<span class='portal-square-glyph' aria-hidden='true'></span>";
  document.body.appendChild(desktopToggle);

  const setDesktopCollapsed=(collapsed)=>{
    document.body.classList.toggle("portal-sidebar-collapsed",collapsed);
    desktopToggle.setAttribute("aria-expanded",String(!collapsed));
    desktopToggle.setAttribute("aria-label",collapsed?"サイドバーを開く":"サイドバーを閉じる");
  };
  desktopToggle.addEventListener("click",()=>setDesktopCollapsed(!document.body.classList.contains("portal-sidebar-collapsed")));

  const mobileToggle=document.createElement("button");
  mobileToggle.className="mobile-menu-toggle portal-square-toggle";
  mobileToggle.type="button";
  mobileToggle.setAttribute("aria-label","サイドバーを開く");
  mobileToggle.innerHTML="<span class='portal-square-glyph' aria-hidden='true'></span>";
  document.body.appendChild(mobileToggle);

  let inside=sidebar.querySelector(".sidebar-mobile-close");
  if(!inside){
    inside=document.createElement("button");
    inside.type="button";
    inside.className="sidebar-mobile-close portal-square-toggle";
    inside.setAttribute("aria-label","サイドバーを閉じる");
    inside.innerHTML="<span class='portal-square-glyph' aria-hidden='true'></span>";
    sidebar.insertBefore(inside,sidebar.firstChild);
  }

  const overlay=document.createElement("div");
  overlay.className="mobile-nav-overlay";
  document.body.appendChild(overlay);

  const closeMobile=()=>document.body.classList.remove("mobile-nav-open");
  const openMobile=()=>document.body.classList.add("mobile-nav-open");

  mobileToggle.addEventListener("click",openMobile);
  inside.addEventListener("click",closeMobile);
  overlay.addEventListener("click",closeMobile);
  document.querySelectorAll(".sidebar a").forEach(a=>a.addEventListener("click",closeMobile));
  document.addEventListener("keydown",e=>{if(e.key==="Escape"){closeMobile();setDesktopCollapsed(false)}});
  window.addEventListener("resize",()=>{
    if(matchMedia("(max-width:900px)").matches){
      setDesktopCollapsed(false);
    }else{
      closeMobile();
    }
  });
});
