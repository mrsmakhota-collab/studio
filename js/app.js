/* Шапка, вкладки, режим пристрою, синхронізація за таймером, запуск. Підключається останнім. */
const TABS=[
  {id:"day",name:"День",icon:"sun"},
  {id:"lab",name:"Задачі",icon:"star"},
  {id:"retell",name:"Переказ",icon:"book"},
  {id:"project",name:"Проєкт",icon:"bulb"},
  {id:"wallet",name:"Ноти",icon:"music"},
  {id:"parent",name:"Батькам",icon:"lock"}
];
let currentTab="day";

function renderHeader(){
  const P=isParentDevice();
  $("#appName").textContent=P?"Пульт батьків":state.settings.appName;document.title=P?"Пульт батьків":state.settings.appName;
  $("#sWallet").innerHTML=fmt(state.wallet);
  $("#sWeek").textContent=weekActive()+"/"+state.settings.weekGoal;
  $("#soundBtn").innerHTML=icon(state.settings.sound?"sound":"mute",20);
  $("#soundBtn").setAttribute("aria-label",state.settings.sound?"Вимкнути звук":"Увімкнути звук");
  const kn=$("#kidName");kn.readOnly=P;if(document.activeElement!==kn)kn.value=state.name||""}
function renderAll(){
  if(!state.device)return renderWelcome();
  renderHeader();
  if(isParentDevice()){renderParent();return}
  renderDay();if(!session)renderLab();if(!rt)renderRetell();renderProject();renderWallet();renderParent()}
function show(id){
  if(isParentDevice())id="parent";
  if(currentTab==="parent"&&id!=="parent")parentOpen=false; // панель закривається, коли йдемо з вкладки
  currentTab=id;
  TABS.forEach(t=>{$("#tab-"+t.id).setAttribute("aria-selected",t.id===id);$("#view-"+t.id).hidden=t.id!==id});
  ({day:renderDay,lab:renderLab,retell:renderRetell,project:renderProject,wallet:renderWallet,parent:renderParent})[id]();
  window.scrollTo({top:0})}
/* Пульт батьків бачить лише свою вкладку; телефон дитини - усі. */
function applyDeviceMode(){
  const P=isParentDevice();
  $("#tabs").hidden=P||!state.device;$("#soundBtn").hidden=P;$(".stats").hidden=!state.device;
  // На телефоні дитини, підключеному до пульта, вкладка "Батькам" схована (вхід - 5 натискань на назву).
  $("#tab-parent").hidden=state.device==="child"&&cloudOk();$("#welcome").hidden=!!state.device;
  TABS.forEach(t=>{if(!state.device)$("#view-"+t.id).hidden=true})}

/* Перший запуск: хто користується цим пристроєм. */
function renderWelcome(){
  applyDeviceMode();
  const w=$("#welcome");
  w.innerHTML=`<div><h2>Вітаємо!</h2><p class="small" style="margin-top:4px">Хто користуватиметься цим пристроєм?</p></div>
    <button class="big" id="wChild">Дитина - це мій телефон</button>
    <button class="big alt" id="wParent">Дорослий - підключити пульт батьків</button>
    <div id="wForm"></div>`;
  $("#wChild").onclick=()=>{state.device="child";save();applyDeviceMode();renderAll();show("day")};
  $("#wParent").onclick=()=>{
    $("#wForm").innerHTML=`<div class="card"><p class="small">Спершу підключіть до таблиці телефон дитини. Потім вставте сюди ту саму адресу Apps Script і PIN батьків.</p>
      <input id="wUrl" placeholder="https://script.google.com/macros/s/.../exec" aria-label="Адреса Apps Script" style="font-size:.85rem">
      <input id="wPin" type="password" inputmode="numeric" maxlength="8" placeholder="PIN батьків" aria-label="PIN батьків">
      <button class="big" id="wGo">Підключити пульт</button><p class="small" id="wMsg" aria-live="polite"></p></div>`;
    $("#wGo").onclick=()=>connectParent($("#wUrl").value,$("#wPin").value.trim(),t=>$("#wMsg").textContent=t);$("#wUrl").focus()}}

function boot(){
  $("#tabs").innerHTML=TABS.map(t=>`<button role="tab" id="tab-${t.id}" aria-controls="view-${t.id}" aria-selected="${t.id==="day"}">${icon(t.icon,18)}<span>${t.name}</span></button>`).join("");
  TABS.forEach(t=>$("#tab-"+t.id).onclick=()=>{Sound.unlock();show(t.id)});
  $("#kidName").addEventListener("change",e=>{if(isParentDevice())return;state.name=e.target.value.trim();save();renderDay()});
  $("#soundBtn").onclick=()=>{state.settings.sound=!state.settings.sound;save();renderHeader();Sound.tick()};
  $("#walletChip").onclick=()=>{if(!isParentDevice())show("wallet")};
  let taps=0,tapT=0;$("#appName").onclick=()=>{if(state.device!=="child")return;const n=Date.now();taps=n-tapT<1500?taps+1:1;tapT=n;
    if(taps>=5){taps=0;askPin("Панель для батьків","",()=>{parentOpen=true;show("parent")})}};
  const loaded=loadLocal();
  state=normalize(loaded);
  // хто вже мав прогрес (v1 або v2 до цієї версії) - це телефон дитини
  if(!state.device&&loaded&&(loaded.updatedAt||loaded.log&&loaded.log.length))state.device="child";
  saveLocalOnly();
  // Аварійне скидання PIN для дорослих: відкрити адресу з #reset-pin у кінці.
  if(location.hash==="#reset-pin"&&state.settings.pin&&!isParentDevice()){
    history.replaceState(null,"",location.pathname);
    openModal(`<span class="label">Для дорослого</span><h2>Скинути PIN?</h2><p class="small">Прогрес не зміниться. Після скидання задайте новий PIN у вкладці "Для батьків".</p>
      <button class="danger" id="rpYes">Скинути PIN</button><button class="ghost" data-close>Скасувати</button>`,sh=>{sh.querySelector("#rpYes").onclick=()=>{state.settings.pin="";configChanged();closeModal();renderAll();show("parent")}})}
  applyDeviceMode();
  if(!state.device){renderWelcome();return startTimers()}
  renderAll();show(isParentDevice()?"parent":"day");
  if(isParentDevice())refreshParent(true);else{pullConfig();pushProgress()}
  startTimers()}

let timersOn=false;
function startTimers(){
  if(timersOn)return;timersOn=true;
  const tick=()=>{if(document.hidden||!cloudOk())return;isParentDevice()?refreshParent(false):pullConfig()};
  setInterval(tick,30000);
  document.addEventListener("visibilitychange",()=>{
    if(!cloudOk())return;
    if(document.hidden){if(state.device==="child"){clearTimeout(pushTimer);pushProgress()}}
    else tick()});
  // Якщо застосунок лишився відкритим через північ - оновити "сьогодні".
  let lastDay=today();setInterval(()=>{if(today()!==lastDay){lastDay=today();if(!session)renderAll()}},60000)}
boot();
