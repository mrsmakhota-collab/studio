/* Google Таблиця (Apps Script), резервна копія, слабкі місця. Формат журналу state.log - як у v1, Code.gs не змінювався. */
let syncing=false;
async function syncSheet(force){if(syncing)return "busy";syncing=true;try{return await syncSheetInner(force)}finally{syncing=false}}
async function syncSheetInner(force){const url=(state.hook||"").trim();if(!/^https:\/\/script\.google\.com\//.test(url))return "nohook";
  const rows=state.log.filter(x=>!x.u);if(!rows.length&&!force)return "empty";
  try{await fetch(url,{method:"POST",mode:"no-cors",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify({child:state.name||"",rows:rows.map(({u,...r})=>r)})});
    rows.forEach(x=>x.u=1);state.lastSync=Date.now();save();return "ok"}catch(e){return "fail"}}
function exportBackup(){const name="shtab-"+(state.name||"progress")+"-"+today()+".json";
  try{const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([JSON.stringify(state)],{type:"application/json"}));a.download=name;document.body.appendChild(a);a.click();a.remove();return "ok"}catch(e){return "fail"}}
function weakSpots(days){const from=dayShift(today(),-days);const m={};state.log.filter(x=>x.d>=from).forEach(x=>{const key=x.s+"|"+x.k;m[key]=m[key]||{s:x.s,k:x.k,n:0,ok:0,sec:0};m[key].n++;m[key].ok+=x.ok;m[key].sec+=x.sec});
  return Object.values(m).filter(x=>x.n>=3).map(x=>({...x,acc:x.ok/x.n,avg:x.sec/x.n})).sort((a,b)=>a.acc-b.acc)}
function chartSvg(){const days=[];for(let i=13;i>=0;i--)days.push(dayShift(today(),-i));
  const vals=days.map(d=>{const x=state.days[d]||{m:[0,0],e:[0,0],k:[0,0]};return [x.m[1],x.e[1],x.k[1]]});
  const mx=Math.max(8,...vals.map(v=>v[0]+v[1]+v[2]));const top=Math.ceil(mx/8)*8;
  const W=560,H=200,pl=28,pb=24,pt=10,bw=(W-pl)/14;const y=v=>pt+(H-pt-pb)*(1-v/top);
  let s=`<svg viewBox="0 0 ${W} ${H}" width="${W}" role="img" aria-label="Задачі за 14 днів">`;
  for(let t=0;t<=top;t+=top/4){s+=`<line x1="${pl}" x2="${W}" y1="${y(t)}" y2="${y(t)}" stroke="var(--line)" stroke-width="1"/><text x="${pl-6}" y="${y(t)+4}" text-anchor="end" font-size="10" font-family="JetBrains Mono,monospace" fill="var(--muted)">${t}</text>`}
  const cols=["var(--math)","var(--eng)","var(--crit)"];
  vals.forEach((v,i)=>{let acc=0;const x=pl+i*bw+bw*.18;v.forEach((n,j)=>{if(!n)return;s+=`<rect x="${x}" y="${y(acc+n)}" width="${bw*.64}" height="${y(acc)-y(acc+n)}" fill="${cols[j]}" rx="2"/>`;acc+=n});
    if(i%2===1||i===13)s+=`<text x="${x+bw*.32}" y="${H-6}" text-anchor="middle" font-size="10" font-family="JetBrains Mono,monospace" fill="var(--muted)">${days[i].slice(8)}.${days[i].slice(5,7)}</text>`});
  return s+"</svg>"}
