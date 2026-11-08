/* Звуки синтезуються в браузері (Web Audio) - без аудіофайлів.
   Щоб змінити мелодію, змініть частоти (Гц) у відповідній функції. */
const Sound=(()=>{
  let ctx=null;
  function ac(){
    if(!ctx){const C=window.AudioContext||window.webkitAudioContext;if(!C)return null;try{ctx=new C()}catch(e){return null}}
    if(ctx.state==="suspended")ctx.resume();return ctx}
  function tone(f,t0,dur,type="triangle",vol=.16){
    const c=ac();if(!c)return;
    const o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.value=f;
    const s=c.currentTime+t0;
    g.gain.setValueAtTime(.0001,s);g.gain.exponentialRampToValueAtTime(vol,s+.015);g.gain.exponentialRampToValueAtTime(.0001,s+dur);
    o.connect(g);g.connect(c.destination);o.start(s);o.stop(s+dur+.05)}
  const on=()=>state.settings.sound!==false;
  const play=fn=>(...a)=>{if(on())try{fn(...a)}catch(e){}};
  return {
    unlock(){if(on())ac()},
    correct:play(()=>{tone(659,0,.16);tone(784,.08,.16);tone(1047,.16,.32)}),          // мі-соль-до
    wrong:play(()=>{tone(440,0,.2,"sine",.1);tone(392,.12,.3,"sine",.09)}),             // м'яко, без "сирени"
    coin:play(()=>{tone(1319,0,.07,"square",.045);tone(1760,.06,.16,"square",.045)}),
    tick:play(()=>{tone(988,0,.09,"triangle",.12)}),
    untick:play(()=>{tone(523,0,.09,"triangle",.08)}),
    fanfare:play(()=>{[523,659,784,1047].forEach((f,i)=>tone(f,i*.1,.32));tone(1319,.45,.6,"triangle",.13)}),
    spend:play(()=>{tone(784,0,.1,"sine",.12);tone(587,.08,.14,"sine",.12);tone(392,.16,.22,"sine",.12)})
  }})();
