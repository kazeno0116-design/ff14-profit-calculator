/* Per-duty reward panels, using the same reward list classes as the ID page. */
window.FF14BattleRewards=(()=>{
  const itemBase='https://jp.finalfantasyxiv.com/lodestone/playguide/db/item/';
  const dutyPattern=/^https:\/\/jp\.finalfantasyxiv\.com\/lodestone\/playguide\/db\/duty\/[0-9a-f]{11}\/$/;
  const itemHash=/^[0-9a-f]{11}$/;
  const esc=FF14Tools.esc;
  let pending;
  let nextId=0;

  function load(){
    if(!pending){
      pending=fetch('../../assets/data/battle-duty-rewards.json')
        .then(response=>{
          if(!response.ok)throw new Error('reward data unavailable');
          return response.json();
        })
        .then(data=>{
          if(!data||typeof data!=='object'||Array.isArray(data))throw new Error('invalid reward data');
          return data;
        })
        .catch(error=>{pending=undefined;throw error});
    }
    return pending;
  }

  function button(name,source){
    const label=esc(name);
    return `<button type="button" class="battle-reward-toggle" data-battle-reward="${label}" data-reward-source="${dutyPattern.test(source)?source:''}" aria-expanded="false" aria-label="${label}の報酬">報酬</button>`;
  }

  function rows(rewards){
    if(!Array.isArray(rewards)||!rewards.length)return '';
    return rewards.filter(x=>x&&typeof x.name==='string'&&x.name.trim()&&typeof x.hash==='string'&&itemHash.test(x.hash))
      .map(x=>`<a class="dungeon-reward-link" target="_blank" rel="noopener" href="${itemBase}${x.hash}/">${esc(x.name)}</a>`).join('');
  }

  function bind(root){
    if(!root)return;
    let selected;
    const panel=document.createElement('section');
    panel.id=`battle-rewards-${++nextId}`;
    panel.className='feature-box dungeon-reward-box battle-reward-panel';
    panel.setAttribute('aria-labelledby',panel.id+'-heading');

    function close(restoreFocus){
      if(selected){
        selected.setAttribute('aria-expanded','false');
        selected.removeAttribute('aria-controls');
        if(restoreFocus&&selected.isConnected)selected.focus();
      }
      selected=undefined;
      panel.remove();
    }

    root.addEventListener('click',async event=>{
      const trigger=event.target.closest('.battle-reward-toggle');
      if(!trigger||!root.contains(trigger))return;
      if(trigger===selected&&panel.isConnected){close(true);return}
      const row=trigger.closest('[data-battle-reward-row]');
      if(!row)return;
      close(false);
      selected=trigger;
      trigger.setAttribute('aria-expanded','true');
      trigger.setAttribute('aria-controls',panel.id);
      const name=trigger.dataset.battleReward,source=trigger.dataset.rewardSource;
      panel.innerHTML=`<div class="battle-reward-head"><div><small>REWARD</small><h3 id="${panel.id}-heading" tabindex="-1">報酬</h3><p class="battle-reward-duty-name">${esc(name)}</p></div><button type="button" class="detail-close-btn">閉じる</button></div><div class="battle-reward-body" aria-live="polite">報酬を読み込んでいます…</div>${dutyPattern.test(source)?`<a class="battle-reward-source dungeon-reward-link" href="${source}" target="_blank" rel="noopener">公式データベースで詳細を確認 ↗</a>`:''}`;
      row.after(panel);
      panel.querySelector('.detail-close-btn').addEventListener('click',()=>close(true));
      panel.querySelector('h3').focus({preventScroll:true});
      panel.scrollIntoView({block:'nearest'});
      const body=panel.querySelector('.battle-reward-body');
      try{
        const data=await load();
        if(!body.isConnected)return;
        const links=rows(Object.hasOwn(data,name)?data[name]:undefined);
        body.innerHTML=links?`<div class="dungeon-reward-list">${links}</div>`:'<p>公式データベースで掲載できるアイテムを確認できていません。</p>';
      }catch{
        if(body.isConnected)body.innerHTML='<p class="dungeon-reward-error">報酬データを読み込めませんでした。閉じてからもう一度お試しください。</p>';
      }
    });
    panel.addEventListener('keydown',event=>{
      if(event.key==='Escape'){event.preventDefault();close(true)}
    });
  }

  return {bind,button};
})();
