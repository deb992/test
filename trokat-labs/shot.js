const { chromium } = require('playwright');
const OUT='/tmp/claude-0/-home-user-test/1737c488-7e1b-57e3-8fbe-44ad64841339/scratchpad';
(async()=>{
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const errs=[];
for(const [n,w,h,p] of [['tk-desktop',1440,900,'index'],['tk-apps',1440,900,'apps'],['tk-studio',1440,900,'studio'],['tk-contact',1440,900,'contact'],['tk-mobile',390,844,'index']]){
  const pg=await b.newPage({viewport:{width:w,height:h}});
  pg.on('pageerror',e=>errs.push(`[${n}] ${e.message}`));
  pg.on('console',m=>{if(m.type()==='error')errs.push(`[${n}] ${m.text()}`);});
  await pg.goto('http://127.0.0.1:8082/'+p+'.html',{waitUntil:'load'});
  await pg.evaluate(()=>document.querySelectorAll('[data-reveal]').forEach(e=>e.classList.add('in')));
  await pg.waitForTimeout(1100);
  const of=await pg.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  if(of>2) errs.push(`[${n}] overflow ${of}px`);
  await pg.screenshot({path:`${OUT}/${n}.png`});
  await pg.close();
}
await b.close();
console.log(errs.length?'ISSUES:\n'+errs.join('\n'):'clean: no errors, no overflow');
})();
