#!/usr/bin/env python3
"""Bundle the built site into ONE self-contained HTML file for a live preview."""
import base64, mimetypes, pathlib, re

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "dist" / "trokat-labs-preview.html"
PAGES = ["index", "apps", "studio", "about", "contact"]
LABELS = {"index":"Home","apps":"Apps","studio":"Studio","about":"About","contact":"Contact"}

def data_uri(p):
    m = mimetypes.guess_type(p.name)[0] or "application/octet-stream"
    return f"data:{m};base64," + base64.b64encode(p.read_bytes()).decode()

def between(h, a, b):
    i = h.index(a); j = h.index(b, i); return h[i+len(a):j]

css = (ROOT/"assets/css/fonts.css").read_text() + "\n" + (ROOT/"assets/css/site.css").read_text()
for f in sorted((ROOT/"assets/fonts").glob("*.woff2")):
    css = css.replace(f"/assets/fonts/{f.name}", data_uri(f))
js = (ROOT/"assets/js/site.js").read_text()
home = (ROOT/"index.html").read_text()

header = '<header class="masthead">' + between(home, '<header class="masthead">', '<main id="main">')
fs = home.index('<footer class="footer">'); fe = home.index('<script src=', fs)
footer = home[fs:fe]

routes = []
for n in PAGES:
    body = between((ROOT/f"{n}.html").read_text(), '<main id="main">', "</main>")
    routes.append(f'<div class="route" data-route="{n}"{"" if n=="index" else " hidden"}>{body}</div>')

page = f'{header}\n<main id="main">\n{"".join(routes)}\n</main>\n{footer}'
page = re.sub(r'src="(/assets/[^"]+)"',
              lambda m: (f'src="{data_uri(ROOT/m.group(1).lstrip("/"))}"'
                         if (ROOT/m.group(1).lstrip("/")).exists() else m.group(0)), page)
page = re.sub(r'data-orbit="([^"]+)"',
              lambda m: 'data-orbit="' + re.sub(r'/assets/[^&"]+?\.png',
                   lambda k: data_uri(ROOT/k.group(0).lstrip("/")) if (ROOT/k.group(0).lstrip("/")).exists() else k.group(0),
                   m.group(1)) + '"', page)
page = page.replace(' data-redirect="thank-you.html"', '')

router = """
(function(){
  var PAGES=%s, LBL=%s, routes=document.querySelectorAll('.route');
  function show(n,push){
    if(PAGES.indexOf(n)===-1)n='index';
    routes.forEach(function(r){r.hidden=r.dataset.route!==n;});
    document.querySelectorAll('.nav a[href], .drawer a[href]').forEach(function(a){
      var t=(a.getAttribute('href')||'').replace(/\\.html.*$/,'');
      if(t===n)a.setAttribute('aria-current','page'); else a.removeAttribute('aria-current');
    });
    var act=document.querySelector('.route[data-route="'+n+'"]');
    if(act)act.querySelectorAll('[data-reveal]').forEach(function(e){e.classList.add('in');});
    window.scrollTo({top:0,behavior:'auto'});
    window.dispatchEvent(new Event('resize'));
    if(push)history.replaceState(null,'','#'+n);
    document.title=(n==='index'?'':LBL[n]+' \\u00b7 ')+'TroKat Labs';
  }
  document.addEventListener('click',function(e){
    var a=e.target.closest('a[href]'); if(!a)return;
    var m=(a.getAttribute('href')||'').match(/^(?:.*\\/)?([a-z0-9-]+)\\.html(#.*)?$/i);
    if(!m)return;
    var n=m[1],frag=m[2]||'';
    if(PAGES.indexOf(n)===-1&&n!=='thank-you')return;
    e.preventDefault();
    var dr=document.querySelector('.drawer');
    if(dr&&dr.classList.contains('open')){dr.classList.remove('open');document.body.style.overflow='';
      var bg=document.querySelector('.burger'); if(bg)bg.setAttribute('aria-expanded','false');}
    show(n==='thank-you'?'contact':n,true);
    if(frag){var t=document.querySelector(frag); if(t)t.scrollIntoView({behavior:'auto',block:'start'});}
  });
  show((location.hash||'#index').slice(1),false);
  var rf=window.fetch;
  window.fetch=function(u){ if(String(u).indexOf('web3forms.com')!==-1)
      return Promise.resolve({ok:true,json:function(){return Promise.resolve({success:true});}});
    return rf.apply(this,arguments); };
  var f=document.getElementById('contactForm');
  if(f)f.addEventListener('submit',function(){setTimeout(function(){
    var s=document.getElementById('formStatus');
    if(s&&s.classList.contains('ok'))s.innerHTML='Thanks \\u2014 that reached us.<br><small style="opacity:.75">Preview note: on the live site this emails deb@trokatlabs.com.</small>';
  },120);});
})();
""" % (repr(PAGES).replace("'", '"'), repr(LABELS).replace("'", '"'))

OUT.parent.mkdir(exist_ok=True)
OUT.write_text(f"<title>TroKat Labs</title>\n<style>\n{css}\n</style>\n{page}\n<script>\n{js}\n{router}\n</script>\n", encoding="utf-8")
print(f"wrote {OUT.relative_to(ROOT)} ({OUT.stat().st_size/1048576:.2f} MB)")
