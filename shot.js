const { chromium } = require('playwright');
const OUT = '/tmp/claude-0/-home-user-test/1737c488-7e1b-57e3-8fbe-44ad64841339/scratchpad';
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const errors = [];
  for (const [name, w, h] of [['desktop',1440,900],['mobile',390,844]]) {
    const ctx = await browser.newContext({ viewport:{width:w,height:h}, deviceScaleFactor:1 });
    const page = await ctx.newPage();
    page.on('console', m => { if (m.type()==='error') errors.push(`[${name}] ${m.text()}`); });
    page.on('pageerror', e => errors.push(`[${name}] PAGEERROR ${e.message}`));
    for (const p of ['index','services','about','reviews','contact']) {
      await page.goto(`http://127.0.0.1:8080/${p}.html`, { waitUntil:'load', timeout:15000 });
      await page.evaluate(() => document.querySelectorAll('[data-reveal]').forEach(e=>e.classList.add('is-in')));
      await page.waitForTimeout(700);
      // horizontal overflow check
      const of = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      if (of > 2) errors.push(`[${name}] ${p}: horizontal overflow ${of}px`);
      await page.screenshot({ path:`${OUT}/${name}-${p}.png`, fullPage: p==='index' ? false : false });
      if (p==='index') await page.screenshot({ path:`${OUT}/${name}-index-full.png`, fullPage:true });
    }
    await ctx.close();
  }
  await browser.close();
  console.log(errors.length ? 'ISSUES:\n'+errors.join('\n') : 'no console errors, no overflow');
})();
