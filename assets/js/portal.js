document.addEventListener("focusin",e=>{const t=e.target;if(t.matches("input[type=number],input[type=text],textarea")) requestAnimationFrame(()=>t.select?.());});
document.addEventListener("DOMContentLoaded",()=>{
  const sidebar=document.querySelector(".sidebar");
  if(!sidebar) return;
  if(!document.querySelector(".mobile-menu-toggle")){
    const b=document.createElement("button");
    b.className="mobile-menu-toggle portal-square-toggle"; b.type="button"; b.setAttribute("aria-label","サイドバーを開く");
    b.innerHTML="<span class='portal-square-glyph' aria-hidden='true'></span>";
    document.body.appendChild(b);

    let inside=sidebar.querySelector(".sidebar-mobile-close");
    if(!inside){
      inside=document.createElement("button");
      inside.type="button";
      inside.className="sidebar-mobile-close portal-square-toggle";
      inside.setAttribute("aria-label","サイドバーを閉じる");
      inside.innerHTML="<span class='portal-square-glyph' aria-hidden='true'></span>";
      sidebar.insertBefore(inside,sidebar.firstChild);
    }

    const o=document.createElement("div");o.className="mobile-nav-overlay";document.body.appendChild(o);
    const close=()=>{document.body.classList.remove("mobile-nav-open");b.setAttribute("aria-label","サイドバーを開く")};
    const open=()=>{document.body.classList.add("mobile-nav-open");b.setAttribute("aria-label","サイドバーを閉じる")};
    b.addEventListener("click",open);
    inside.addEventListener("click",close);
    o.addEventListener("click",close);
    document.querySelectorAll(".sidebar a").forEach(a=>a.addEventListener("click",close));
    addEventListener("keydown",e=>{if(e.key==="Escape")close()});
  }
});
