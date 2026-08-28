/* =====================================================================
   JUNIOR'S CHIMNEY — site behaviour
   ===================================================================== */
(function () {
  'use strict';

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $  = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));

  /* ---------- 1. Header: stick + hide-on-scroll-down ---------- */
  const masthead = $('.masthead');
  if (masthead) {
    let last = 0;
    const onScroll = () => {
      const y = window.scrollY;
      masthead.classList.toggle('is-stuck', y > 24);
      const drawerOpen = $('.drawer.is-open');
      masthead.classList.toggle('is-hidden', y > 560 && y > last && !drawerOpen);
      last = y;
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------- 2. Mobile drawer ---------- */
  const burger = $('.burger');
  const drawer = $('.drawer');
  if (burger && drawer) {
    $$('a', drawer).forEach((a, i) => a.style.setProperty('--d', (0.12 + i * 0.055) + 's'));
    const setOpen = (open) => {
      burger.setAttribute('aria-expanded', String(open));
      drawer.classList.toggle('is-open', open);
      document.body.style.overflow = open ? 'hidden' : '';
    };
    burger.addEventListener('click', () => setOpen(burger.getAttribute('aria-expanded') !== 'true'));
    $$('a', drawer).forEach((a) => a.addEventListener('click', () => setOpen(false)));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });
  }

  /* ---------- 3. Scroll reveal ---------- */
  const revealables = $$('[data-reveal]');
  if (revealables.length) {
    if (reduced || !('IntersectionObserver' in window)) {
      revealables.forEach((el) => el.classList.add('is-in'));
    } else {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in');
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
      revealables.forEach((el) => io.observe(el));
    }
  }

  /* ---------- 4. Scroll progress "flue" ---------- */
  const flue = $('.flue i');
  if (flue) {
    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      flue.style.setProperty('--p', (max > 0 ? (window.scrollY / max) * 100 : 0) + '%');
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
  }

  /* ---------- 5. Cursor ember glow ---------- */
  const glow = $('.cursor-glow');
  if (glow && !reduced && window.matchMedia('(hover:hover) and (pointer:fine)').matches) {
    let gx = 0, gy = 0, cx = 0, cy = 0, running = false;
    const loop = () => {
      cx += (gx - cx) * 0.09;
      cy += (gy - cy) * 0.09;
      glow.style.transform = `translate(${cx}px, ${cy}px)`;
      if (running) requestAnimationFrame(loop);
    };
    window.addEventListener('mousemove', (e) => {
      gx = e.clientX; gy = e.clientY;
      if (!running) { running = true; cx = gx; cy = gy; glow.classList.add('is-on'); requestAnimationFrame(loop); }
    }, { passive: true });
    document.addEventListener('mouseleave', () => glow.classList.remove('is-on'));
    document.addEventListener('mouseenter', () => glow.classList.add('is-on'));
  }

  /* ---------- 6. Ember particle field ---------- */
  const canvas = document.getElementById('emberCanvas');
  if (canvas && !reduced) {
    const ctx = canvas.getContext('2d');
    let w = 0, h = 0, dpr = 1, embers = [], raf = null, visible = true;

    const COLORS = ['255,196,107', '255,138,43', '255,90,22', '217,46,27'];

    function spawn(seed) {
      return {
        x: Math.random() * w,
        y: seed ? Math.random() * h : h + Math.random() * 60,
        r: Math.random() * 1.7 + 0.5,
        vy: -(Math.random() * 0.42 + 0.16),
        vx: (Math.random() - 0.5) * 0.22,
        life: 0,
        max: Math.random() * 340 + 200,
        c: COLORS[(Math.random() * COLORS.length) | 0],
        drift: Math.random() * Math.PI * 2,
        speed: Math.random() * 0.018 + 0.006
      };
    }

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const target = Math.round(Math.min(110, Math.max(34, (w * h) / 16000)));
      embers = Array.from({ length: target }, () => spawn(true));
    }

    function frame() {
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < embers.length; i++) {
        const p = embers[i];
        p.life++;
        p.drift += p.speed;
        p.x += p.vx + Math.sin(p.drift) * 0.34;
        p.y += p.vy;
        const t = p.life / p.max;
        const alpha = t < 0.14 ? t / 0.14 : Math.max(0, 1 - (t - 0.14) / 0.86);
        if (p.life >= p.max || p.y < -20) { embers[i] = spawn(false); continue; }
        const rad = p.r * (1 + Math.sin(p.drift * 2) * 0.15);
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, rad * 4.5);
        g.addColorStop(0, `rgba(${p.c},${(alpha * 0.95).toFixed(3)})`);
        g.addColorStop(0.35, `rgba(${p.c},${(alpha * 0.32).toFixed(3)})`);
        g.addColorStop(1, `rgba(${p.c},0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p.x, p.y, rad * 4.5, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(frame);
    }

    const start = () => { if (!raf && visible) { raf = requestAnimationFrame(frame); } };
    const stop  = () => { if (raf) { cancelAnimationFrame(raf); raf = null; } };

    resize();
    start();
    window.addEventListener('resize', () => { stop(); resize(); start(); });
    document.addEventListener('visibilitychange', () => {
      visible = !document.hidden;
      visible ? start() : stop();
    });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver((e) => {
        visible = e[0].isIntersecting && !document.hidden;
        visible ? start() : stop();
      }, { threshold: 0 }).observe(canvas);
    }
  }

  /* ---------- 7. Marquee: duplicate the group so the loop is seamless ---------- */
  $$('.marquee__track').forEach((track) => {
    const group = $('.marquee__group', track);
    if (group && track.children.length === 1) track.appendChild(group.cloneNode(true));
  });

  /* ---------- 8. Chimney anatomy: hotspots <-> list ---------- */
  const anatomy = $('[data-anatomy]');
  if (anatomy) {
    const items = $$('.anatomy__item', anatomy);
    const spots = $$('.hotspot', anatomy);
    const select = (key) => {
      items.forEach((el) => el.classList.toggle('is-active', el.dataset.part === key));
      spots.forEach((el) => el.classList.toggle('is-active', el.dataset.part === key));
    };
    items.forEach((el) => {
      el.addEventListener('mouseenter', () => select(el.dataset.part));
      el.addEventListener('focus', () => select(el.dataset.part));
      el.addEventListener('click', () => select(el.dataset.part));
    });
    spots.forEach((el) => {
      el.addEventListener('mouseenter', () => select(el.dataset.part));
      el.addEventListener('click', () => {
        select(el.dataset.part);
        const item = items.find((i) => i.dataset.part === el.dataset.part);
        if (item) item.scrollIntoView({ block: 'nearest', behavior: reduced ? 'auto' : 'smooth' });
      });
    });
    if (items[0]) select(items[0].dataset.part);
  }

  /* ---------- 9. Before / after slider ---------- */
  $$('.ba').forEach((ba) => {
    let dragging = false;
    const set = (clientX) => {
      const r = ba.getBoundingClientRect();
      const pct = Math.min(100, Math.max(0, ((clientX - r.left) / r.width) * 100));
      ba.style.setProperty('--pos', pct + '%');
      const handle = $('.ba__handle', ba);
      if (handle) handle.setAttribute('aria-valuenow', Math.round(pct));
    };
    const down = (e) => { dragging = true; set(e.touches ? e.touches[0].clientX : e.clientX); };
    const move = (e) => { if (dragging) set(e.touches ? e.touches[0].clientX : e.clientX); };
    const up   = () => { dragging = false; };
    ba.addEventListener('mousedown', down);
    ba.addEventListener('touchstart', down, { passive: true });
    window.addEventListener('mousemove', move, { passive: true });
    window.addEventListener('touchmove', move, { passive: true });
    window.addEventListener('mouseup', up);
    window.addEventListener('touchend', up);
    const handle = $('.ba__handle', ba);
    if (handle) {
      handle.addEventListener('keydown', (e) => {
        const cur = parseFloat(getComputedStyle(ba).getPropertyValue('--pos')) || 50;
        if (e.key === 'ArrowLeft')  { ba.style.setProperty('--pos', Math.max(0, cur - 4) + '%'); e.preventDefault(); }
        if (e.key === 'ArrowRight') { ba.style.setProperty('--pos', Math.min(100, cur + 4) + '%'); e.preventDefault(); }
      });
    }
  });

  /* ---------- 10. Mobile call bar ---------- */
  const callbar = $('.callbar');
  if (callbar) {
    const toggle = () => callbar.classList.toggle('is-visible', window.scrollY > 620);
    toggle();
    window.addEventListener('scroll', toggle, { passive: true });
  }

  /* ---------- 11. Contact form ---------- */
  const form = $('#quoteForm');
  if (form) {
    const status = $('#formStatus');
    const submit = $('#formSubmit');
    const submitLabel = submit ? submit.querySelector('[data-label]') : null;

    const setErr = (field, msg) => {
      const wrap = field.closest('.field');
      if (!wrap) return;
      wrap.classList.add('has-error');
      const box = $('.field__err', wrap);
      if (box) box.textContent = msg;
      field.setAttribute('aria-invalid', 'true');
    };
    const clearErr = (field) => {
      const wrap = field.closest('.field');
      if (wrap) wrap.classList.remove('has-error');
      field.removeAttribute('aria-invalid');
    };

    $$('input, textarea, select', form).forEach((el) => {
      el.addEventListener('input', () => clearErr(el));
      el.addEventListener('change', () => clearErr(el));
    });

    const validate = () => {
      let ok = true, first = null;
      const need = (sel, msg, test) => {
        const el = $(sel, form);
        if (!el) return;
        const val = el.value.trim();
        if (!val || (test && !test(val))) { setErr(el, msg); ok = false; first = first || el; }
        else clearErr(el);
      };
      need('#name', 'Please tell us your name.');
      need('#phone', 'A valid phone number, please — 10 digits.', (v) => v.replace(/\D/g, '').length >= 10);
      need('#email', 'That email address does not look right.', (v) => /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(v));
      need('#address', 'Street and town, so we know where we are headed.');
      if (first) { first.focus(); first.scrollIntoView({ block: 'center', behavior: reduced ? 'auto' : 'smooth' }); }
      return ok;
    };

    form.addEventListener('submit', async (e) => {
      // Honeypot: silently drop bots. Note an *unchecked* checkbox still reports
      // value "on", so this must test .checked — not .value.
      const hp = $('input[name="botcheck"]', form);
      const trapped = hp && (hp.type === 'checkbox' ? hp.checked : hp.value.trim() !== '');
      if (trapped) { e.preventDefault(); return; }

      if (!validate()) { e.preventDefault(); return; }

      const endpoint = form.getAttribute('action') || '';
      // Only intercept for the JSON API; anything else does a normal POST.
      if (!/api\.web3forms\.com/.test(endpoint)) return;

      e.preventDefault();
      if (status) { status.className = 'form-status'; status.textContent = ''; }
      if (submit) { submit.setAttribute('aria-busy', 'true'); if (submitLabel) submitLabel.textContent = 'Sending…'; }

      const data = new FormData(form);
      const services = $$('input[name="services"]:checked', form).map((i) => i.value);
      data.set('services', services.length ? services.join(', ') : 'Not specified');
      data.set('subject', 'New request from juniorschimney.com — ' + (data.get('name') || ''));

      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { Accept: 'application/json' },
          body: data
        });
        const out = await res.json().catch(() => ({}));
        if (res.ok && out.success !== false) {
          const target = form.dataset.redirect;
          if (target) { window.location.href = target; return; }
          form.reset();
          if (status) {
            status.className = 'form-status is-ok';
            status.textContent = 'Got it — thank you. Junior will call you back shortly. Need us today? Call (215) 526-3574.';
          }
        } else {
          throw new Error(out.message || 'Request failed');
        }
      } catch (err) {
        if (status) {
          status.className = 'form-status is-err';
          status.innerHTML = 'Something went wrong sending that. Please call <a class="link-u" href="tel:+12155263574">(215) 526-3574</a> or email <a class="link-u" href="mailto:info@juniorschimney.com">info@juniorschimney.com</a>.';
        }
      } finally {
        if (submit) { submit.removeAttribute('aria-busy'); if (submitLabel) submitLabel.textContent = 'Send my request'; }
      }
    });
  }

  /* ---------- 12. Current year ---------- */
  $$('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });
})();
