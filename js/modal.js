/* Модальні вікна і PIN дорослого. askPin(...) викликає onOk лише після правильного PIN. */
function openModal(html,onMount){
  closeModal();
  const m=document.createElement("div");m.className="modal";
  m.innerHTML=`<div class="sheet" role="dialog" aria-modal="true">${html}</div>`;
  document.body.appendChild(m);
  m.addEventListener("click",e=>{if(e.target===m||e.target.closest("[data-close]"))closeModal()});
  const sheet=m.querySelector(".sheet");if(onMount)onMount(sheet);
  const f=sheet.querySelector("input,button:not([data-close])");if(f)f.focus();return sheet}
function closeModal(){$$(".modal").forEach(m=>m.remove())}
document.addEventListener("keydown",e=>{if(e.key==="Escape")closeModal()});

let pinFails=0,pinLockUntil=0;
function askPin(title,sub,onOk){
  if(!state.settings.pin){
    openModal(`<span class="label">Для дорослого</span><h2>Спершу потрібен PIN</h2>
      <p class="small">Дорослий задає PIN-код у вкладці "Для батьків". Після цього тут можна буде підтверджувати.</p>
      <button class="big" data-close>Зрозуміло</button>`);return}
  openModal(`<span class="label">${icon("lock",14)} Для дорослого</span><h2>${esc(title)}</h2>
    ${sub?`<p class="small">${sub}</p>`:""}
    <form class="pinform"><input id="pinIn" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="8" autocomplete="off" aria-label="PIN-код"><button class="big">Підтвердити</button></form>
    <p class="small err" id="pinErr" aria-live="polite"></p><button class="ghost" data-close>Скасувати</button>`,sheet=>{
    sheet.querySelector("form").onsubmit=e=>{e.preventDefault();
      const inp=sheet.querySelector("#pinIn"),err=sheet.querySelector("#pinErr");
      if(Date.now()<pinLockUntil){err.textContent="Забагато спроб. Зачекайте хвилину.";return}
      if(pinHash(inp.value.trim())===state.settings.pin){pinFails=0;closeModal();onOk();return}
      pinFails++;inp.value="";
      if(pinFails>=5){pinLockUntil=Date.now()+60000;pinFails=0;err.textContent="Забагато спроб. Зачекайте хвилину."}
      else err.textContent="Не той PIN."}})}
