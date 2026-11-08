/* Синхронізація через Google Таблицю (Code.gs), резервна копія, аналітика.
   Телефон дитини: надсилає прогрес (через 4 с після змін) і раз на 30 с забирає налаштування батьків.
   Пульт батьків: забирає прогрес + налаштування, надсилає зміни налаштувань, бонуси, рівні, домашку. */
const cloudUrl=()=>(state.hook||"").trim();
const cloudOk=()=>/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(cloudUrl());
let pushTimer=null,cfgTimer=null,pushing=false;

function saveLocalOnly(){try{localStorage.setItem(STORE_KEY,JSON.stringify(state))}catch(e){}}
async function cloudPost(body){
  await fetch(cloudUrl(),{method:"POST",mode:"no-cors",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify(body)})}
async function cloudGet(op){
  const r=await fetch(cloudUrl()+"?op="+op+"&t="+Date.now(),{cache:"no-store"});
  const j=await r.json();if(!j||!j.ok)throw new Error((j&&j.error)||"bad response");return j}

/* ---------- що синхронізується ---------- */
function structuralOf(s){
  const st=Object.assign({},s.settings);delete st.sound; // звук - налаштування конкретного пристрою
  return {editAt:s.editAt,settings:st,routines:s.routines,tasks:s.tasks,piggy:{title:s.piggy.title,min:s.piggy.min,cost:s.piggy.cost,weekendOnly:s.piggy.weekendOnly}}}
function applyStructural(t,c){
  if(c.settings)t.settings=Object.assign(t.settings,c.settings,{sound:t.settings.sound});
  if(Array.isArray(c.routines))t.routines=c.routines;
  if(Array.isArray(c.tasks))t.tasks=c.tasks;
  if(c.piggy)t.piggy=Object.assign(t.piggy,c.piggy)} // накопичене (saved) не чіпаємо
function snapshot(){
  const o=JSON.parse(JSON.stringify(state));
  delete o.hook;delete o.device;delete o.cloud;
  o.log=o.log.slice(-1500).map(({u,...r})=>r);o.events=o.events.slice(-1500);return o}

/* ---------- телефон дитини ---------- */
function onSaved(){if(isParentDevice()||!cloudOk())return;clearTimeout(pushTimer);pushTimer=setTimeout(pushProgress,4000)}
async function pushProgress(){
  if(isParentDevice()||!cloudOk())return "nohook";
  if(pushing){clearTimeout(pushTimer);pushTimer=setTimeout(pushProgress,3000);return "busy"}
  pushing=true;
  try{const rows=state.log.filter(x=>!x.u);
    await cloudPost({child:state.name||"",rows:rows.map(({u,...r})=>r),progress:snapshot()});
    rows.forEach(x=>x.u=1);state.cloud.lastPush=Date.now();state.cloud.err="";saveLocalOnly();return "ok"}
  catch(e){state.cloud.err="Немає зв'язку з таблицею";saveLocalOnly();return "fail"}
  finally{pushing=false}}
function pushConfigSoon(){if(!cloudOk())return;clearTimeout(cfgTimer);cfgTimer=setTimeout(()=>{cfgTimer=null;cloudPost({config:structuralOf(state)}).catch(()=>{state.cloud.err="Не вдалось надіслати зміни";saveLocalOnly()})},800)}

/* Застосувати налаштування батьків на телефоні дитини. Повертає true, якщо щось змінилось. */
function applyConfig(c){
  if(!c)return false;let ch=false;
  if((c.editAt||0)>(state.editAt||0)){applyStructural(state,c);state.editAt=c.editAt;ch=true}
  for(const b of c.bonuses||[])if(b&&b.id&&!state.appliedBonus.includes(b.id)){
    state.appliedBonus.push(b.id);award(b.n,b.why||"Бонус від батьків");FX.toast(`Бонус від батьків: +${b.n} ${notesWord(b.n)}`);ch=true}
  if(state.appliedBonus.length>600)state.appliedBonus=state.appliedBonus.slice(-600);
  for(const k of["m","e","k"]){const lv=(c.levels||{})[k];
    if(lv&&(lv.at||0)>(state.levelAt[k]||0)){state.skills[k].level=clamp(lv.level,1,10);state.skills[k].since=0;state.levelAt[k]=lv.at;ch=true}}
  for(const [d,h] of Object.entries(c.hwSet||{})){const x=dayData(d);
    if((h.at||0)>(x.hwAt||0)){x.hwAt=h.at;ch=true;
      if(h.v===1&&x.hw!==1){x.hw=1;award(state.settings.hwNotes,"Домашнє завдання (підтвердили батьки)")}
      else if(h.v===2&&x.hw===0)x.hw=2}}
  return ch}
async function pullConfig(){
  if(isParentDevice()||!cloudOk())return;
  try{const r=await cloudGet("config");state.cloud.lastPull=Date.now();state.cloud.err="";
    if(applyConfig(r.config)){save();if(!session)renderAll();else renderHeader()}else saveLocalOnly()}
  catch(e){state.cloud.err="Немає зв'язку з таблицею";saveLocalOnly()}}

/* Підключення телефона дитини до таблиці. */
async function connectChild(url,msg){
  state.hook=url.trim();
  if(!cloudOk()){msg("Адреса має виглядати так: https://script.google.com/macros/s/.../exec");return}
  msg("Перевіряю зв'язок...");
  let r;try{r=await cloudGet("pull")}catch(e){msg("Не вдалось з'єднатися. Перевірте адресу і що в розгортанні вибрано доступ \"Будь-хто\".");return}
  const fresh=!state.log.length&&!state.wallet&&!state.earnedTotal;
  if(r.progress&&fresh&&(r.progress.earnedTotal||r.progress.log&&r.progress.log.length)){
    const keep={hook:state.hook,device:"child",cloud:state.cloud};
    state=Object.assign(normalize(r.progress),keep);msg("Знайдено прогрес у таблиці - відновлено.")}
  if(r.config&&(r.config.editAt||0)>(state.editAt||0))applyConfig(r.config);
  else{if(!state.editAt)state.editAt=Date.now();pushConfigSoon()}
  state.device="child";save();await pushProgress();renderAll();
  msg("Підключено. Тепер прогрес видно на пульті батьків.")}

/* ---------- пульт батьків ---------- */
function buildMirror(prog,cfg){
  const prev=state;
  const m=normalize(prog||{});
  m.device="parent";m.hook=prev.hook;m.cloud=prev.cloud;m.cloud.childAt=prog?prog.updatedAt||0:0;
  m.settings.sound=prev.settings.sound;
  // локальні зміни, які ще не дійшли до таблиці, не затираємо
  if((prev.editAt||0)>Math.max(cfg&&cfg.editAt||0,m.editAt||0)){applyStructural(m,structuralOf(prev));m.editAt=prev.editAt}
  else if(cfg&&(cfg.editAt||0)>=(m.editAt||0)){applyStructural(m,cfg);m.editAt=cfg.editAt||0}
  if(cfg){for(const k of["m","e","k"]){const lv=(cfg.levels||{})[k];if(lv&&(lv.at||0)>(m.levelAt[k]||0))m.skills[k].level=lv.level}
    const h=(cfg.hwSet||{})[today()];if(h){const x=m.daily[today()]||(m.daily[today()]={});if((h.at||0)>(x.hwAt||0)){x.hw=h.v;x.hwAt=h.at}}
    m.pendingBonus=(cfg.bonuses||[]).filter(b=>!m.appliedBonus.includes(b.id)).reduce((a,b)=>a+b.n,0)}
  state=m;saveLocalOnly()}
async function refreshParent(force){
  if(!isParentDevice()||!cloudOk())return;
  const a=document.activeElement;if(!force&&(cfgTimer||(a&&a.closest&&a.closest("#view-parent")&&/INPUT|SELECT|TEXTAREA/.test(a.tagName))))return;
  try{const r=await cloudGet("pull");state.cloud.lastPull=Date.now();state.cloud.err="";buildMirror(r.progress,r.config);renderAll()}
  catch(e){state.cloud.err="Немає зв'язку з таблицею";saveLocalOnly();renderParent()}}
async function connectParent(url,pin,msg){
  const prev=state;state.hook=url.trim();
  if(!cloudOk()){msg("Адреса має виглядати так: https://script.google.com/macros/s/.../exec");return}
  msg("Перевіряю...");
  let r;try{r=await cloudGet("pull")}catch(e){msg("Не вдалось з'єднатися. Перевірте адресу.");return}
  if(!r.config||!r.config.settings||!r.config.settings.pin){msg("У таблиці ще немає даних. Спершу підключіть телефон дитини.");return}
  if(pinHash(pin)!==r.config.settings.pin){msg("Не той PIN.");state=prev;return}
  state.device="parent";state.editAt=0;buildMirror(r.progress,r.config);state.cloud.lastPull=Date.now();saveLocalOnly();
  parentOpen=true;applyDeviceMode();renderAll();show("parent")}
function cloudSend(part,okMsg){cloudPost({config:part}).then(()=>{FX.toast(okMsg);setTimeout(()=>refreshParent(true),2500)}).catch(()=>FX.toast("Немає зв'язку. Спробуйте ще раз."))}
const cloudBonus=(n,why)=>cloudSend({bonuses:[{id:uid(),n,why,t:Date.now()}]},`Бонус +${n} надіслано. Зʼявиться на телефоні доньки протягом хвилини.`);
const cloudLevel=(k,level)=>cloudSend({levels:{[k]:{level,at:Date.now()}}},"Рівень змінено.");
const cloudHw=v=>cloudSend({hwSet:{[today()]:{v,at:Date.now()}}},v===1?"Домашку підтверджено.":"Позначено: сьогодні без домашки.");

/* ---------- резервна копія і аналітика ---------- */
function exportBackup(){const name="shtab-"+(state.name||"progress")+"-"+today()+".json";
  try{const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([JSON.stringify(snapshot())],{type:"application/json"}));a.download=name;document.body.appendChild(a);a.click();a.remove();return "ok"}catch(e){return "fail"}}
function weakSpots(days){const from=dayShift(today(),-days);const m={};state.log.filter(x=>x.d>=from).forEach(x=>{const key=x.s+"|"+x.k;m[key]=m[key]||{s:x.s,k:x.k,n:0,ok:0,sec:0};m[key].n++;m[key].ok+=x.ok;m[key].sec+=x.sec});
  return Object.values(m).filter(x=>x.n>=3).map(x=>({...x,acc:x.ok/x.n,avg:x.sec/x.n})).sort((a,b)=>a.acc-b.acc)}
function chartSvg(){const days=[];for(let i=13;i>=0;i--)days.push(dayShift(today(),-i));
  const vals=days.map(d=>{const x=state.days[d]||{m:[0,0],e:[0,0],k:[0,0]};return [x.m[1],x.e[1],x.k[1]]});
  const mx=Math.max(8,...vals.map(v=>v[0]+v[1]+v[2]));const top=Math.ceil(mx/8)*8;
  const W=560,H=200,pl=28,pb=24,pt=10,bw=(W-pl)/14;const y=v=>pt+(H-pt-pb)*(1-v/top);
  let s=`<svg viewBox="0 0 ${W} ${H}" width="${W}" role="img" aria-label="Задачі за 14 днів">`;
  for(let t=0;t<=top;t+=top/4){s+=`<line x1="${pl}" x2="${W}" y1="${y(t)}" y2="${y(t)}" stroke="var(--line)" stroke-width="1"/><text x="${pl-6}" y="${y(t)+4}" text-anchor="end" font-size="10" font-family="JetBrains Mono,monospace" fill="var(--muted)">${t}</text>`}
  const cols=["var(--math)","var(--eng)","var(--crit)"];
  vals.forEach((v,i)=>{let acc=0;const x=pl+i*bw+bw*.18;v.forEach((n,j)=>{if(!n)return;s+=`<rect x="${x}" y="${y(acc+n)}" width="${bw*.64}" height="${y(acc)-y(acc+n)}" fill="${cols[j]}" rx="2"/>`;acc+=n});
    if(i%2===1||i===13)s+=`<text x="${x+bw*.32}" y="${H-6}" text-anchor="middle" font-size="10" font-family="JetBrains Mono,monospace" fill="var(--muted)">${days[i].slice(8)}.${days[i].slice(5,7)}</text>`});
  return s+"</svg>"}
