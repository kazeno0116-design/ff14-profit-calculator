document.querySelectorAll('[data-beginner-topic]').forEach(link=>{
  link.addEventListener('click',e=>{
    const target=document.getElementById(link.dataset.beginnerTopic);
    if(!target)return;
    e.preventDefault();
    document.querySelectorAll('.beginner-topic').forEach(d=>{if(d!==target)d.open=false});
    target.open=true;
    setTimeout(()=>target.scrollIntoView({behavior:'smooth',block:'start'}),20);
  });
});
document.querySelectorAll('.beginner-topic').forEach(topic=>{
  topic.addEventListener('toggle',()=>{
    if(!topic.open)return;
    document.querySelectorAll('.beginner-topic').forEach(other=>{if(other!==topic)other.open=false});
  });
});
uiRun.onclick=()=>{
 const inp=uiInput.value,play=uiRole.value,scr=uiScreen.value,prob=uiProblem.value;let a=[];
 if(prob==='miss')a.push(['敵の近くを見る時間を増やす','HPなどの表示を画面の端に置くより、敵の近くへ少し寄せると、攻撃の合図と自分の状態を一緒に見やすくなります。']);
 if(prob==='skill')a.push(['よく使う技を近くに集める','全部の技をきれいに並べるより、よく押すものだけ近くに置く方が迷いにくいです。']);
 if(prob==='target')a.push(['敵や仲間を選ぶ操作を1つ覚える','毎回カーソルで探すより、ゲームパッドやキーで順番に選べる操作を1つ覚えると楽になりやすいです。']);
 if(prob==='clutter')a.push(['使っていない表示を少し小さくする','全部消すより、まず邪魔に感じるものだけ小さくすると、必要な情報を残しながら画面を見やすくできます。']);
 if(inp==='pad')a.push(['よく使う技を同じボタン周辺へ','最初によく使う技だけ近くに置くと覚えやすいです。']);
 else a.push(['手を大きく動かさなくていいキーを使う','押しやすい範囲から使う方が操作を覚えやすいです。']);
 if(play==='heal')a.push(['仲間のHPが見える一覧を見やすくする','回復役では仲間の状態を見ることが多いので、少し見やすくしておくと安心です。']);
 if(play==='tank')a.push(['自分を守る技を近くに置く','守る技を見つけやすい場所に置く方が使いやすいです。']);
 if(play==='attack')a.push(['攻撃の技は増えたら少しずつ並べ直す','新しい技を覚えたときに少しずつ直す方が分かりやすいです。']);
 if(play==='all')a.push(['今は大きく変えなくてもOK','まだ遊び方が決まっていないなら、困ったところだけ直せば十分です。']);
 if(scr==='small')a.push(['表示を増やしすぎない','小さい画面ではキャラクターの周りが見える余白を残す方が遊びやすいです。']);
 uiResult.innerHTML='<h3>まず変えるならこのあたり</h3><div class="result-list">'+a.map((x,i)=>'<div class="result-item"><strong>'+(i+1)+'. '+x[0]+'</strong><span>'+x[1]+'</span></div>').join('')+'</div>';
};