/* Анімації: ноти летять у гаманець, конфеті. Вимикаються, якщо в системі ввімкнено "зменшити рух". */
const FX={
  flyNotes(n,fromEl){
    const chip=$("#walletChip");if(!chip)return;
    chip.classList.remove("bump");void chip.offsetWidth;chip.classList.add("bump");
    if(reducedMotion()||!fromEl||!fromEl.getBoundingClientRect)return;
    const a=fromEl.getBoundingClientRect(),b=chip.getBoundingClientRect();
    const el=document.createElement("div");el.className="fly";el.innerHTML=`${n>0?"+":""}${n} ${icon("music",16)}`;
    el.style.left=(a.left+a.width/2)+"px";el.style.top=(a.top+a.height/2)+"px";document.body.appendChild(el);
    const dx=(b.left+b.width/2)-(a.left+a.width/2),dy=(b.top+b.height/2)-(a.top+a.height/2);
    const anim=el.animate([{transform:"translate(-50%,-50%) scale(1)",opacity:1},{transform:`translate(calc(-50% + ${dx*.3}px),calc(-50% + ${dy*.3-40}px)) scale(1.25)`,opacity:1,offset:.35},{transform:`translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px)) scale(.6)`,opacity:.2}],{duration:850,easing:"cubic-bezier(.3,.7,.4,1)"});
    anim.onfinish=()=>el.remove()},
  confetti(){
    if(reducedMotion())return;
    const cols=["var(--math)","var(--eng)","var(--crit)","var(--accent)","var(--good)"];
    const box=document.createElement("div");box.className="confetti";
    for(let i=0;i<36;i++){const p=document.createElement("i");p.style.left=ri(2,98)+"%";p.style.background=pick(cols);
      p.style.animationDelay=(Math.random()*.35)+"s";p.style.animationDuration=(1.1+Math.random()*.9)+"s";p.style.setProperty("--r",ri(-540,540)+"deg");p.style.setProperty("--x",ri(-60,60)+"px");box.appendChild(p)}
    document.body.appendChild(box);setTimeout(()=>box.remove(),2400)},
  toast(html){
    const t=document.createElement("div");t.className="toast";t.innerHTML=html;document.body.appendChild(t);
    setTimeout(()=>t.classList.add("out"),2200);setTimeout(()=>t.remove(),2700)}
};
