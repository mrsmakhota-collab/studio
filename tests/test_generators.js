// Запуск: node tests/test_generators.js   (з кореня проєкту)
// Перевіряє 12 000 задач: відповіді цілі й невід'ємні, у виборі 2-4 варіанти і рівно один правильний, є пояснення і тип.
const fs=require("fs"),path=require("path");
const root=path.join(__dirname,"..");
const js=["js/util.js","js/generators.js","js/planning.js"].map(f=>fs.readFileSync(path.join(root,f),"utf8")).join("\n");
const {genMath,genEng,genCrit}=new Function("document","window",js+";return {genMath,genEng,genCrit};")({querySelector(){},querySelectorAll(){return[]}},{});
let bad=0;
for(let L=1;L<=10;L++)for(let i=0;i<400;i++)for(const g of [genMath,genEng,genCrit]){
  let t;try{t=g(L,[])}catch(e){bad++;console.log("THROW",g.name,L,e.message);continue}
  if(t.type==="num"&&(!Number.isInteger(t.a)||t.a<0)){bad++;console.log("NUM",L,t.q,t.a)}
  if(t.type==="choice"&&(t.a<0||t.a>=t.opts.length||t.opts.length<2||t.opts.length>4)){bad++;console.log("CHOICE",L,t.q)}
  if(t.type==="order"){const ok=t.items.length>=2&&t.items.length<=6&&[...t.a].sort().every((x,i)=>x===i)&&t.a.every((k,i)=>t.correct[k]===t.items[i]);if(!ok){bad++;console.log("ORDER",L,t.q)}}
  if(!["num","choice","order"].includes(t.type)){bad++;console.log("TYPE",t.type)}
  if(t.type==="choice"&&new Set(t.opts).size!==t.opts.length){bad++;console.log("DUP OPTS",L,t.q)}
  if(!t.ex){bad++;console.log("NO EXPLANATION",L,t.q)}
  if(!t.kind){bad++;console.log("NO KIND",L,t.q)}
}
console.log(bad?`FAIL: ${bad} bad tasks`:"OK: 12000 tasks valid");if(bad)process.exit(1);
// Перевірка текстів для переказу
{const fs2=require("fs");const src=fs2.readFileSync(path.join(root,"js/texts.js"),"utf8");
 const {RETELL_TEXTS,TOPICS}=new Function(src+";return {RETELL_TEXTS,TOPICS};")();let tb=0;const ids=new Set();
 for(const t of RETELL_TEXTS){const all=t.p.join(" ");const words=all.split(/\s+/).length;
  if(ids.has(t.id)){tb++;console.log("DUP ID",t.id)}ids.add(t.id);
  if(!TOPICS[t.topic]){tb++;console.log("TOPIC",t.id)}
  for(const k of t.kw)if(!all.includes(k)){tb++;console.log("KW not in text",t.id,k)}
  for(const q of t.q)if(q[1].length!==3||new Set(q[1]).size!==3){tb++;console.log("Q",t.id,q[0])}
  if(t.map.length!==4){tb++;console.log("MAP",t.id)}
  if(words<70||words>220){tb++;console.log("LENGTH",t.id,words)}}
 console.log(tb?`FAIL: ${tb} text problems`:`OK: ${RETELL_TEXTS.length} texts valid`);if(tb)process.exit(1)}
