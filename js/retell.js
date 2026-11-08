/* Вкладка "Переказ" (Радіоштаб): текст -> питання -> карта переказу -> переказ (запис голосу або дорослому) -> перевірка.
   Запис голосу живе лише в пам'яті телефона до кінця сесії і нікуди не надсилається. У прогрес ідуть тільки цифри. */
const FILLERS="ну, типу, короче, коротше, еее, як би, значить, ось";
const CHECKS=["Назвала тему","Розповіла два головні факти","Є «тому що» або «тому»","Є висновок"];
const MAP_HEADS=["Про що це?","Головне 1","Головне 2","Висновок"];
let rt=null; // поточна сесія переказу

function retellState(){if(!state.retell)state.retell={level:1,streak:0};if(!Array.isArray(state.retells))state.retells=[];return state.retell}
function ukVoice(){try{return (speechSynthesis.getVoices()||[]).find(v=>/^uk/i.test(v.lang))||null}catch(e){return null}}
if(window.speechSynthesis)speechSynthesis.onvoiceschanged=()=>{if(rt&&rt.step==="read")renderRetell()};
function speak(text){try{if(speechSynthesis.speaking){speechSynthesis.cancel();return}const u=new SpeechSynthesisUtterance(text);u.lang="uk-UA";const v=ukVoice();if(v)u.voice=v;u.rate=.95;speechSynthesis.speak(u)}catch(e){}}

function pickTexts(){
  const lv=retellState().level,done=new Set(state.retells.map(r=>r.textId));
  let pool=RETELL_TEXTS.filter(t=>t.lvl<=lv+1&&!done.has(t.id));
  if(pool.length<3)pool=RETELL_TEXTS.filter(t=>t.lvl<=lv+1);
  const out=[],topics=new Set();
  for(const t of shuffle(pool)){if(out.length<3&&!topics.has(t.topic)){out.push(t);topics.add(t.topic)}}
  for(const t of shuffle(pool))if(out.length<3&&!out.includes(t))out.push(t);
  return out}
function startRetell(){Sound.unlock();rt={step:"pick",choices:pickTexts()};renderRetell()}

function finishRetell(entry){
  const s=retellState(),ok=entry.checks.filter(Boolean).length;
  entry.status="done";
  if(ok>=3){s.streak++;if(s.streak>=3&&s.level<4){s.level++;s.streak=0;setTimeout(()=>FX.toast(`Новий рівень переказу: ${s.level}!`),1200)}}
  award(state.settings.retellNotes,"Переказ: "+entry.title,$("#rtDone")||$("#view-retell"));
  Sound.fanfare();FX.confetti();save()}
function newEntry(mode){
  const e={id:uid(),d:today(),t:new Date().toISOString(),textId:rt.text.id,title:rt.text.title,mode,level:retellState().level,dur:0,fillers:0,fillers1:null,checks:[false,false,false,false],status:"pending"};
  state.retells.push(e);if(state.retells.length>400)state.retells=state.retells.slice(-400);return e}

/* Оцінка дорослого (на телефоні дитини з PIN або з пульта). */
function reviewForm(prefix,fillers=0){
  return `<div class="items">${CHECKS.map((c,i)=>`<label class="chk"><input type="checkbox" id="${prefix}c${i}"><span>${c}</span></label>`).join("")}</div>
    <div class="row"><span class="small">Слова-паразити:</span><button class="ghost" id="${prefix}m" aria-label="Менше">−</button><b class="mono" id="${prefix}f">${fillers}</b><button class="ghost" id="${prefix}p" aria-label="Більше">+</button></div>`}
function bindReviewForm(root,prefix){let f=0;const out=()=>root.querySelector("#"+prefix+"f").textContent=f;
  root.querySelector("#"+prefix+"m").onclick=()=>{f=Math.max(0,f-1);out()};root.querySelector("#"+prefix+"p").onclick=()=>{f++;out()};
  return ()=>({checks:CHECKS.map((_,i)=>root.querySelector("#"+prefix+"c"+i).checked),fillers:f})}
function applyReview(entry,r){entry.checks=r.checks;entry.fillers=r.fillers;finishRetell(entry)}
function adultHere(){
  askPin("Оцінка переказу","Послухайте переказ і позначте, що в ньому було.",()=>{
    const sh=openModal(`<span class="label">Переказ</span><h2>${esc(rt.text.title)}</h2>${reviewForm("ar")}<button class="big" id="arGo">Зарахувати</button><button class="ghost" data-close>Скасувати</button>`);
    const get=bindReviewForm(sh,"ar");
    sh.querySelector("#arGo").onclick=()=>{const e=newEntry("adult");applyReview(e,get());closeModal();rt.entry=e;rt.step="done";renderRetell()}})}
function adultRemote(){const e=newEntry("adult");rt.entry=e;rt.step="wait";save();pushProgress();renderRetell()}

/* ---------- запис голосу ---------- */
async function recStart(){
  try{const stream=await navigator.mediaDevices.getUserMedia({audio:true});
    const mr=new MediaRecorder(stream),chunks=[];rt.mr=mr;rt.t0=Date.now();
    mr.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};
    mr.onstop=()=>{stream.getTracks().forEach(t=>t.stop());clearInterval(rt.tick);clearTimeout(rt.limit);
      if(rt.url)URL.revokeObjectURL(rt.url);rt.url=URL.createObjectURL(new Blob(chunks,{type:mr.mimeType||"audio/webm"}));
      rt.dur=Math.round((Date.now()-rt.t0)/1000);rt.step="listen";rt.fill=0;renderRetell()};
    mr.start();rt.step="recording";renderRetell();
    rt.tick=setInterval(()=>{const el=$("#recT");if(el)el.textContent=Math.round((Date.now()-rt.t0)/1000)+" с"},500);
    rt.limit=setTimeout(()=>{if(mr.state==="recording")mr.stop()},120000)}
  catch(e){openModal(`<h2>Мікрофон недоступний</h2><p class="small">Дозволь доступ до мікрофона в браузері або обери "Розповісти дорослому".</p><button class="big" data-close>Добре</button>`)}}

function renderRetell(){
  const v=$("#view-retell");if(!v)return;const s=retellState();
  if(!rt){const last=state.retells.filter(r=>r.status==="done").slice(-5);const pend=state.retells.filter(r=>r.status==="pending");
    v.innerHTML=`<div><h2>Радіоштаб</h2><p class="small" style="margin-top:4px">Прочитай короткий текст і перекажи своїми словами - як ведуча радіо. Рівень переказу: <b class="mono">${s.level}</b>. За переказ +${state.settings.retellNotes} нот.</p></div>
      ${pend.length?`<div class="notice">Чекає оцінки батьків: ${pend.map(p=>esc(p.title)).join(", ")}</div>`:""}
      <button class="big" id="rtGo">${icon("book",18)} Обрати текст</button>
      ${last.length?`<div class="card"><h3>Останні перекази</h3><div class="hist">${last.reverse().map(r=>`<div><span>${esc(r.title)}</span><span class="small mono">${r.checks.filter(Boolean).length}/4 · паразитів ${r.fillers}</span></div>`).join("")}</div></div>`:""}`;
    $("#rtGo").onclick=startRetell;return}
  const T=rt.text;let h="";
  const back=`<button class="ghost" id="rtX">Вийти</button>`;
  if(rt.step==="pick"){
    h=`<div class="row between"><h2>Обери тему</h2>${back}</div><div class="items">${rt.choices.map((t,i)=>`<button class="item" data-t="${i}"><span class="t"><span class="label">${TOPICS[t.topic]}</span><br>${esc(t.title)}</span></button>`).join("")}</div>`}
  else if(rt.step==="read"){
    const hl=p=>{let x=esc(p);for(const k of T.kw)x=x.split(esc(k)).join(`<mark>${esc(k)}</mark>`);return x};
    h=`<div class="row between"><span class="label">${TOPICS[T.topic]}</span>${back}</div><h2>${esc(T.title)}</h2>
      ${ukVoice()?`<button class="ghost" id="rtSpeak">${icon("sound",16)} Озвучити / зупинити</button>`:""}
      <div class="reading">${T.p.map(p=>`<p>${hl(p)}</p>`).join("")}</div><button class="big" id="rtNext">Прочитала - далі</button>`}
  else if(rt.step==="quiz"){
    const q=T.q[rt.qi],ans=rt.qa!=null;
    h=`<div class="row between"><span class="label">Питання ${rt.qi+1} з ${T.q.length}</span>${back}</div><div class="q">${esc(q[0])}</div>
      <div class="opts">${rt.qorder.map(i=>`<button data-q="${i}" ${ans?"disabled":""} class="${ans?(i===0?"right":i===rt.qa?"wrong":""):""}">${esc(q[1][i])}</button>`).join("")}</div>
      ${ans?`<div class="fb" style="--c:${rt.qa===0?"var(--good)":"var(--bad)"}"><b>${rt.qa===0?"Правильно!":"Не зовсім."}</b> Відповідь: ${esc(q[1][0])}</div><button class="big" id="rtNext">Далі</button>`:""}`}
  else if(rt.step==="map"){
    const L=s.level;
    const cell=(i)=>`<div class="mapc"><span class="label">${MAP_HEADS[i]}</span>${L===1?`<div>${esc(T.map[i])}</div>`:""}</div>`;
    h=`<div class="row between"><h2>Карта переказу</h2>${back}</div>
      ${L>=4?`<p>Перекажи своїми словами без карти. Наприкінці додай свою думку: «А я вважаю, що…»</p>`:`<div class="mapgrid">${[0,1,2,3].map(cell).join("")}</div>`}
      ${L===2?`<p class="small">Ключові слова: ${T.kw.map(k=>`<mark>${esc(k)}</mark>`).join(" · ")}</p>`:""}
      <p class="small">Слова-місточки: спочатку · потім · тому що · тому · отже · наприкінці</p>
      <p class="small">Замість «ну», «типу», «короче» - просто зроби паузу. Тиша звучить впевнено.</p>
      <button class="ghost" id="rtText">Ще раз глянути текст</button><button class="big" id="rtNext">Готова переказувати</button>`}
  else if(rt.step==="mode"){
    h=`<div class="row between"><h2>Як переказуєш?</h2>${back}</div>
      <button class="big" id="rtRec">${icon("music",18)} Записати голос</button>
      <button class="big alt" id="rtAdult">Розповісти дорослому</button>`}
  else if(rt.step==="adult"){
    h=`<div class="row between"><h2>Розповісти дорослому</h2>${back}</div><p>Перекажи текст «${esc(T.title)}» мамі чи татові.</p>
      <button class="big" id="rtHere">Дорослий поруч - оцінить тут</button>
      ${cloudOk()?`<button class="big alt" id="rtRemote">Батьки оцінять на своєму телефоні</button>`:""}`}
  else if(rt.step==="recording"){
    h=`<h2>Запис іде</h2><p class="small">Перекажи текст «${esc(T.title)}». До 2 хвилин.</p>
      <div class="recdot"><span class="mono" id="recT">0 с</span></div><button class="big" id="rtStop">Зупинити</button>`}
  else if(rt.step==="listen"){
    h=`<h2>${rt.fillers1!=null?"Дубль 2: ":""}Послухай себе</h2><audio controls src="${rt.url}" style="width:100%"></audio>
      <p class="small">Натискай кнопку щоразу, коли чуєш слово-паразит: ${FILLERS}.</p>
      <div class="row"><button class="big" id="rtOops" style="flex:1;width:auto">Ой! <span class="mono" id="rtOopsN">${rt.fill}</span></button><button class="ghost" id="rtOopsM" aria-label="Мінус один">−1</button></div>
      <h3>Що було в переказі?</h3><div class="items">${CHECKS.map((c,i)=>`<label class="chk"><input type="checkbox" data-c="${i}"><span>${c}</span></label>`).join("")}</div>
      <button class="big" id="rtSave">Готово</button>${rt.fillers1==null?`<button class="ghost" id="rtTake2">Записати дубль 2 (кращий)</button>`:""}`}
  else if(rt.step==="wait"){
    h=`<h2>Надіслано батькам</h2><p>Коли мама чи тато оцінять переказ на своєму телефоні, ти отримаєш ${state.settings.retellNotes} нот.</p><button class="big" id="rtHome">Добре</button>`}
  else if(rt.step==="done"){
    const e=rt.entry,prev=state.retells.filter(r=>r.status==="done"&&r!==e).slice(-1)[0];
    h=`<span class="label">Переказ зараховано</span><div class="result mono" id="rtDone">${e.checks.filter(Boolean).length} / 4</div>
      <p style="color:var(--accent);font-weight:800">+${state.settings.retellNotes} нот</p>
      <p>${e.fillers1!=null?`Дубль 1: ${e.fillers1} паразитів, дубль 2: ${e.fillers}. ${e.fillers<e.fillers1?"Стало краще!":"Наступного разу вийде чистіше."}`:`Слів-паразитів: ${e.fillers}.`}
      ${prev?` Минулого разу: ${prev.fillers}.`:""}</p><button class="big" id="rtHome">Готово</button>`}
  v.innerHTML=h;
  const on=(id,f)=>{const el=$("#"+id);if(el)el.onclick=f};
  on("rtX",()=>{try{speechSynthesis.cancel()}catch(e){}if(rt.mr&&rt.mr.state==="recording")rt.mr.stop();rt=null;renderRetell()});
  on("rtHome",()=>{rt=null;renderRetell()});
  v.querySelectorAll("[data-t]").forEach(b=>b.onclick=()=>{rt.text=rt.choices[+b.dataset.t];rt.step="read";renderRetell()});
  on("rtSpeak",()=>speak(T.title+". "+T.p.join(" ")));
  if(rt.step==="read")on("rtNext",()=>{try{speechSynthesis.cancel()}catch(e){}rt.step="quiz";rt.qi=0;rt.qa=null;rt.qorder=shuffle([0,1,2]);renderRetell()});
  if(rt.step==="quiz"){v.querySelectorAll("[data-q]").forEach(b=>b.onclick=()=>{rt.qa=+b.dataset.q;rt.qa===0?Sound.correct():Sound.wrong();renderRetell()});
    on("rtNext",()=>{if(rt.qi<T.q.length-1){rt.qi++;rt.qa=null;rt.qorder=shuffle([0,1,2])}else rt.step="map";renderRetell()})}
  if(rt.step==="map"){on("rtNext",()=>{rt.step="mode";renderRetell()});on("rtText",()=>{rt.step="read";renderRetell()})}
  on("rtRec",recStart);on("rtAdult",()=>{rt.step="adult";renderRetell()});
  on("rtHere",adultHere);on("rtRemote",adultRemote);
  on("rtStop",()=>{if(rt.mr&&rt.mr.state==="recording")rt.mr.stop()});
  if(rt.step==="listen"){
    on("rtOops",()=>{rt.fill++;$("#rtOopsN").textContent=rt.fill;Sound.tick()});
    on("rtOopsM",()=>{rt.fill=Math.max(0,rt.fill-1);$("#rtOopsN").textContent=rt.fill});
    on("rtTake2",()=>{rt.fillers1=rt.fill;recStart()});
    on("rtSave",()=>{const e=newEntry("voice");e.dur=rt.dur;e.fillers=rt.fill;if(rt.fillers1!=null)e.fillers1=rt.fillers1;
      e.checks=CHECKS.map((_,i)=>!!v.querySelector(`[data-c="${i}"]`).checked);rt.entry=e;rt.step="done";
      if(rt.url){URL.revokeObjectURL(rt.url);rt.url=null}renderRetell();finishRetell(e)})}}

/* Блок для панелі батьків і пульта. */
function retellParentSection(P){
  const s=retellState(),reviewed=new Set(state.reviewedRetell||[]);
  const pend=state.retells.filter(r=>r.status==="pending"&&!reviewed.has(r.id));
  const last=state.retells.filter(r=>r.status==="done").slice(-10).reverse();
  return `<p class="small">Рівень переказу: <b class="mono">${s.level}</b>/4 (підвищується після 3 переказів з 3-4 пунктами).</p>
    ${pend.map(r=>`<div class="card" data-rv="${r.id}"><h3>Чекає оцінки: ${esc(r.title)}</h3>${reviewForm("rv"+r.id)}<button class="ghost" data-rvgo="${r.id}">Зарахувати (+${state.settings.retellNotes})</button></div>`).join("")}
    ${last.length?`<div class="tablewrap"><table class="tight"><thead><tr><th>Дата</th><th>Текст</th><th class="num">Пара&shy;зити</th><th class="num">Пункти</th></tr></thead><tbody>
      ${last.map(r=>`<tr><td class="mono">${r.d.slice(8)}.${r.d.slice(5,7)}</td><td>${esc(r.title)}<br><span class="small">${r.mode==="voice"?"запис голосу":"наживо"}</span></td><td class="num">${r.fillers1!=null?r.fillers1+"→":""}${r.fillers}</td><td class="num">${r.checks.filter(Boolean).length}/4</td></tr>`).join("")}</tbody></table></div>`:`<p class="small">Переказів ще не було.</p>`}`}
function bindRetellParent(v,P){
  v.querySelectorAll("[data-rvgo]").forEach(b=>{const id=b.dataset.rvgo,card=v.querySelector(`[data-rv="${id}"]`),get=bindReviewForm(card,"rv"+id);
    b.onclick=()=>{const r=get(),e=state.retells.find(x=>x.id===id);if(!e)return;
      if(P){state.reviewedRetell=(state.reviewedRetell||[]).concat([id]);saveLocalOnly();
        cloudSend({bonuses:[{id:uid(),n:state.settings.retellNotes,why:"Переказ: "+e.title,retell:{rid:id,checks:r.checks,fillers:r.fillers}}]},"Оцінку надіслано. Ноти прийдуть на телефон доньки.");renderParent()}
      else{applyReview(e,r);renderParent();renderRetell()}}})}
