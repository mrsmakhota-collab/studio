/* ---------- Стан і збереження (v2) ----------
   Увесь стан - один JSON-об'єкт у localStorage "shtab-v2".
   Якщо є прогрес v1 ("shtab-v1"), він переноситься автоматично (v1 не видаляється). */
const STORE_KEY="shtab-v2", STORE_V1="shtab-v1";
const SLOTS={morning:{name:"Ранок",icon:"sun"},after:{name:"Після школи",icon:"school"},evening:{name:"Вечір",icon:"moon"}};
const defaultRoutines=()=>[
  {id:"r1",slot:"morning",title:"Почистити зуби",icon:"tooth",notes:3},
  {id:"r2",slot:"morning",title:"Одягнутись",icon:"shirt",notes:3},
  {id:"r3",slot:"morning",title:"Заправити постіль",icon:"bed",notes:3},
  {id:"r4",slot:"after",title:"Розібрати рюкзак",icon:"backpack",notes:3},
  {id:"r5",slot:"evening",title:"Зібрати рюкзак на завтра",icon:"backpack",notes:3},
  {id:"r6",slot:"evening",title:"Почистити зуби",icon:"tooth",notes:3}
];
const defaultSettings=()=>({
  appName:"Штаб винахідника",
  pin:"",            // хеш PIN-коду батьків
  sound:true,
  baseMin:60,        // базовий екранний час, хв - завжди є, не заробляється
  capMin:120,        // стеля загального екранного часу на день, хв (базовий + бонус)
  price10:15,        // скільки нот коштують 10 хв бонусу
  hwGate:true,       // бонус відкривається лише після підтвердженої домашки
  hwDays:[1,2,3,4,5],// дні з домашкою: 1 = пн ... 7 = нд
  hwNotes:10,        // нот за підтверджену домашку
  weekGoal:5,        // активних днів на тиждень
  weekBonus:20,      // нот за досягнуту тижневу ціль
  noteCorrect:3, noteWrong:1, bonusMini:3, bonusFull:6, slotBonus:5, projectNotes:50
});
const fresh=()=>({v:2,name:"",xp:0,wallet:0,earnedTotal:0,
  skills:{m:{level:3,recent:[],since:0,total:0,correct:0},e:{level:2,recent:[],since:0,total:0,correct:0},k:{level:2,recent:[],since:0,total:0,correct:0}},
  days:{},sessions:{},missions:{},seen:[],projects:{},log:[],events:[],
  routines:defaultRoutines(),tasks:[],taskDone:{},daily:{},weekDone:{},
  editAt:0,            // коли востаннє змінювали налаштування (рутини, ціни...) - для синхронізації
  appliedBonus:[],levelAt:{},
  device:"",           // "child" - телефон дитини, "parent" - пульт батьків (не синхронізується)
  cloud:{lastPull:0,lastPush:0,childAt:0,err:""},
  piggy:{title:"Марафон вихідного",min:60,cost:80,saved:0,weekendOnly:true},
  settings:defaultSettings(),
  hook:"",lastSync:0,updatedAt:0});
let state=fresh();

function loadLocal(){
  try{const s=localStorage.getItem(STORE_KEY);if(s)return JSON.parse(s)}catch(e){}
  try{const s=localStorage.getItem(STORE_V1);if(s)return JSON.parse(s)}catch(e){}
  return null}

/* Злиття зі значеннями за замовчуванням: старий стан (v1 або неповний v2) не ламає застосунок. */
function normalize(s){
  const f=fresh();if(!s||typeof s!=="object")return f;
  const o=Object.assign(f,s);
  for(const k of["m","e","k"])o.skills[k]=Object.assign(fresh().skills[k],(s.skills||{})[k]||{});
  o.settings=Object.assign(defaultSettings(),s.settings||{});
  o.piggy=Object.assign(fresh().piggy,s.piggy||{});
  for(const k of["log","events","seen","tasks"])if(!Array.isArray(o[k]))o[k]=[];
  if(!Array.isArray(s.routines))o.routines=defaultRoutines();
  for(const k of["days","sessions","missions","projects","daily","weekDone","taskDone","levelAt"])if(!o[k]||typeof o[k]!=="object")o[k]={};
  if(!Array.isArray(o.appliedBonus))o.appliedBonus=[];
  o.cloud=Object.assign({lastPull:0,lastPush:0,childAt:0,err:""},s.cloud||{});
  for(const t of o.tasks)if(t.doneAt){o.taskDone[t.id]=t.doneAt;delete t.doneAt} // старий формат
  if(typeof o.wallet!=="number"||o.wallet<0)o.wallet=0;
  o.v=2;return o}

function save(){state.updatedAt=Date.now();try{localStorage.setItem(STORE_KEY,JSON.stringify(state))}catch(e){}
  if(typeof onSaved==="function")onSaved()}
/* Змінено налаштування (рутини, завдання, ціни, скарбничка, PIN): позначити час і відправити в хмару. */
function configChanged(){state.editAt=Date.now();save();if(typeof pushConfigSoon==="function")pushConfigSoon()}
const isParentDevice=()=>state.device==="parent";

/* Дані поточного дня: позначені рутини, бонус за слоти, домашка, витрачені бонусні хвилини. */
function dayData(d=today()){
  const x=state.daily[d]||(state.daily[d]={});
  x.r=x.r||{};x.slot=x.slot||{};x.hw=x.hw||0;x.bonusMin=x.bonusMin||0;x.tasks=x.tasks||{};return x}

/* Журнал подій для батьків (ноти, обмін, рутини). Журнал задач - state.log, як у v1. */
function addEvent(type,data){state.events.push(Object.assign({id:uid(),t:new Date().toISOString(),d:today(),type},data));
  if(state.events.length>3000)state.events=state.events.slice(-3000)}

/* ---------- адаптивність (без змін з v1) ---------- */
function record(sk,ok){const s=state.skills[sk];s.total++;if(ok)s.correct++;s.recent.push(ok?1:0);if(s.recent.length>20)s.recent.shift();s.since++;
  const last=s.recent.slice(-Math.min(6,s.since));const acc=last.reduce((a,b)=>a+b,0)/last.length;let ch=0;
  if(s.since>=4&&acc>=.85&&s.level<10){s.level++;s.since=0;ch=1}
  else if(s.since>=4&&acc<=.5&&s.level>1){s.level--;s.since=0;ch=-1}
  const d=today();state.days[d]=state.days[d]||{m:[0,0],e:[0,0],k:[0,0]};state.days[d][sk][1]++;if(ok)state.days[d][sk][0]++;
  return ch}
function streak(){let n=0,d=today();if(!state.sessions[d])d=dayShift(d,-1);while(state.sessions[d]){n++;d=dayShift(d,-1)}return n}
function acc20(s){return s.recent.length?Math.round(100*s.recent.reduce((a,b)=>a+b,0)/s.recent.length):null}

/* Активний день: позначена хоча б одна рутина або пройдена місія. */
function isActive(d){const x=state.daily[d];return !!(state.sessions[d]||(x&&x.r&&Object.keys(x.r).length)||(x&&x.hw===1))}
function weekActive(){return weekDays().filter(isActive).length}
