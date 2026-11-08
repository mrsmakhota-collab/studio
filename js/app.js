/* Шапка, вкладки, запуск. Підключається останнім. */
const TABS=[
  {id:"day",name:"День",icon:"sun"},
  {id:"lab",name:"Задачі",icon:"star"},
  {id:"project",name:"Проєкт",icon:"bulb"},
  {id:"wallet",name:"Ноти",icon:"music"},
  {id:"parent",name:"Батькам",icon:"lock"}
];
let currentTab="day";

function renderHeader(){
  $("#appName").textContent=state.settings.appName;document.title=state.settings.appName;
  $("#sWallet").innerHTML=fmt(state.wallet);
  $("#sWeek").textContent=weekActive()+"/"+state.settings.weekGoal;
  $("#soundBtn").innerHTML=icon(state.settings.sound?"sound":"mute",20);
  $("#soundBtn").setAttribute("aria-label",state.settings.sound?"Вимкнути звук":"Увімкнути звук");
  if(document.activeElement!==$("#kidName"))$("#kidName").value=state.name||""}
function renderAll(){renderHeader();renderDay();if(!session)renderLab();renderProject();renderWallet();renderParent()}
function show(id){
  if(currentTab==="parent"&&id!=="parent")parentOpen=false; // панель закривається, коли йдемо з вкладки
  currentTab=id;
  TABS.forEach(t=>{$("#tab-"+t.id).setAttribute("aria-selected",t.id===id);$("#view-"+t.id).hidden=t.id!==id});
  ({day:renderDay,lab:renderLab,project:renderProject,wallet:renderWallet,parent:renderParent})[id]();
  window.scrollTo({top:0})}

function boot(){
  $("#tabs").innerHTML=TABS.map(t=>`<button role="tab" id="tab-${t.id}" aria-controls="view-${t.id}" aria-selected="${t.id==="day"}">${icon(t.icon,18)}<span>${t.name}</span></button>`).join("");
  TABS.forEach(t=>$("#tab-"+t.id).onclick=()=>{Sound.unlock();show(t.id)});
  $("#kidName").addEventListener("change",e=>{state.name=e.target.value.trim();save();renderDay()});
  $("#soundBtn").onclick=()=>{state.settings.sound=!state.settings.sound;save();renderHeader();Sound.tick()};
  $("#walletChip").onclick=()=>show("wallet");
  state=normalize(loadLocal());save();
  // Аварійне скидання PIN для дорослих: відкрити адресу з #reset-pin у кінці.
  if(location.hash==="#reset-pin"&&state.settings.pin){
    history.replaceState(null,"",location.pathname);
    openModal(`<span class="label">Для дорослого</span><h2>Скинути PIN?</h2><p class="small">Прогрес не зміниться. Після скидання задайте новий PIN у вкладці "Для батьків".</p>
      <button class="danger" id="rpYes">Скинути PIN</button><button class="ghost" data-close>Скасувати</button>`,sh=>{sh.querySelector("#rpYes").onclick=()=>{state.settings.pin="";save();closeModal();renderAll();show("parent")}})}
  renderAll();show("day");syncSheet();
  // Якщо застосунок лишився відкритим через північ - оновити "сьогодні".
  let lastDay=today();setInterval(()=>{if(today()!==lastDay){lastDay=today();if(!session)renderAll()}},60000)}
boot();
