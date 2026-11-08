/* Вкладка "Для батьків": за PIN-кодом. Усі зміни зберігаються одразу. */
let parentOpen=false;
const openSecs=new Set(["overview"]);
const sec=(id,title,body)=>`<details class="sec" data-sec="${id}" ${openSecs.has(id)?"open":""}><summary>${title}</summary><div style="display:flex;flex-direction:column;gap:12px">${body}</div></details>`;
const numField=(id,label,val,min=0,max=999)=>`<label class="field">${label}<input type="number" id="${id}" value="${val}" min="${min}" max="${max}" inputmode="numeric"></label>`;
const iconSelect=(cur,attr)=>`<select ${attr} aria-label="Іконка">${Object.keys(ICON_NAMES).map(k=>`<option value="${k}" ${k===cur?"selected":""}>${ICON_NAMES[k]}</option>`).join("")}</select>`;
const getNum=(id,min,max)=>clamp(Math.round(+($("#"+id).value)||0),min,max);

function renderParent(){
  const v=$("#view-parent");if(!v)return;
  if(!state.settings.pin)return renderPinSetup(v,false);
  if(!parentOpen){
    v.innerHTML=`<div><h2>Панель для батьків</h2><p class="small" style="margin-top:4px">Налаштування, рутини, винагороди і прогрес. Відкривається PIN-кодом.</p></div>
      <button class="big" id="pUnlock">${icon("lock",18)} Відкрити панель</button>`;
    $("#pUnlock").onclick=()=>askPin("Панель для батьків","",()=>{parentOpen=true;renderParent()});return}
  const s=state.settings,x=dayData(),b=bonusInfo(),t=today();
  const wk=weekDays(),from7=dayShift(t,-6);
  const earned7=state.events.filter(e=>e.d>=from7&&e.type==="earn").reduce((a,e)=>a+e.n,0);
  const min7=state.events.filter(e=>e.d>=from7&&e.type==="spend").reduce((a,e)=>a+(e.min||0),0);
  const rDone=state.routines.filter(r=>x.r[r.id]).length;
  let h=`<div class="row between"><h2>Панель для батьків</h2><button class="ghost" id="pLock">${icon("lock",16)} Закрити</button></div>`;

  h+=sec("overview","Огляд",`<div class="kpi">
    <div><b>${weekActive()}/${s.weekGoal}</b><span>активних днів цього тижня</span></div>
    <div><b>${rDone}/${state.routines.length}</b><span>рутин сьогодні</span></div>
    <div><b>${x.hw===1?"так":x.hw===2?"немає":"ні"}</b><span>домашка підтверджена</span></div>
    <div><b>${b.used} хв</b><span>бонусу сьогодні (ще ${b.room})</span></div>
    <div><b>${fmt(state.wallet)}</b><span>нот на рахунку</span></div>
    <div><b>${fmt(earned7)}</b><span>нот зароблено за 7 днів</span></div>
    <div><b>${min7} хв</b><span>бонусного часу за 7 днів</span></div>
    <div><b>${streak()}</b><span>днів поспіль з місією</span></div></div>
    <div class="week">${wk.map((d,i)=>`<div><i class="${isActive(d)?"on":""}${d===t?" today":""}">${isActive(d)?icon("check",16):""}</i>${DAYNAMES[i]}</div>`).join("")}</div>`);

  h+=sec("screen","Екранний час і ноти",`<div class="grid2">
    ${numField("sBase","Базовий час, хв",s.baseMin,0,600)}${numField("sCap","Стеля на день (база + бонус), хв",s.capMin,0,720)}
    ${numField("sPrice","Ціна 10 хв бонусу, нот",s.price10,1,500)}${numField("sHwN","Нот за домашку",s.hwNotes,0,200)}
    ${numField("sWG","Тижнева ціль, днів",s.weekGoal,1,7)}${numField("sWB","Бонус за тижневу ціль, нот",s.weekBonus,0,500)}</div>
    <label class="row"><input type="checkbox" id="sGate" ${s.hwGate?"checked":""}> Бонусний час - лише після підтвердженої домашки</label>
    <div><span class="small">Дні з домашкою:</span><div class="days" style="margin-top:4px">${DAYNAMES.map((n,i)=>`<label><input type="checkbox" data-hwd="${i+1}" ${s.hwDays.includes(i+1)?"checked":""}>${n}</label>`).join("")}</div></div>
    <button class="big" id="sSave">Зберегти</button><p class="small" id="sMsg"></p>`);

  h+=sec("routines","Рутини",`<p class="small">Зміни зберігаються одразу. Краще починати з 2-3 пунктів на частину дня і додавати по одному, коли попередні виходять.</p>
    ${Object.keys(SLOTS).map(sl=>`<div class="card"><h3>${SLOTS[sl].name}</h3>
      ${state.routines.filter(r=>r.slot===sl).map(r=>`<div class="redit" data-rid="${r.id}">${iconSelect(r.icon,'data-f="icon"')}
        <input data-f="title" value="${esc(r.title)}" maxlength="40" aria-label="Назва"><input data-f="notes" type="number" min="0" max="100" value="${r.notes}" aria-label="Нот">
        <span class="acts"><button data-act="up" aria-label="Вище">${icon("up",18)}</button><button data-act="down" aria-label="Нижче">${icon("down",18)}</button><button data-act="del" aria-label="Видалити">${icon("trash",18)}</button></span></div>`).join("")||'<p class="small">Порожньо.</p>'}
      <button class="ghost" data-add="${sl}">${icon("plus",16)} Додати пункт</button></div>`).join("")}
    <p class="note">Нот за повністю виконану частину дня (бонус): ${s.slotBonus}.</p>`);

  const open=state.tasks.filter(q=>!q.doneAt),done=state.tasks.filter(q=>q.doneAt).slice(-5).reverse();
  h+=sec("tasks","Разові завдання",`<p class="small">Наприклад, "прибрати в кімнаті". З'являються у вкладці "Мій день", виконання підтверджуєте PIN-кодом.</p>
    <input id="tTitle" placeholder="Назва завдання" maxlength="60" aria-label="Назва завдання">
    <div class="grid2"><label class="field">Іконка${iconSelect("star",'id="tIcon" style="width:100%"')}</label><label class="field">Нот<input id="tNotes" type="number" value="20" min="1" max="500"></label></div>
    <button class="ghost" id="tAdd">${icon("plus",16)} Додати завдання</button>
    ${open.length?`<div class="hist">${open.map(q=>`<div><span>${esc(q.title)} · +${q.notes}</span><button class="ghost" data-tdel="${q.id}" style="min-height:32px;padding:2px 10px">Прибрати</button></div>`).join("")}</div>`:""}
    ${done.length?`<p class="small">Нещодавно виконано: ${done.map(q=>esc(q.title)).join(", ")}</p>`:""}`);

  const p=state.piggy;
  h+=sec("piggy","Скарбничка",`<div class="grid2"><label class="field">Назва цілі<input id="pgT" value="${esc(p.title)}" maxlength="40"></label>
    ${numField("pgM","Скільки хвилин",p.min,10,600)}${numField("pgC","Скільки нот коштує",p.cost,10,5000)}</div>
    <label class="row"><input type="checkbox" id="pgW" ${p.weekendOnly?"checked":""}> Обмін лише в суботу і неділю</label>
    <p class="small">Зараз накопичено: ${p.saved} з ${p.cost}.</p><button class="big" id="pgSave">Зберегти</button>`);

  h+=sec("manual","Бонус вручну",`<p class="small">Наприклад, за чесний звіт, допомогу чи сміливий вчинок. Тільки додавання - штрафів у застосунку немає.</p>
    <div class="redit" style="grid-template-columns:80px 1fr">${`<input id="mN" type="number" value="10" min="1" max="500" aria-label="Нот">`}<input id="mWhy" placeholder="За що" maxlength="60"></div>
    <button class="ghost" id="mGo">${icon("plus",16)} Нарахувати</button>`);

  const tot=["m","e","k"].reduce((a,k)=>a+state.skills[k].total,0),ws=weakSpots(30).slice(0,8);
  h+=sec("skills","Задачі і рівні",`<p class="small">Рівень 1-10 змінюється автоматично: 4+ задачі з точністю від 85% - вгору, до 50% - вниз. Ціль - зона 70-85% правильних.</p>
    <div class="tablewrap"><table><thead><tr><th>Навичка</th><th class="num">Рівень</th><th class="num">Задач</th><th class="num">Точність</th><th class="num">Ост. 20</th></tr></thead><tbody>
    ${["m","e","k"].map(k=>{const q=state.skills[k],a=acc20(q);return `<tr><td><span class="tag" style="--c:${SK[k].c}">${SK[k].name}</span></td><td class="num">${q.level}</td><td class="num">${q.total}</td><td class="num">${q.total?Math.round(100*q.correct/q.total)+"%":"-"}</td><td class="num">${a===null?"-":a+"%"}</td></tr>`}).join("")}</tbody></table></div>
    <p class="small">Усього задач: <b class="mono">${tot}</b> · днів з місією: <b class="mono">${Object.keys(state.sessions).length}</b> · проєктів: <b class="mono">${Object.keys(state.projects).length}</b></p>
    <div><h3>Задачі за 14 днів</h3><div class="legend" style="margin-top:6px"><span style="--c:var(--math)">Математика</span><span style="--c:var(--eng)">Інженерія</span><span style="--c:var(--crit)">Критичне мислення</span></div></div>
    <div class="viz">${chartSvg()}</div>
    <div><h3>Рівні вручну</h3><div class="items" style="margin-top:8px">${["m","e","k"].map(k=>`<div class="row"><span class="tag" style="--c:${SK[k].c};min-width:170px">${SK[k].name}</span><button class="ghost" data-k="${k}" data-d="-1" aria-label="Знизити">−</button><b class="mono">${state.skills[k].level}</b><button class="ghost" data-k="${k}" data-d="1" aria-label="Підвищити">+</button></div>`).join("")}</div></div>
    <div><h3>Слабкі місця за 30 днів</h3>${ws.length?`<div class="tablewrap"><table><thead><tr><th>Тип задачі</th><th class="num">Спроб</th><th class="num">Точність</th><th class="num">Сек</th></tr></thead><tbody>${ws.map(q=>`<tr><td><span class="tag" style="--c:${SK[q.s].c}">${esc(q.k)}</span></td><td class="num">${q.n}</td><td class="num">${Math.round(100*q.acc)}%</td><td class="num">${Math.round(q.avg)}</td></tr>`).join("")}</tbody></table></div>`:`<p class="small">Даних ще мало: з'являться після 2-3 місій.</p>`}</div>`);

  h+=sec("general","Загальне і дані",`<label class="field">Назва застосунку (придумайте разом)<input id="gName" value="${esc(s.appName)}" maxlength="30"></label>
    <label class="row"><input type="checkbox" id="gSound" ${s.sound?"checked":""}> Звуки ввімкнено</label>
    <button class="ghost" id="gSave">Зберегти</button>
    <div class="card"><h3>Змінити PIN</h3><div class="grid2"><input id="np1" type="password" inputmode="numeric" placeholder="Новий PIN" maxlength="8" aria-label="Новий PIN"><input id="np2" type="password" inputmode="numeric" placeholder="Ще раз" maxlength="8" aria-label="Повторіть PIN"></div><button class="ghost" id="npGo">Змінити</button><p class="small" id="npMsg"></p></div>
    <div class="card"><h3>Резервна копія</h3><p class="small">Прогрес живе в цьому браузері. Раз на тиждень зберігайте файл копії.</p>
      <div class="row"><button class="ghost" id="bkExport">Зберегти копію у файл</button><label class="ghost" for="bkImport" style="border-radius:12px;cursor:pointer;display:inline-flex;align-items:center">Відновити з файлу</label><input type="file" id="bkImport" accept=".json,application/json" hidden></div><p class="small" id="bkMsg"></p></div>
    <div class="card"><h3>Google Таблиця</h3><p class="small">Після кожної місії відповіді надсилаються в таблицю з дашбордом. Вставте адресу Apps Script (див. README).</p>
      <div class="ans"><input id="hookUrl" placeholder="https://script.google.com/macros/s/.../exec" style="font-size:.85rem" value="${esc(state.hook||"")}"><button id="hookSave">Зберегти</button></div>
      <div class="row"><button class="ghost" id="hookSend">Надіслати зараз</button><span class="small" id="hookMsg">${state.hook?(state.lastSync?"Остання відправка: "+new Date(state.lastSync).toLocaleString("uk-UA"):"Ще не надсилалось")+". Очікують: "+state.log.filter(q=>!q.u).length:"Не налаштовано"}</span></div></div>
    <div id="resetBox"><button class="ghost" id="resetAsk">Скинути весь прогрес</button></div>`);
  v.innerHTML=h;bindParent(v)}

function bindParent(v){
  const s=state.settings;
  v.querySelectorAll("details.sec").forEach(d=>d.addEventListener("toggle",()=>{d.open?openSecs.add(d.dataset.sec):openSecs.delete(d.dataset.sec)}));
  $("#pLock").onclick=()=>{parentOpen=false;renderParent()};
  $("#sSave").onclick=()=>{
    s.baseMin=getNum("sBase",0,600);s.capMin=Math.max(s.baseMin,getNum("sCap",0,720));s.price10=getNum("sPrice",1,500);s.hwNotes=getNum("sHwN",0,200);
    s.weekGoal=getNum("sWG",1,7);s.weekBonus=getNum("sWB",0,500);s.hwGate=$("#sGate").checked;
    s.hwDays=$$("[data-hwd]").filter(c=>c.checked).map(c=>+c.dataset.hwd);
    save();renderAll();openSecs.add("screen");renderParent();$("#sMsg").textContent="Збережено."};
  // рутини
  v.querySelectorAll(".redit[data-rid]").forEach(row=>{
    const r=state.routines.find(q=>q.id===row.dataset.rid);if(!r)return;
    row.querySelectorAll("[data-f]").forEach(f=>f.onchange=()=>{const k=f.dataset.f;r[k]=k==="notes"?clamp(Math.round(+f.value||0),0,100):k==="title"?(f.value.trim()||r.title):f.value;save();renderDay()});
    row.querySelectorAll("[data-act]").forEach(bn=>bn.onclick=()=>{
      const a=bn.dataset.act,arr=state.routines;
      if(a==="del"){state.routines=arr.filter(q=>q!==r)}
      else{const same=arr.filter(q=>q.slot===r.slot),i=same.indexOf(r),j=a==="up"?i-1:i+1;if(j<0||j>=same.length)return;
        const ia=arr.indexOf(same[i]),ib=arr.indexOf(same[j]);[arr[ia],arr[ib]]=[arr[ib],arr[ia]]}
      save();renderDay();renderParent()})});
  v.querySelectorAll("[data-add]").forEach(bn=>bn.onclick=()=>{state.routines.push({id:"r"+uid(),slot:bn.dataset.add,title:"Нова справа",icon:"star",notes:3});save();renderDay();renderParent();
    const rows=$$(`.redit[data-rid] input[data-f="title"]`);const last=rows[rows.length-1];if(last){last.focus();last.select()}});
  // разові завдання
  $("#tAdd").onclick=()=>{const title=$("#tTitle").value.trim();if(!title)return $("#tTitle").focus();
    state.tasks.push({id:uid(),title,notes:getNum("tNotes",1,500),icon:$("#tIcon").value,created:Date.now(),doneAt:0});save();renderDay();renderParent();FX.toast("Завдання додано")};
  v.querySelectorAll("[data-tdel]").forEach(bn=>bn.onclick=()=>{state.tasks=state.tasks.filter(q=>q.id!==bn.dataset.tdel);save();renderDay();renderParent()});
  // скарбничка
  $("#pgSave").onclick=()=>{const p=state.piggy;p.title=$("#pgT").value.trim()||p.title;p.min=getNum("pgM",10,600);p.cost=getNum("pgC",10,5000);p.weekendOnly=$("#pgW").checked;
    if(p.saved>p.cost){state.wallet+=p.saved-p.cost;p.saved=p.cost}save();renderAll();FX.toast("Скарбничку збережено")};
  // бонус вручну
  $("#mGo").onclick=e=>{const n=getNum("mN",1,500),why=$("#mWhy").value.trim()||"Бонус від батьків";award(n,why,e.currentTarget,{manual:1});renderAll();FX.toast(`Нараховано +${n} ${notesWord(n)}`)};
  // рівні
  v.querySelectorAll("button[data-k]").forEach(bn=>bn.onclick=()=>{const q=state.skills[bn.dataset.k];q.level=clamp(q.level+ +bn.dataset.d,1,10);q.since=0;save();renderParent();renderLab()});
  // загальне
  $("#gSave").onclick=()=>{s.appName=$("#gName").value.trim()||"Штаб винахідника";s.sound=$("#gSound").checked;save();renderAll();FX.toast("Збережено")};
  $("#npGo").onclick=()=>{const a=$("#np1").value.trim(),b=$("#np2").value.trim();
    if(!/^\d{4,8}$/.test(a))return $("#npMsg").textContent="PIN - від 4 до 8 цифр.";
    if(a!==b)return $("#npMsg").textContent="PIN-коди не збігаються.";
    s.pin=pinHash(a);save();$("#np1").value=$("#np2").value="";$("#npMsg").textContent="PIN змінено."};
  $("#bkExport").onclick=()=>{$("#bkMsg").textContent=exportBackup()==="ok"?"Файл копії збережено.":"Не вдалось зберегти файл."};
  $("#bkImport").onchange=e=>{const f=e.target.files[0];if(!f)return;const rd=new FileReader();rd.onload=()=>{let d=null;try{d=JSON.parse(rd.result)}catch(err){}
    if(!d||!d.skills){$("#bkMsg").textContent="Це не файл копії застосунку.";return}
    $("#bkMsg").innerHTML=`Відновити копію від ${d.updatedAt?new Date(d.updatedAt).toLocaleDateString("uk-UA"):"невідомої дати"}? Поточний прогрес буде замінено. <button class="danger" id="bkYes">Відновити</button>`;
    $("#bkYes").onclick=()=>{const pin=state.settings.pin;state=normalize(d);if(!state.settings.pin)state.settings.pin=pin;session=null;save();renderAll();FX.toast("Прогрес відновлено")}};rd.readAsText(f)};
  $("#hookSave").onclick=()=>{state.hook=$("#hookUrl").value.trim();save();$("#hookMsg").textContent=/^https:\/\/script\.google\.com\//.test(state.hook)?'Збережено. Натисніть "Надіслати зараз", щоб перевірити.':state.hook?"Адреса має починатися з https://script.google.com/":"Відправку вимкнено."};
  $("#hookSend").onclick=async()=>{$("#hookMsg").textContent="Надсилаю...";const r=await syncSheet(true);$("#hookMsg").textContent=r==="ok"?"Надіслано. Перевірте аркуш Log.":r==="nohook"?"Спершу вставте і збережіть адресу.":"Немає зв'язку з таблицею. Спробую після наступної місії."};
  $("#resetAsk").onclick=()=>{$("#resetBox").innerHTML=`<div class="confirm"><b>Видалити весь прогрес, ноти й історію?</b><span class="small">Налаштування, рутини і PIN залишаться. Цю дію не можна скасувати.</span><div class="row"><button class="danger" id="resetYes">Так, скинути</button><button class="ghost" id="resetNo">Скасувати</button></div></div>`;
    $("#resetYes").onclick=()=>{const keep={name:state.name,settings:state.settings,routines:state.routines,piggy:Object.assign({},state.piggy,{saved:0}),hook:state.hook};state=Object.assign(fresh(),keep);session=null;save();renderAll();FX.toast("Прогрес скинуто")};
    $("#resetNo").onclick=renderParent}}

function renderPinSetup(v,change){
  v.innerHTML=`<div><h2>Панель для батьків</h2><p class="small" style="margin-top:4px">Спершу задайте PIN-код (4-8 цифр). Ним ви підтверджуватимете домашку, обмін нот на екранний час і відкриватимете цю панель. Не показуйте його дитині.</p></div>
    <form class="pinform" id="pinSet"><input id="ps1" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="8" placeholder="PIN" aria-label="PIN"><input id="ps2" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="8" placeholder="Ще раз" aria-label="Повторіть PIN"><button class="big">Зберегти PIN</button></form><p class="small err" id="psErr"></p>`;
  $("#pinSet").onsubmit=e=>{e.preventDefault();const a=$("#ps1").value.trim(),b=$("#ps2").value.trim();
    if(!/^\d{4,8}$/.test(a))return $("#psErr").textContent="PIN - від 4 до 8 цифр.";
    if(a!==b)return $("#psErr").textContent="PIN-коди не збігаються.";
    state.settings.pin=pinHash(a);save();parentOpen=true;renderAll();FX.toast("PIN збережено")}}
