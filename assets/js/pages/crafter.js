const CLASS_DETAILS={"木工師": ["木材を使う武器・道具・家具などを製作。", ["必要素材逆算", "クラフターマクロ生成器", "製作利益目標計算機", "装備更新"]], "鍛冶師": ["金属を使う武器・道具などを製作。", ["必要素材逆算", "クラフターマクロ生成器", "製作利益目標計算機", "装備更新"]], "甲冑師": ["金属製の防具や一部装備を製作。", ["必要素材逆算", "クラフターマクロ生成器", "製作利益目標計算機", "装備更新"]], "彫金師": ["アクセサリや宝飾品、一部武器などを製作。", ["必要素材逆算", "クラフターマクロ生成器", "製作利益目標計算機", "装備更新"]], "革細工師": ["革素材を使う防具や装備を製作。", ["必要素材逆算", "クラフターマクロ生成器", "製作利益目標計算機", "装備更新"]], "裁縫師": ["布素材を使う防具や衣装を製作。", ["必要素材逆算", "クラフターマクロ生成器", "製作利益目標計算機", "装備更新"]], "錬金術師": ["薬品・素材・一部武器などを製作。", ["必要素材逆算", "クラフターマクロ生成器", "製作利益目標計算機", "装備更新"]], "調理師": ["食事効果を持つ料理などを製作。", ["必要素材逆算", "クラフターマクロ生成器", "製作利益目標計算機", "装備更新"]]};
const CLASS_LINKS={"必要素材逆算": "materials/index.html", "クラフターマクロ生成器": "macro/index.html", "製作利益目標計算機": "gil/index.html", "装備更新": "gear/index.html", "精選": "aetherial-reduction/index.html", "魚逆引き": "fishing/index.html"};

(()=>{
 const panel=document.getElementById("crafterClassDetail");
 document.querySelectorAll(".class-detail-trigger").forEach(btn=>btn.addEventListener("click",()=>{
   const d=CLASS_DETAILS[btn.dataset.class]; if(!d||!panel)return;
   document.querySelectorAll(".class-detail-trigger").forEach(b=>b.classList.toggle("active",b===btn));
   const img=btn.querySelector("img")?.getAttribute("src")||"";
   panel.innerHTML=`<div class="class-detail-head"><img src="${img}" alt=""><div><h3>${btn.dataset.class}</h3><p>${d[0]}</p></div></div>
   <div class="class-related-links">${d[1].map(x=>`<a href="${CLASS_LINKS[x]}">${x} →</a>`).join("")}</div>`;
 }));
})();