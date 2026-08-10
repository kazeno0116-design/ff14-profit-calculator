document.querySelectorAll('[data-cosmic-topic]').forEach(link=>{
  link.addEventListener('click',e=>{
    const target=document.getElementById(link.dataset.cosmicTopic);
    if(!target)return;
    e.preventDefault();
    document.querySelectorAll('.cosmic-topic').forEach(d=>{if(d!==target)d.open=false});
    target.open=true;
    setTimeout(()=>target.scrollIntoView({behavior:'smooth',block:'start'}),20);
  });
});
document.querySelectorAll('.cosmic-topic').forEach(topic=>{
  topic.addEventListener('toggle',()=>{
    if(!topic.open)return;
    document.querySelectorAll('.cosmic-topic').forEach(other=>{if(other!==topic)other.open=false});
  });
});