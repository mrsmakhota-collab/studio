/* Вкладка "Гаманець": баланс нот, обмін на бонусний екранний час, скарбничка, історія. */
function renderWallet(){
  const v=$("#view-wallet");if(!v)return;
  const s=state.settings,b=bonusInfo(),p=state.piggy;
  const opts=[10,20,30].map(min=>{const cost=costOf(min);const ok=!b.locked&&min<=b.room&&cost<=state.wallet;
    return `<button data-min="${min}" ${ok?"":"disabled"}><b>+${min} хв</b><span>${cost} ${notesWord(cost)}</span></button>`}).join("");
  let why="";
  if(b.locked)why="Бонусний час відкриється, коли дорослий підтвердить домашку.";
  else if(b.room<=0)why=`На сьогодні бонус вичерпано: разом із базовим це ${s.capMin} хв.`;
  else if(state.wallet<costOf(10))why=`Ще ${costOf(10)-state.wallet} ${notesWord(costOf(10)-state.wallet)} - і можна взяти +10 хв.`;
  const pct=Math.min(100,Math.round(100*p.saved/p.cost));
  const ev=state.events.filter(e=>e.n&&["earn","undo","spend","piggy","manual"].includes(e.type)).slice(-10).reverse();
  v.innerHTML=`<div><span class="label">Твої ноти</span><div class="balance">${fmt(state.wallet)} ${icon("music",34)}</div></div>
  <div class="card"><h3>Екранний час сьогодні</h3>
    <p class="small">Базові ${s.baseMin} хв є завжди. Бонус: використано ${b.used} хв, можна ще ${b.room} хв.</p>
    <div class="buy">${opts}</div>${why?`<p class="small">${why}</p>`:""}
    <p class="note">Після обміну покажи екран дорослому - він підтвердить PIN-кодом.</p></div>
  <div class="card"><div class="slothead">${icon("piggy")}<h3 style="flex:1">Скарбничка: ${esc(p.title)}</h3><span class="small mono">${p.saved}/${p.cost}</span></div>
    <div class="bar" style="--c:var(--accent)"><i style="width:${pct}%"></i></div>
    <p class="small">Накопич ${p.cost} ${notesWord(p.cost)} - і отримаєш ${p.min} хв${p.weekendOnly?" у вихідні":""}. Ці хвилини не входять у денну стелю.</p>
    <div class="row"><button class="ghost" id="pIn" ${state.wallet>0&&p.saved<p.cost?"":"disabled"}>Покласти 10</button><button class="ghost" id="pOut" ${p.saved>0?"":"disabled"}>Забрати 10</button>
    ${p.saved>=p.cost?`<button class="big" id="pGo" ${piggyReady()?"":"disabled"} style="width:auto;flex:1">${piggyReady()?"Обміняти на "+p.min+" хв":"Відкриється в суботу"}</button>`:""}</div></div>
  <div class="card"><h3>Останні ноти</h3>${ev.length?`<div class="hist">${ev.map(e=>`<div><span>${esc(e.why||"")}</span><span class="${e.n>0?"p":"m"}">${e.n>0?"+":""}${e.n}</span></div>`).join("")}</div>`:`<p class="small">Тут з'являться твої ноти. Почни з рутини або міні-місії.</p>`}</div>`;
  v.querySelectorAll("[data-min]").forEach(x=>x.onclick=()=>redeem(+x.dataset.min));
  $("#pIn").onclick=()=>piggyMove(10);$("#pOut").onclick=()=>piggyMove(-10);
  const g=$("#pGo");if(g)g.onclick=piggyRedeem}
