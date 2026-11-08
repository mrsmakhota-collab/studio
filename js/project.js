/* Вкладка "Проєкт тижня" (з v1, XP замінено нотами). */
function renderProject(){
  const v=$("#view-project");if(!v)return;
  const w=weekIndex(),p=PROJECTS[w.n%PROJECTS.length],done=state.projects[w.key],n=state.settings.projectNotes;
  v.innerHTML=`<div><span class="label">Тиждень ${w.n}</span><h2 style="margin-top:4px">${esc(p.t)}</h2></div>
  <p><b>Завдання.</b> ${esc(p.goal)}</p><p class="small"><b>Матеріали:</b> ${esc(p.mat)}</p>
  <div class="items">
   <div class="card"><span class="tag" style="--c:var(--crit)">1. Гіпотеза</span><div>${esc(p.crit)}</div></div>
   <div class="card"><span class="tag" style="--c:var(--eng)">2. Побудуй і протестуй</span><div>Перша версія, тест, знайди слабке місце, покращ. Мінімум 2 версії.</div></div>
   <div class="card"><span class="tag" style="--c:var(--math)">3. Виміряй</span><div>${esc(p.math)}</div></div>
   <div class="card"><span class="tag" style="--c:var(--ink)">4. Розкажи дорослому</span><div>Що спрацювало, що ні, і як ти це перевірила.</div></div>
  </div>
  <button class="big" id="projDone">${done?"Виконано "+done+" · скасувати":`Проєкт виконано (+${n} ${notesWord(n)})`}</button>`;
  $("#projDone").onclick=e=>{
    if(state.projects[w.key]){delete state.projects[w.key];award(-n,"Скасовано: проєкт тижня")}
    else{state.projects[w.key]=today();award(n,"Проєкт тижня",e.currentTarget);Sound.fanfare();FX.confetti()}
    save();renderProject()}}
