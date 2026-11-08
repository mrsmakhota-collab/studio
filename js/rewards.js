/* Ноти: нарахування, тижнева ціль, обмін на екранний час, скарбничка.
   Правило: заробленого ніхто не відбирає. Мінус буває лише при обміні або коли дитина сама скасовує свою позначку. */
function award(n,why,fromEl,meta){
  if(!n)return;
  state.wallet=Math.max(0,state.wallet+n);
  if(n>0)state.earnedTotal+=n;
  addEvent(n>0?"earn":"undo",Object.assign({n,why},meta||{}));
  if(n>0){Sound.coin();FX.flyNotes(n,fromEl)}
  checkWeekGoal();save();renderHeader()}

function checkWeekGoal(){
  const wk=weekDays()[0],s=state.settings;
  if(state.weekDone[wk]||weekActive()<s.weekGoal)return;
  state.weekDone[wk]=today();state.wallet+=s.weekBonus;state.earnedTotal+=s.weekBonus;
  addEvent("earn",{n:s.weekBonus,why:"Тижнева ціль "+s.weekGoal+" днів"});
  setTimeout(()=>{Sound.fanfare();FX.confetti();FX.toast(`Тижневу ціль виконано! +${s.weekBonus} ${notesWord(s.weekBonus)}`);renderHeader()},600)}

/* Скільки бонусу ще можна взяти сьогодні і чи відкрито його. */
function bonusInfo(d=today()){
  const s=state.settings,x=dayData(d);
  const room=Math.max(0,s.capMin-s.baseMin-x.bonusMin);
  const hwDay=s.hwDays.includes(weekday(d));
  const locked=s.hwGate&&hwDay&&x.hw===0;
  return {room,used:x.bonusMin,locked,hwDay,price:s.price10}}
const costOf=min=>Math.round(min/10*state.settings.price10);

function redeem(min){
  const b=bonusInfo(),cost=costOf(min);
  if(b.locked||min>b.room||cost>state.wallet)return;
  askPin(`Обмін: +${min} хв екрану`,`Дитина обмінює ${cost} ${notesWord(cost)} на ${min} хв бонусного часу.`,()=>{
    const x=dayData();state.wallet-=cost;x.bonusMin+=min;addEvent("spend",{n:-cost,min,why:`+${min} хв екрану`});save();Sound.spend();renderHeader();renderWallet();
    openModal(`<span class="label">Готово</span><h2>+${min} хв екрану</h2>
      <p>Додайте ${min} хв у Google Family Link (Бонусний час) або дозвольте вручну.</p>
      <p class="small">Сьогодні бонусу використано: ${x.bonusMin} хв.</p><button class="big" data-close>Добре</button>`)})}

/* Скарбничка: ноти відкладаються на великий блок часу (наприклад, марафон у вихідні). */
function piggyMove(n){
  const p=state.piggy;
  if(n>0){n=Math.min(n,state.wallet,p.cost-p.saved);if(n<=0)return;state.wallet-=n;p.saved+=n;addEvent("piggy",{n:-n,why:"У скарбничку"});Sound.tick()}
  else{n=Math.min(-n,p.saved);if(n<=0)return;p.saved-=n;state.wallet+=n;addEvent("piggy",{n,why:"Зі скарбнички"});Sound.untick()}
  save();renderHeader();renderWallet()}
function piggyReady(){const p=state.piggy;return p.saved>=p.cost&&(!p.weekendOnly||weekday(today())>=6)}
function piggyRedeem(){
  const p=state.piggy;if(!piggyReady())return;
  askPin(`${p.title}: ${p.min} хв`,`Скарбничка повна. Дитина обмінює її на ${p.min} хв.`,()=>{
    p.saved-=p.cost;addEvent("spend",{n:0,min:p.min,why:p.title});save();Sound.fanfare();FX.confetti();renderWallet();
    openModal(`<span class="label">Готово</span><h2>${esc(p.title)}: ${p.min} хв</h2><p>Додайте ${p.min} хв у Google Family Link. Цей час не враховується в денну стелю.</p><button class="big" data-close>Добре</button>`)})}
