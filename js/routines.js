/* Вкладка "Мій день": тижнева ціль, рутини (ранок / після школи / вечір), домашка, разові завдання. */
function currentSlot(){const h=new Date().getHours();return h<12?"morning":h<18?"after":"evening"}

function toggleRoutine(id,btn){
  const r=state.routines.find(x=>x.id===id);if(!r)return;
  const x=dayData();
  if(x.r[id]){ // дитина сама скасовує свою позначку
    delete x.r[id];Sound.untick();
    let back=r.notes;if(x.slot[r.slot]){delete x.slot[r.slot];back+=state.settings.slotBonus}
    award(-back,"Скасовано: "+r.title);renderDay();return}
  x.r[id]=Date.now();Sound.tick();
  award(r.notes,r.title,btn);
  const all=state.routines.filter(q=>q.slot===r.slot);
  if(!x.slot[r.slot]&&all.every(q=>x.r[q.id])){
    x.slot[r.slot]=1;
    setTimeout(()=>{award(state.settings.slotBonus,SLOTS[r.slot].name+": усе виконано",btn);Sound.fanfare();FX.confetti();FX.toast(`${SLOTS[r.slot].name} - готово! +${state.settings.slotBonus} бонус`)},450)}
  save();renderDay()}

function homeworkTap(btn){
  const x=dayData();
  if(x.hw)return FX.toast(x.hw===1?"Домашку вже підтверджено":"Сьогодні без домашки");
  askPin("Домашнє завдання","Перевірте домашку. Після підтвердження відкриється бонусний екранний час.",()=>{
    openModal(`<span class="label">Домашнє завдання</span><h2>Що сьогодні?</h2>
      <button class="big" id="hwDone">Домашку зроблено (+${state.settings.hwNotes} ${notesWord(state.settings.hwNotes)})</button>
      <button class="big alt" id="hwNone">Сьогодні домашки немає</button><button class="ghost" data-close>Скасувати</button>`,sh=>{
      sh.querySelector("#hwDone").onclick=()=>{x.hw=1;closeModal();award(state.settings.hwNotes,"Домашнє завдання",btn);Sound.fanfare();FX.confetti();save();renderDay()};
      sh.querySelector("#hwNone").onclick=()=>{x.hw=2;closeModal();addEvent("hw",{why:"Без домашки"});save();renderDay()}})})}

function taskDone(id,btn){
  const t=state.tasks.find(q=>q.id===id);if(!t||state.taskDone[id])return;
  askPin("Завдання виконано?",esc(t.title),()=>{state.taskDone[id]=Date.now();award(t.notes,t.title,btn);Sound.fanfare();save();renderDay()})}

function routineItem(r,x){
  const done=!!x.r[r.id];
  return `<button class="item${done?" done":""}" data-r="${r.id}" aria-pressed="${done}">
    <span class="box">${done?icon("check",18):""}</span>${icon(r.icon,26)}<span class="t">${esc(r.title)}</span><span class="n">+${r.notes}</span></button>`}

function renderDay(){
  const v=$("#view-day");if(!v)return;
  const x=dayData(),s=state.settings,now=currentSlot(),t=today();
  const wd=weekDays(),act=weekActive();
  const nm=state.name?esc(state.name)+", ":"";
  const hello={morning:"доброго ранку",after:"привіт",evening:"добрий вечір"}[now];
  let h=`<div><h2>${nm||""}${nm?hello:hello[0].toUpperCase()+hello.slice(1)}!</h2></div>`;
  if(!s.pin)h+=`<div class="notice"><b>Для дорослого:</b> задайте PIN-код у вкладці "Для батьків". Без нього не працюють обмін нот і підтвердження домашки.</div>`;
  h+=`<div class="card"><div class="row between"><h3>Тиждень</h3><span class="small"><b class="mono">${act}</b> з ${s.weekGoal} днів${state.weekDone[wd[0]]?" - ціль виконано!":` - бонус +${s.weekBonus}`}</span></div>
    <div class="week">${wd.map((d,i)=>`<div><i class="${isActive(d)?"on":""}${d===t?" today":""}">${isActive(d)?icon("check",16):""}</i>${DAYNAMES[i]}</div>`).join("")}</div></div>`;
  for(const sl of["morning","after","evening"]){
    const items=state.routines.filter(r=>r.slot===sl);
    const hwHere=sl==="after"&&s.hwDays.includes(weekday(t));
    if(!items.length&&!hwHere)continue;
    const doneN=items.filter(r=>x.r[r.id]).length;
    h+=`<div class="card${sl===now?" now":""}"><div class="slothead">${icon(SLOTS[sl].icon)}<h2>${SLOTS[sl].name}</h2>${sl===now?'<span class="pill">зараз</span>':""}<span class="small mono">${doneN}/${items.length}</span></div>
      <div class="items">${items.map(r=>routineItem(r,x)).join("")}
      ${hwHere?`<button class="item adult${x.hw?" done":""}" id="hwBtn"><span class="box">${x.hw?icon("check",18):""}</span>${icon("pencil",26)}<span class="t">${x.hw===2?"Сьогодні без домашки":"Домашнє завдання"}<br><span class="small" style="font-weight:600;text-decoration:none">${x.hw?"підтверджено":"підтверджує дорослий"}</span></span><span class="n">+${s.hwNotes}</span></button>`:""}
      </div></div>`}
  const open=state.tasks.filter(q=>!state.taskDone[q.id]);
  if(open.length)h+=`<div class="card"><div class="slothead">${icon("star")}<h2>Додаткові завдання</h2></div><div class="items">
    ${open.map(q=>`<button class="item adult" data-task="${q.id}"><span class="box"></span>${icon(q.icon||"star",26)}<span class="t">${esc(q.title)}<br><span class="small" style="font-weight:600">підтверджує дорослий</span></span><span class="n">+${q.notes}</span></button>`).join("")}</div></div>`;
  h+=`<div class="twocol"><button class="big alt" id="toLab">Міні-місія: 3 задачі</button><button class="big alt" id="toRetell">Переказ тексту</button></div>`;
  v.innerHTML=h;
  v.querySelectorAll("[data-r]").forEach(b=>b.onclick=()=>toggleRoutine(b.dataset.r,b));
  v.querySelectorAll("[data-task]").forEach(b=>b.onclick=()=>taskDone(b.dataset.task,b));
  const hw=$("#hwBtn");if(hw)hw.onclick=()=>homeworkTap(hw);
  $("#toLab").onclick=()=>show("lab");$("#toRetell").onclick=()=>show("retell")}
