// Запуск: node tests/test_generators.js   (з кореня проєкту)
// Перевіряє 12 000 задач: відповіді цілі й невід'ємні, у виборі 2-4 варіанти і рівно один правильний, є пояснення і тип.
const fs=require("fs"),path=require("path");
const root=path.join(__dirname,"..");
const js=["js/util.js","js/generators.js"].map(f=>fs.readFileSync(path.join(root,f),"utf8")).join("\n");
const {genMath,genEng,genCrit}=new Function("document","window",js+";return {genMath,genEng,genCrit};")({querySelector(){},querySelectorAll(){return[]}},{});
let bad=0;
for(let L=1;L<=10;L++)for(let i=0;i<400;i++)for(const g of [genMath,genEng,genCrit]){
  let t;try{t=g(L,[])}catch(e){bad++;console.log("THROW",g.name,L,e.message);continue}
  if(t.type==="num"&&(!Number.isInteger(t.a)||t.a<0)){bad++;console.log("NUM",L,t.q,t.a)}
  if(t.type==="choice"&&(t.a<0||t.a>=t.opts.length||t.opts.length<2||t.opts.length>4)){bad++;console.log("CHOICE",L,t.q)}
  if(!t.ex){bad++;console.log("NO EXPLANATION",L,t.q)}
  if(!t.kind){bad++;console.log("NO KIND",L,t.q)}
}
console.log(bad?`FAIL: ${bad} bad tasks`:"OK: 12000 tasks valid");process.exit(bad?1:0);
