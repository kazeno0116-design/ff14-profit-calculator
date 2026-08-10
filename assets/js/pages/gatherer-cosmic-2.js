cosmicRun.onclick=()=>{
 const g=cosmicGoal.value,s=cosmicStar.value,c=cosmicClass.value,tm=cosmicTime.value;
 let title='',steps=[];
 if(g==='tool'){title='ツール進行優先';steps=[['通常のステラミッションで必要進行を稼ぐ','現在の強化条件へ直接つながる依頼を優先。'],['ゴールド評価を安定して取れる依頼を残す','失敗しやすい高難度を無理に連打しない。']];if(s==='auxesia')steps.push(['ツール完成済みならツールマスタリーミッションを検討','惑星アウクセシアでは完成済みツール向けのミッションがあります。']);}
 if(g==='credit'){title='通貨・報酬優先';steps=[['安定して高評価を取れるステラミッションを周回','1回の理論最大値より、失敗しない回転を優先。'],['クリティカルミッション発生時は参加を比較','通常より大きい報酬が得られるため、移動コストが低ければ優先。']];}
 if(g==='score'){title='スコア・実績優先';steps=[['ゴールド未取得ミッションを優先','連続ミッションの解放にも高評価が関係します。'],['時間・天候制限ミッションは発生時に優先','常時できないものを先に処理。']];if(s==='auxesia')steps.push(['ツールマスタリーミッションへ','完成ツールがあるクラスはスコア型ミッションを狙う。']);}
 if(g==='quick'){title='短時間優先';steps=[['準備不要ですぐ開始できるミッションを選ぶ','素材準備・長い移動を避ける。'],['クリティカル等が始まっていなければ通常ミッションで終了','待ち時間を作らない。']];}
 if(tm==='short')steps=steps.slice(0,2);
 const kind=c==='craft'?'製作':'採集';
 cosmicResult.innerHTML='<h3>'+title+'（'+kind+'）</h3><div class="result-list">'+steps.map((x,i)=>'<div class="result-item"><strong>'+(i+1)+'. '+x[0]+'</strong><span>'+x[1]+'</span></div>').join('')+'</div>';
 FF14Tools.save('cosmicNav',{g,s,c,tm});
};
const cv=FF14Tools.load('cosmicNav',null);if(cv){cosmicGoal.value=cv.g;cosmicStar.value=cv.s;cosmicClass.value=cv.c;cosmicTime.value=cv.tm}