const { chromium } = require('playwright');
const fs = require('fs');
const axe = fs.readFileSync(require.resolve('axe-core/axe.min.js'),'utf8');
(async()=>{
  const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
  let total=0;
  for (const page of ['index','services','about','reviews','contact','404','thank-you']){
    for (const [vp,w,h] of [['desktop',1440,900],['mobile',390,844]]){
      const p=await b.newPage({viewport:{width:w,height:h}});
      await p.goto(`http://127.0.0.1:8080/${page}.html`,{waitUntil:'load'});
      await p.addStyleTag({content:'*,*::before,*::after{transition:none!important;animation:none!important}'});
      await p.evaluate(()=>document.querySelectorAll('[data-reveal]').forEach(e=>e.classList.add('is-in')));
      await p.waitForTimeout(250);
      await p.addScriptTag({content:axe});
      const r=await p.evaluate(()=>axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa']}}));
      const v=r.violations.filter(x=>x.impact!=='minor'||true);
      if(v.length){ total+=v.length;
        console.log(`\n${page} [${vp}]`);
        v.forEach(x=>console.log(`  [${x.impact}] ${x.id}: ${x.help}\n     -> ${x.nodes.slice(0,3).map(n=>n.target.join(' ')).join(' | ')}`));
      }
      await p.close();
    }
  }
  await b.close();
  console.log(total? `\nTOTAL VIOLATIONS: ${total}` : '\nNo WCAG A/AA violations found across 7 pages x 2 viewports.');
})();
