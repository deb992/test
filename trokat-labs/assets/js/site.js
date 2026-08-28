/* =====================================================================
   TROKAT LABS — site behaviour
   ===================================================================== */
(function () {
  'use strict';
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---- header ---- */
  var head = $('.masthead');
  if (head) {
    var last = 0;
    var onScroll = function () {
      var y = window.scrollY;
      head.classList.toggle('stuck', y > 20);
      head.classList.toggle('hide', y > 520 && y > last && !$('.drawer.open'));
      last = y;
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---- drawer ---- */
  var burger = $('.burger'), drawer = $('.drawer');
  if (burger && drawer) {
    $$('a', drawer).forEach(function (a, i) { a.style.setProperty('--d', (0.1 + i * 0.05) + 's'); });
    var set = function (open) {
      burger.setAttribute('aria-expanded', String(open));
      drawer.classList.toggle('open', open);
      document.body.style.overflow = open ? 'hidden' : '';
    };
    burger.addEventListener('click', function () { set(burger.getAttribute('aria-expanded') !== 'true'); });
    $$('a', drawer).forEach(function (a) { a.addEventListener('click', function () { set(false); }); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') set(false); });
  }

  /* ---- reveal ---- */
  var rev = $$('[data-reveal]');
  if (rev.length) {
    if (reduced || !('IntersectionObserver' in window)) {
      rev.forEach(function (el) { el.classList.add('in'); });
    } else {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
      }, { threshold: 0.1, rootMargin: '0px 0px -6% 0px' });
      rev.forEach(function (el) { io.observe(el); });
    }
  }

  /* ---- orbital ecosystem ---- */
  var stage = $('[data-orbit]');
  if (stage) {
    var canvas = $('canvas', stage);
    var card = $('.orbit__card', stage);
    var cardName = card ? $('b', card) : null;
    var cardText = card ? $('span', card) : null;
    var ctx = canvas.getContext('2d');
    var apps = JSON.parse(stage.getAttribute('data-orbit'));

    // three rings, outermost slowest — the further out, the newer the product
    var RINGS = [
      { r: 0.50, tilt: 0.36, speed: 0.00022, dir: 1 },
      { r: 0.72, tilt: 0.30, speed: -0.00016, dir: -1 },
      { r: 0.93, tilt: 0.25, speed: 0.00011, dir: 1 }
    ];

    var nodes = apps.map(function (a, i) {
      var ring = RINGS[i % RINGS.length];
      var per = Math.ceil(apps.length / RINGS.length);
      var idxInRing = Math.floor(i / RINGS.length);
      var img = new Image();
      img.src = a.icon;
      return {
        app: a, ring: ring, img: img, ready: false,
        phase: (idxInRing / per) * Math.PI * 2 + (i % RINGS.length) * 0.7,
        x: 0, y: 0, s: 1, hot: 0
      };
    });
    nodes.forEach(function (n) { n.img.onload = function () { n.ready = true; }; });

    var W = 0, H = 0, dpr = 1, hover = null, raf = null, t0 = performance.now(), paused = false;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = stage.clientWidth; H = stage.clientHeight;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function ringPath(ring, cx, cy, R) {
      ctx.beginPath();
      ctx.ellipse(cx, cy, R * ring.r, R * ring.r * ring.tilt, 0, 0, Math.PI * 2);
    }

    function frame(now) {
      var t = reduced ? 6000 : (now - t0);
      ctx.clearRect(0, 0, W, H);
      var cx = W / 2, cy = H / 2, R = Math.min(W, H) * 0.5;

      // orbit paths
      RINGS.forEach(function (ring, i) {
        ringPath(ring, cx, cy, R);
        ctx.strokeStyle = i === 1 ? 'rgba(248,122,24,.22)' : 'rgba(59,200,255,.16)';
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      // positions
      nodes.forEach(function (n) {
        var ang = n.phase + t * n.ring.speed * (paused ? 0.12 : 1);
        n.x = cx + Math.cos(ang) * R * n.ring.r;
        n.y = cy + Math.sin(ang) * R * n.ring.r * n.ring.tilt;
        var depth = (Math.sin(ang) + 1) / 2;          // 0 behind, 1 in front
        n.s = 0.78 + depth * 0.42;
        n.hot += ((hover === n ? 1 : 0) - n.hot) * 0.18;
      });

      nodes.slice().sort(function (a, b) { return a.y - b.y; }).forEach(function (n) {
        var size = R * 0.26 * n.s * (1 + n.hot * 0.16);
        if (n.hot > 0.02) {
          ctx.save();
          ctx.globalAlpha = n.hot * 0.5;
          var g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, size * 1.5);
          g.addColorStop(0, 'rgba(59,200,255,.85)');
          g.addColorStop(1, 'rgba(59,200,255,0)');
          ctx.fillStyle = g;
          ctx.beginPath(); ctx.arc(n.x, n.y, size * 1.5, 0, Math.PI * 2); ctx.fill();
          ctx.restore();
        }
        if (n.ready) {
          ctx.save();
          ctx.globalAlpha = 0.55 + 0.45 * ((n.s - 0.78) / 0.42);
          ctx.drawImage(n.img, n.x - size / 2, n.y - size / 2, size, size);
          ctx.restore();
        }
      });
      raf = requestAnimationFrame(frame);
    }

    function pick(mx, my) {
      var R = Math.min(W, H) * 0.5, best = null, bd = 1e9;
      nodes.forEach(function (n) {
        var size = R * 0.26 * n.s, d = Math.hypot(mx - n.x, my - n.y);
        if (d < size * 0.62 && d < bd) { bd = d; best = n; }
      });
      return best;
    }

    stage.addEventListener('mousemove', function (e) {
      var r = stage.getBoundingClientRect();
      var n = pick(e.clientX - r.left, e.clientY - r.top);
      if (n !== hover) {
        hover = n; paused = !!n;
        stage.style.cursor = n ? 'pointer' : '';
        if (card) {
          if (n) {
            cardName.textContent = n.app.name;
            cardText.textContent = n.app.blurb;
            card.classList.add('on');
          } else { card.classList.remove('on'); }
        }
      }
    });
    stage.addEventListener('mouseleave', function () {
      hover = null; paused = false; stage.style.cursor = '';
      if (card) card.classList.remove('on');
    });
    stage.addEventListener('click', function (e) {
      var r = stage.getBoundingClientRect();
      var n = pick(e.clientX - r.left, e.clientY - r.top);
      if (n && n.app.href) window.location.href = n.app.href;
    });

    resize(); raf = requestAnimationFrame(frame);
    window.addEventListener('resize', function () { resize(); });
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { if (raf) { cancelAnimationFrame(raf); raf = null; } }
      else if (!raf) { t0 = performance.now(); raf = requestAnimationFrame(frame); }
    });
  }

  /* ---- contact form ---- */
  var form = $('#contactForm');
  if (form) {
    var status = $('#formStatus'), submit = $('#formSubmit'), label = submit ? $('[data-label]', submit) : null;
    var bad = function (el, msg) {
      var w = el.closest('.field'); if (!w) return;
      w.classList.add('err'); var m = $('.field__msg', w); if (m) m.textContent = msg;
      el.setAttribute('aria-invalid', 'true');
    };
    var good = function (el) {
      var w = el.closest('.field'); if (w) w.classList.remove('err');
      el.removeAttribute('aria-invalid');
    };
    $$('input, textarea, select', form).forEach(function (el) {
      el.addEventListener('input', function () { good(el); });
      el.addEventListener('change', function () { good(el); });
    });

    var validate = function () {
      var ok = true, first = null;
      var need = function (sel, msg, test) {
        var el = $(sel, form); if (!el) return;
        var v = el.value.trim();
        if (!v || (test && !test(v))) { bad(el, msg); ok = false; first = first || el; } else good(el);
      };
      need('#name', 'Please tell us your name.');
      need('#email', 'That email address does not look right.', function (v) { return /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(v); });
      need('#message', 'Tell us a little about what you need.');
      if (first) { first.focus(); first.scrollIntoView({ block: 'center', behavior: reduced ? 'auto' : 'smooth' }); }
      return ok;
    };

    form.addEventListener('submit', function (e) {
      var hp = $('input[name="botcheck"]', form);
      // an unchecked checkbox still reports value "on" — test .checked
      if (hp && (hp.type === 'checkbox' ? hp.checked : hp.value.trim() !== '')) { e.preventDefault(); return; }
      if (!validate()) { e.preventDefault(); return; }

      var endpoint = form.getAttribute('action') || '';
      if (!/api\.web3forms\.com/.test(endpoint)) return;
      e.preventDefault();

      if (status) { status.className = 'status'; status.textContent = ''; }
      if (submit) { submit.setAttribute('aria-busy', 'true'); if (label) label.textContent = 'Sending…'; }

      var data = new FormData(form);
      var picked = $$('input[name="interest"]:checked', form).map(function (i) { return i.value; });
      data.set('interest', picked.length ? picked.join(', ') : 'Not specified');
      data.set('subject', 'TroKat Labs enquiry — ' + (data.get('name') || ''));

      fetch(endpoint, { method: 'POST', headers: { Accept: 'application/json' }, body: data })
        .then(function (r) { return r.json().then(function (j) { return { r: r, j: j }; }); })
        .then(function (o) {
          if (!o.r.ok || o.j.success === false) throw new Error('failed');
          var to = form.dataset.redirect;
          if (to) { window.location.href = to; return; }
          form.reset();
          if (status) { status.className = 'status ok'; status.textContent = 'Thanks — that reached us. We reply to everything within one business day.'; }
        })
        .catch(function () {
          if (status) {
            status.className = 'status bad';
            status.innerHTML = 'Something went wrong sending that. Please email <a class="link" href="mailto:deb@trokatlabs.com">deb@trokatlabs.com</a> or call <a class="link" href="tel:+12672517056">267-251-7056</a>.';
          }
        })
        .then(function () {
          if (submit) { submit.removeAttribute('aria-busy'); if (label) label.textContent = 'Send message'; }
        });
    });
  }

  $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
