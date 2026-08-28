const { chromium } = require('playwright');
const OUT='/tmp/claude-0/-home-user-test/1737c488-7e1b-57e3-8fbe-44ad64841339/scratchpad';
const ok=[],bad=[];
const t=(c,m)=>(c?ok:bad).push(m);

(async()=>{
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});

// ---- FORM ----
const p=await b.newPage({viewport:{width:1440,height:1000}});
await p.goto('http://127.0.0.1:8080/contact.html',{waitUntil:'load'});

// 1. empty submit must block and flag the 4 required fields
await p.click('#formSubmit');
await p.waitForTimeout(400);
t(await p.locator('.field.has-error').count()===4, 'blocks empty submit, flags 4 required fields');
t(p.url().includes('contact.html'), 'stays on page when invalid');

// 2. bad email + short phone
await p.fill('#name','Test Homeowner');
await p.fill('#phone','215');
await p.fill('#email','not-an-email');
await p.fill('#address','12 Main St, Croydon PA');
await p.click('#formSubmit'); await p.waitForTimeout(300);
t(await p.locator('#phone').getAttribute('aria-invalid')==='true','rejects short phone');
t(await p.locator('#email').getAttribute('aria-invalid')==='true','rejects malformed email');

// 3. valid -> intercept the POST and inspect payload
let payload=null;
await p.route('https://api.web3forms.com/**', async route=>{
  payload = route.request().postData();
  await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({success:true})});
});
await p.fill('#phone','(215) 555-0100');
await p.fill('#email','test@example.com');
await p.click('label.chip:has(input[value="Chimney relining"])');
// keyboard path: focus the hidden input directly and toggle with Space
await p.locator('input[value="Certification / inspection"]').focus();
await p.keyboard.press('Space');
t(await p.locator('input[value="Chimney relining"]').isChecked(),'service chip toggles by click');
t(await p.locator('input[value="Certification / inspection"]').isChecked(),'service chip toggles by keyboard');
await p.selectOption('#timing','Urgent — settlement or safety concern');
await p.fill('#message','Smoking back into the room. Settlement is Sept 12.');
await p.click('#formSubmit');
await p.waitForURL('**/thank-you.html',{timeout:8000}).catch(()=>{});
t(p.url().includes('thank-you.html'),'valid submit redirects to thank-you page');
t(!!payload && /Chimney relining/.test(payload) && /Certification/.test(payload),'multi-select services joined into payload');
t(!!payload && /test%40example\.com|test@example\.com/.test(payload),'email in payload');
t(!!payload && /access_key/.test(payload),'delivery key sent');
t(!!payload && /subject/.test(payload),'subject line generated');
t(await p.locator('.field.has-error').count()===0,'errors cleared on valid input');

// 4. honeypot: a filled bot field must silently abort
await p.goto('http://127.0.0.1:8080/contact.html',{waitUntil:'load'});
let hpFired=false;
await p.route('https://api.web3forms.com/**', r=>{hpFired=true; r.abort();});
await p.evaluate(()=>{document.querySelector('[name=botcheck]').checked=true;
  ['name','phone','email','address'].forEach(id=>document.getElementById(id).value='x@y.com 2155550100');});
await p.fill('#name','Bot'); await p.fill('#phone','2155550100');
await p.fill('#email','bot@spam.com'); await p.fill('#address','nowhere');
await p.click('#formSubmit'); await p.waitForTimeout(500);
t(!hpFired && p.url().includes('contact.html'),'honeypot silently drops bot submissions');
await p.close();

// ---- HOME INTERACTIONS ----
const h=await b.newPage({viewport:{width:1440,height:900}});
await h.goto('http://127.0.0.1:8080/index.html',{waitUntil:'load'});
await h.waitForTimeout(600);

// anatomy sync
await h.locator('.hotspot[data-part="flashing"]').hover();
await h.waitForTimeout(250);
t(await h.locator('.anatomy__item[data-part="flashing"]').evaluate(e=>e.classList.contains('is-active')),'hotspot hover activates matching list item');
await h.locator('.anatomy__item[data-part="firebox"]').scrollIntoViewIfNeeded();
await h.locator('.anatomy__item[data-part="firebox"]').hover({force:true});
await h.waitForTimeout(250);
t(await h.locator('.hotspot[data-part="firebox"]').evaluate(e=>e.classList.contains('is-active')),'list hover activates matching hotspot');

// before/after drag
const ba=h.locator('.ba').first();
await ba.scrollIntoViewIfNeeded();
await h.waitForTimeout(300);
const box=await ba.boundingBox();
await h.mouse.move(box.x+box.width*0.2, box.y+box.height/2);
await h.mouse.down(); await h.mouse.move(box.x+box.width*0.8, box.y+box.height/2); await h.mouse.up();
const pos=await ba.evaluate(e=>e.style.getPropertyValue('--pos'));
t(parseFloat(pos)>70,`before/after slider drags (--pos=${pos})`);

// marquee seamless duplication
t(await h.locator('.marquee__track > .marquee__group').count()===2,'marquee group duplicated for seamless loop');

// ember canvas actually painting
t(await h.evaluate(()=>{const c=document.getElementById('emberCanvas');
  const hero=document.querySelector('.hero');
  return c.clientWidth>=hero.clientWidth-2 && c.clientHeight>=hero.clientHeight-2;}),'ember canvas fills the hero');
t(await h.evaluate(()=>{const c=document.getElementById('emberCanvas');
  const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;
  for(let i=3;i<d.length;i+=4000) if(d[i]>0) return true; return false;}),'ember canvas is rendering particles');

// scroll progress + sticky header
await h.evaluate(()=>window.scrollTo(0,3000)); await h.waitForTimeout(400);
t(await h.locator('.masthead').evaluate(e=>e.classList.contains('is-stuck')),'header sticks on scroll');
t(parseFloat(await h.locator('.flue i').evaluate(e=>e.style.getPropertyValue('--p')))>0,'scroll progress flue fills');
await h.close();

// ---- MOBILE DRAWER ----
const m=await b.newPage({viewport:{width:390,height:844}});
await m.goto('http://127.0.0.1:8080/index.html',{waitUntil:'load'});
await m.click('.burger'); await m.waitForTimeout(700);
t(await m.locator('.drawer').evaluate(e=>e.classList.contains('is-open')),'mobile drawer opens');
t(await m.locator('.drawer nav a').first().isVisible(),'drawer links visible');
await m.screenshot({path:`${OUT}/mobile-drawer.png`});
await m.click('.drawer nav a[href="services.html"]');
await m.waitForURL('**/services.html');
t(m.url().includes('services.html'),'drawer navigation works');
await m.evaluate(()=>window.scrollTo(0,1200)); await m.waitForTimeout(400);
t(await m.locator('.callbar').evaluate(e=>e.classList.contains('is-visible')),'mobile call bar appears on scroll');
await m.screenshot({path:`${OUT}/mobile-callbar.png`});
await m.close();

await b.close();
console.log('PASS ('+ok.length+')'); ok.forEach(s=>console.log('  ✓ '+s));
if(bad.length){console.log('FAIL ('+bad.length+')'); bad.forEach(s=>console.log('  ✗ '+s)); process.exit(1);}
})();
