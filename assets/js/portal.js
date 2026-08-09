document.addEventListener("focusin",e=>{const t=e.target;if(t.matches("input[type=number],input[type=text],textarea")) requestAnimationFrame(()=>t.select?.());});
document.addEventListener("DOMContentLoaded",()=>{
  if(!document.querySelector(".sidebar")) return;
  if(!document.querySelector(".mobile-menu-toggle")){
    const b=document.createElement("button");
    b.className="mobile-menu-toggle"; b.type="button"; b.setAttribute("aria-label","メニューを開く");
    b.innerHTML="<span aria-hidden='true'>☰</span><span>メニュー</span>";
    document.body.appendChild(b);
    const o=document.createElement("div");o.className="mobile-nav-overlay";document.body.appendChild(o);
    const close=()=>{document.body.classList.remove("mobile-nav-open");b.setAttribute("aria-label","メニューを開く")};
    b.addEventListener("click",()=>{const open=document.body.classList.toggle("mobile-nav-open");b.setAttribute("aria-label",open?"メニューを閉じる":"メニューを開く")});
    o.addEventListener("click",close);
    document.querySelectorAll(".sidebar a").forEach(a=>a.addEventListener("click",close));
    addEventListener("keydown",e=>{if(e.key==="Escape")close()});
  }
});
