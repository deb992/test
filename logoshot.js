const { chromium } = require('playwright');
const OUT='/tmp/claude-0/-home-user-test/1737c488-7e1b-57e3-8fbe-44ad64841339/scratchpad';
(async()=>{
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
for(const [n,w,h,page] of [['logo-desktop',1440,900,'index'],['logo-mobile',390,844,'index'],['logo-services',1440,900,'services']]){
  const p=await b.newPage({viewport:{width:w,height:h}});
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.goto('http://127.0.0.1:8080/'+page+'.html',{waitUntil:'load'});
  await p.evaluate(()=>document.querySelectorAll('[data-reveal]').forEach(e=>e.classList.add('is-in')));
  await p.waitForTimeout(900);
  const of=await p.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  const logoOk=await p.evaluate(()=>[...document.querySelectorAll('img[src*=logo]')].every(i=>i.complete&&i.naturalWidth>0));
  console.log(n,'overflow:'+of,'logos-loaded:'+logoOk,errs.length?'ERRORS:'+errs.join('|'):'');
  await p.screenshot({path:OUT+'/'+n+'.png'});
  await p.close();
}
await b.close();
})();
