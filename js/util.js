/* Допоміжні функції, спільні для всіх модулів. Підключається першим. */
const $=s=>document.querySelector(s);
const $$=s=>Array.from(document.querySelectorAll(s));
const ri=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
const pick=a=>a[Math.floor(Math.random()*a.length)];
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=ri(0,i);[a[i],a[j]]=[a[j],a[i]]}return a};
const esc=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const iso=d=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
const today=()=>iso(new Date());
const dayShift=(s,n)=>{const d=new Date(s+"T12:00:00");d.setDate(d.getDate()+n);return iso(d)};
const weekday=s=>{const w=new Date(s+"T12:00:00").getDay();return w===0?7:w}; // 1 = пн ... 7 = нд
const weekDays=(s=today())=>{const mon=dayShift(s,1-weekday(s));return [0,1,2,3,4,5,6].map(i=>dayShift(mon,i))};
const fmt=n=>Number(n).toLocaleString("uk-UA");
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
const SK={m:{name:"Математика",c:"var(--math)"},e:{name:"Інженерія",c:"var(--eng)"},k:{name:"Критичне мислення",c:"var(--crit)"}};
const NAMES=["Оля","Марко","Софія","Дмитро","Ірина","Тарас","Ліна","Богдан"];
const DAYNAMES=["Пн","Вт","Ср","Чт","Пт","Сб","Нд"];
/* Відмінювання: plural(5,["нота","ноти","нот"]) -> "нот" */
function plural(n,f){n=Math.abs(n)%100;const n1=n%10;if(n>10&&n<20)return f[2];if(n1>1&&n1<5)return f[1];if(n1===1)return f[0];return f[2]}
const notesWord=n=>plural(n,["нота","ноти","нот"]);
/* Простий хеш для PIN: від дитини, а не від зловмисника. */
function pinHash(p){let h=2166136261;for(const c of "shtab:"+p){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return (h>>>0).toString(36)}
const reducedMotion=()=>window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches;
