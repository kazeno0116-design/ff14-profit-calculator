const CLASS_DETAILS={"採掘師": ["鉱石・石材などを採集します。", ["精選", "コスモエクスプローラー"]], "園芸師": ["木材・草・食材などを採集します。", ["精選", "コスモエクスプローラー"]], "漁師": ["魚介類を釣り上げる採集ジョブです。", ["魚逆引き", "コスモエクスプローラー"]]};
const CLASS_LINKS={"必要素材逆算": "materials/index.html", "クラフターマクロ生成器": "macro/index.html", "製作利益目標計算機": "gil/index.html", "装備更新": "gear/index.html", "精選": "aetherial-reduction/index.html", "コスモエクスプローラー": "cosmic/index.html", "魚逆引き": "fishing/index.html"};

(()=>{
 const panel=document.getElementById("gathererClassDetail");
 document.querySelectorAll(".class-detail-trigger").forEach(btn=>btn.addEventListener("click",()=>{
   const d=CLASS_DETAILS[btn.dataset.class]; if(!d||!panel)return;
   document.querySelectorAll(".class-detail-trigger").forEach(b=>b.classList.toggle("active",b===btn));
   const img=btn.querySelector("img")?.getAttribute("src")||"";
   panel.innerHTML=`<div class="class-detail-head"><img src="${img}" alt=""><div><h3>${btn.dataset.class}</h3><p>${d[0]}</p></div></div>
   <div class="class-related-links">${d[1].map(x=>`<a href="${CLASS_LINKS[x]}">${x} →</a>`).join("")}</div>`;
 }));
})();