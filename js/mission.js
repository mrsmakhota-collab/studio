/* Вкладка "Лабораторія": міні-місія (3 задачі) або повна (8 задач). Логіка задач і рівнів - з v1. */
let session=null;
const PLANS={mini:["m","e","k"],full:["m","e","m","k","m","e","k","m"]};
function newTask(sk){const L=state.skills[sk].level;const t=sk==="m"?genMath(L):sk==="e"?genEng(L,state.seen):genCrit(L,state.seen);t.sk=sk;return t}
function startSession(type){Sound.unlock();const plan=PLANS[type];session={type,plan,i:0,res:[],notes:0,changes:[],task:newTask(plan[0]),answered:false,t0:Date.now()};renderLab()}

function answer(ok,given,el){
  const s=session;if(s.answered)return;s.answered=true;s.given=given;s.ok=ok;
  const t=s.task;if(t.id){state.seen.push(t.id);if(state.seen.length>40)state.seen.shift()}
  const L=state.skills[t.sk].level;const sec=Math.min(600,Math.round((Date.now()-s.t0)/1000));
  state.log.push({id:uid(),t:new Date().toISOString(),d:today(),s:t.sk,k:KIND[t.kind]||t.kind||"",L,ok:ok?1:0,sec});
  if(state.log.length>5000)state.log=state.log.slice(-5000);
  const c=record(t.sk,ok);if(c)s.changes.push([t.sk,c,state.skills[t.sk].level]);
  s.res.push(ok);
  ok?Sound.correct():Sound.wrong();
  const n=ok?state.settings.noteCorrect:state.settings.noteWrong;s.notes+=n;
  renderLab();
  setTimeout(()=>award(n,ok?"Задача":"Спроба",$("#fbBox")||el),ok?250:350)}

function next(){
  const s=session;s.i++;
  if(s.i>=s.plan.length){
    const d=today();state.sessions[d]=(state.sessions[d]||0)+1;
    const m=state.missions[d]||(state.missions[d]={mini:0,full:0});m[s.type]++;
    const bonus=s.type==="full"?state.settings.bonusFull:state.settings.bonusMini;s.notes+=bonus;s.done=true;
    renderLab();Sound.fanfare();FX.confetti();
    setTimeout(()=>award(bonus,s.type==="full"?"Повна місія":"Міні-місія",$(".result")),500);
    renderDay();pushProgress();return}
  s.task=newTask(s.plan[s.i]);s.answered=false;s.t0=Date.now();renderLab();const inp=$("#numIn");if(inp)inp.focus()}

function skillCard(k){const s=state.skills[k],a=acc20(s);return `<div class="skill" style="--c:${SK[k].c}"><span class="tag" style="--c:${SK[k].c}">${SK[k].name}</span>
  <div class="row between"><span class="lvl">${s.level}<span class="small" style="font-family:var(--f-body)"> /10</span></span><span class="small mono">${a===null?"-":a+"%"}</span></div>
  <div class="bar"><i style="width:${s.level*10}%"></i></div><span class="small">${a===null?"Ще не було задач":"точність, останні "+s.recent.length}</span></div>`}

function renderLab(){
  const v=$("#view-lab");if(!v)return;const s=session,st=state.settings;
  if(!s){const m=state.missions[today()]||{mini:0,full:0};const any=m.mini+m.full;
    v.innerHTML=`<div><h2>${any?"Сьогодні вже є місія. Ще одну?":"Обери місію"}</h2>
      <p class="small" style="margin-top:4px">Складність підлаштовується: що краще виходить, то складніше. За кожну правильну відповідь +${st.noteCorrect}, за спробу +${st.noteWrong}.</p></div>
      <div class="twocol"><button class="big" id="goMini">Міні-місія<br><span style="font-family:var(--f-body);font-weight:600;font-size:.85rem">3 задачі · ~5 хв · бонус +${st.bonusMini}</span></button>
      <button class="big alt" id="goFull">Повна місія<br><span style="font-family:var(--f-body);font-weight:600;font-size:.85rem">8 задач · ~15 хв · бонус +${st.bonusFull}</span></button></div>
      <div class="skills">${["m","e","k"].map(skillCard).join("")}</div>`;
    $("#goMini").onclick=()=>startSession("mini");$("#goFull").onclick=()=>startSession("full");return}
  if(s.done){const ok=s.res.filter(Boolean).length,N=s.plan.length;
    v.innerHTML=`<span class="label">Місію завершено</span><div class="result mono">${ok} / ${N}</div>
      <p style="display:flex;align-items:center;gap:6px;color:var(--accent);font-weight:800">+${s.notes} ${notesWord(s.notes)} ${icon("music",18)}</p>
      <p>${ok>=N-1?"Блискуче!":ok>=Math.ceil(N/2)?"Добра робота.":"Помилки - це дані. Наступного разу буде краще."}</p>
      ${s.changes.length?`<div class="items">${s.changes.map(([k,c,l])=>`<div class="tag" style="--c:${SK[k].c}">${SK[k].name}: ${c>0?"рівень вгору":"рівень вниз"} - ${l}</div>`).join("")}</div>`:""}
      <div class="skills">${["m","e","k"].map(skillCard).join("")}</div>
      <button class="big" id="home">Готово</button>`;$("#home").onclick=()=>{session=null;renderLab()};return}
  const t=s.task,c=SK[t.sk].c,N=s.plan.length;
  const prog=s.plan.map((_,i)=>`<i class="${i<s.res.length?(s.res[i]?"ok":"no"):i===s.i?"now":""}"></i>`).join("");
  let body="";
  if(t.type==="num")body=`<form class="ans" id="numForm"><input id="numIn" inputmode="numeric" autocomplete="off" aria-label="Відповідь" ${s.answered?"disabled":""} value="${s.answered?esc(s.given):""}"><button ${s.answered?"disabled":""}>Перевірити</button></form>`;
  else body=`<div class="opts">${t.opts.map((o,i)=>`<button data-i="${i}" ${s.answered?"disabled":""} class="${s.answered?(i===t.a?"right":i===s.given?"wrong":""):""}">${esc(o)}</button>`).join("")}</div>`;
  const fb=s.answered?`<div class="fb" id="fbBox" style="--c:${s.ok?"var(--good)":"var(--bad)"}"><b>${s.ok?"Правильно!":"Не зовсім. Відповідь: "+esc(t.type==="num"?t.a:t.opts[t.a])}</b><br>${esc(t.ex)}</div><button class="big" id="nxt">${s.i===N-1?"Завершити":"Далі"}</button>`:"";
  v.innerHTML=`<div class="prog" aria-label="Задача ${s.i+1} з ${N}">${prog}</div>
    <div class="row between"><span class="tag" style="--c:${c}">${SK[t.sk].name}</span><span class="small mono">рівень ${state.skills[t.sk].level} · ${s.i+1}/${N}</span></div>
    <div class="q">${esc(t.q)}</div>${t.viz?`<div class="viz">${t.viz}</div>`:""}${body}${fb}`;
  if(t.type==="num"&&!s.answered){$("#numForm").onsubmit=e=>{e.preventDefault();const raw=$("#numIn").value.trim().replace(/\s/g,"");if(raw==="")return;const n=Number(raw.replace(",","."));answer(n===t.a,raw,$("#numForm"))};$("#numIn").focus()}
  if(t.type==="choice"&&!s.answered)v.querySelectorAll(".opts button").forEach(b=>b.onclick=()=>{const i=+b.dataset.i;answer(i===t.a,i,b)});
  if(s.answered){$("#nxt").onclick=next;$("#nxt").focus()}}
