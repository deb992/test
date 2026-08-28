const { chromium } = require('playwright');
const OUT='/tmp/claude-0/-home-user-test/1737c488-7e1b-57e3-8fbe-44ad64841339/scratchpad';
const ok=[],bad=[];const t=(c,m)=>(c?ok:bad).push(m);
(async()=>{
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await b.newPage({viewport:{width:1440,height:900}});
const errs=[];
p.on('pageerror',e=>errs.push('PAGEERROR '+e.message));
p.on('console',m=>{if(m.type()==='error'&&!/favicon/i.test(m.text())&&!/404/.test(m.text()))errs.push(m.text());});
await p.goto('http://127.0.0.1:8081/juniors-chimney-preview.html',{waitUntil:'load'});
await p.waitForTimeout(900);

t(errs.length===0, 'no console/page errors '+(errs.length?JSON.stringify(errs.slice(0,3)):''));

// no external network requests (fully self-contained)
const ext=[]; p.on('request',r=>{if(!r.url().startsWith('http://127.0.0.1'))ext.push(r.url());});
await p.reload({waitUntil:'load'}); await p.waitForTimeout(800);
t(ext.length===0,'zero external requests '+(ext.length?ext.slice(0,3):''));

// duplicate IDs would break the form + anchors
const dupes=await p.evaluate(()=>{const seen={},d=[];document.querySelectorAll('[id]').forEach(e=>{
  if(seen[e.id])d.push(e.id); seen[e.id]=1;}); return d;});
t(dupes.length===0,'no duplicate element ids '+(dupes.length?dupes.slice(0,5):''));

// fonts actually loaded (not silent fallback)
t(await p.evaluate(()=>document.fonts.check('700 48px Fraunces')),'Fraunces loaded from data URI');
t(await p.evaluate(()=>document.fonts.check('400 16px Archivo')),'Archivo loaded from data URI');

// images inlined
t(await p.evaluate(()=>[...document.images].every(i=>i.getAttribute('src').startsWith('data:'))),'all images inlined as data URIs');
// the hero is eager; the rest are lazy and must decode once scrolled into view
t(await p.evaluate(()=>{const i=document.querySelector('.hero__bg img');
  return i.complete && i.naturalWidth>1000;}),'hero image decodes immediately');
await p.locator('.route:not([hidden]) .ba').first().scrollIntoViewIfNeeded();
await p.waitForTimeout(1200);
t(await p.evaluate(()=>[...document.querySelectorAll('.route:not([hidden]) .ba img')]
  .every(i=>i.complete && i.naturalWidth>0)),'lazy images decode when scrolled into view');
await p.evaluate(()=>window.scrollTo(0,0)); await p.waitForTimeout(300);

// routing
t(await p.locator('.route[data-route="index"]').isVisible(),'home route visible on load');
for (const [link,route] of [['services','services'],['about','about'],['reviews','reviews'],['contact','contact']]) {
  await p.evaluate(()=>window.scrollTo(0,0)); await p.waitForTimeout(250); await p.click(`.nav a[href="${link}.html"]`); await p.waitForTimeout(350);
  const vis=await p.locator(`.route[data-route="${route}"]`).isVisible();
  const others=await p.locator('.route:visible').count();
  t(vis && others===1, `nav -> ${route} shows exactly that route`);
}
t((await p.title()).includes('Contact'),'document title updates per route');
await p.evaluate(()=>window.scrollTo(0,0)); await p.waitForTimeout(250); await p.click('.nav a[href="index.html"]'); await p.waitForTimeout(300);
t(await p.locator('.route[data-route="index"]').isVisible(),'nav back to home');

// footer + hero CTA links route too
await p.click('.footer a[href="about.html"]'); await p.waitForTimeout(300);
t(await p.locator('.route[data-route="about"]').isVisible(),'footer links route');
await p.click('.footer a[href="services.html#relining"]'); await p.waitForTimeout(400);
t(await p.locator('.route[data-route="services"]').isVisible(),'anchored footer link routes to services');
t(await p.evaluate(()=>window.scrollY>200),'anchored link scrolls to the section');

// contact form end-to-end in preview
await p.evaluate(()=>window.scrollTo(0,0)); await p.waitForTimeout(250); await p.click('.nav a[href="contact.html"]'); await p.waitForTimeout(300);
await p.click('#formSubmit'); await p.waitForTimeout(300);
t(await p.locator('.field.has-error').count()===4,'validation still blocks empty submit');
await p.fill('#name','Dave R'); await p.fill('#phone','2155550100');
await p.fill('#email','dave@example.com'); await p.fill('#address','14 Elm St, Croydon PA');
await p.click('label.chip:has(input[value="Chimney relining"])');
await p.click('#formSubmit'); await p.waitForTimeout(600);
t(await p.locator('#formStatus.is-ok').isVisible(),'valid submit shows success state');
t((await p.locator('#formStatus').innerText()).includes('Preview note'),'preview note explains no real delivery');

// interactions survive bundling
await p.evaluate(()=>window.scrollTo(0,0)); await p.waitForTimeout(250); await p.click('.nav a[href="index.html"]'); await p.waitForTimeout(400);
await p.locator('.hotspot[data-part="crown"] circle.dot').hover(); await p.waitForTimeout(250);
t(await p.locator('.anatomy__item[data-part="crown"]').evaluate(e=>e.classList.contains('is-active')),'anatomy hotspots still work');
t(await p.evaluate(()=>{const c=document.getElementById('emberCanvas'),h=document.querySelector('.hero');
  return c.clientWidth>=h.clientWidth-2;}),'ember canvas fills hero after routing');
t(await p.evaluate(()=>{const c=document.getElementById('emberCanvas');
  const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;
  for(let i=3;i<d.length;i+=4000) if(d[i]>0) return true; return false;}),'ember canvas renders');
const of=await p.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
t(of<=2,'no horizontal overflow ('+of+'px)');
await p.screenshot({path:`${OUT}/bundle-home.png`});
await p.evaluate(()=>window.scrollTo(0,0)); await p.waitForTimeout(250); await p.click('.nav a[href="contact.html"]'); await p.waitForTimeout(400);
await p.screenshot({path:`${OUT}/bundle-contact.png`});

// mobile
const m=await b.newPage({viewport:{width:390,height:844}});
await m.goto('http://127.0.0.1:8081/juniors-chimney-preview.html',{waitUntil:'load'});
await m.waitForTimeout(600);
await m.click('.burger'); await m.waitForTimeout(600);
t(await m.locator('.drawer').evaluate(e=>e.classList.contains('is-open')),'mobile drawer opens');
await m.click('.drawer nav a[href="reviews.html"]'); await m.waitForTimeout(500);
t(await m.locator('.route[data-route="reviews"]').isVisible() && !(await m.locator('.drawer').evaluate(e=>e.classList.contains('is-open'))),'drawer routes and closes');
const ofm=await m.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
t(ofm<=2,'no mobile horizontal overflow ('+ofm+'px)');
await m.close(); await b.close();

console.log('PASS ('+ok.length+')'); ok.forEach(s=>console.log('  ✓ '+s));
if(bad.length){console.log('FAIL ('+bad.length+')'); bad.forEach(s=>console.log('  ✗ '+s)); process.exit(1);}
})();
