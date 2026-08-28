const { chromium } = require('playwright');
const fs = require('fs');
const axe = fs.readFileSync(require.resolve('axe-core/axe.min.js'),'utf8');
(async()=>{
  const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
  let total=0;
  for (const page of ['index','apps','studio','about','contact','404','thank-you']){
    for (const [vp,w,h] of [['desktop',1440,900],['mobile',390,844]]){
      const p=await b.newPage({viewport:{width:w,height:h}});
      await p.goto(`http://127.0.0.1:8082/${page}.html`,{waitUntil:'load'});
      await p.addStyleTag({content:'*,*::before,*::after{transition:none!important;animation:none!important}'});
      await p.evaluate(()=>document.querySelectorAll('[data-reveal]').forEach(e=>e.classList.add('in')));
      await p.waitForTimeout(250);
      await p.addScriptTag({content:axe});
      const r=await p.evaluate(()=>axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa']}}));
      if(r.violations.length){ total+=r.violations.length;
        console.log(`\n${page} [${vp}]`);
        r.violations.forEach(v=>{
          console.log(`  [${v.impact}] ${v.id}: ${v.help}`);
          v.nodes.slice(0,3).forEach(n=>console.log(`     ${n.target.join(' ')} | ${(n.any[0]||{}).message||''}`));
        });
      }
      await p.close();
    }
  }
  await b.close();
  console.log(total?`\nTOTAL: ${total}`:'\nNo WCAG A/AA violations across 7 pages x 2 viewports.');
})();
