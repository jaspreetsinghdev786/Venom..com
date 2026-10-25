// Venom Digital: small, dependency-free behaviour.

// mobile menu
const toggle = document.querySelector('.nav-toggle');
const nav = document.querySelector('.nav');
if (toggle && nav) {
  const set = (open) => {
    nav.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
  };
  toggle.addEventListener('click', () => set(!nav.classList.contains('open')));
  nav.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => set(false)));
  addEventListener('keydown', (e) => e.key === 'Escape' && set(false));
}

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;

// reveal on scroll
const targets = document.querySelectorAll('.rv');
if (reduce || !('IntersectionObserver' in window)) {
  targets.forEach((el) => el.classList.add('in'));
} else {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('in');
      io.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -8% 0px' });
  targets.forEach((el, i) => {
    el.style.setProperty('--d', `${(i % 4) * 0.07}s`);
    io.observe(el);
  });
}

// headline lines slide up from their mask
const slide = (s, i) => {
  if (reduce || !s.animate) return;
  s.animate([{ transform: 'translateY(110%)' }, { transform: 'translateY(0)' }],
    { duration: 950, delay: 120 + i * 120, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'backwards' });
};
document.querySelectorAll('.ln > span').forEach((s, i) => { if (!s.closest('.hero, .page-hero')) slide(s, i); });
// the home hero headline is animated by fx.js; if that never loads, do it here
setTimeout(() => {
  if (document.documentElement.classList.contains('fx')) return;
  document.documentElement.classList.add('fx-failed');
  document.querySelectorAll('.hero .ln > span, .page-hero .ln > span').forEach(slide);
}, 2000);

// count-up numbers
const counters = document.querySelectorAll('[data-count]');
const paint = (el, v) => { el.textContent = Math.round(v) + (el.dataset.suffix || ''); };
if (reduce || !('IntersectionObserver' in window)) {
  counters.forEach((el) => paint(el, +el.dataset.count));
} else {
  const co = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (!e.isIntersecting) return;
    const el = e.target; const end = +el.dataset.count; const t0 = performance.now();
    const tick = (t) => { const p = Math.min(1, (t - t0) / 1500); paint(el, end * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(tick); };
    requestAnimationFrame(tick); co.unobserve(el);
  }), { threshold: 0.5 });
  counters.forEach((el) => co.observe(el));
}

// service rows: hover (mouse) or click opens one at a time
const rows = document.querySelectorAll('.services .row');
const setRow = (r, on) => { r.classList.toggle('open', on); r.querySelector('.row-head').setAttribute('aria-expanded', String(on)); };
rows.forEach((r) => {
  r.querySelector('.row-head').addEventListener('click', () => {
    const was = r.classList.contains('open');
    rows.forEach((o) => setRow(o, false));
    setRow(r, fine ? true : !was);
  });
  if (fine) r.addEventListener('mouseenter', () => rows.forEach((o) => setRow(o, o === r)));
});

// platform wall: each name takes its brand colour on hover
document.querySelectorAll('.wall span[data-c]').forEach((s) => s.style.setProperty('--c', s.dataset.c));

// vinyl tilts toward the pointer (mouse only)
const hero = document.querySelector('.hero');
const vw = document.querySelector('.vinyl-wrap');
if (hero && vw && fine && !reduce) {
  hero.addEventListener('pointermove', (e) => {
    const r = hero.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    vw.style.setProperty('--ry', `${(x * 10).toFixed(2)}deg`);
    vw.style.setProperty('--rx', `${(-y * 10).toFixed(2)}deg`);
  });
  hero.addEventListener('pointerleave', () => { vw.style.setProperty('--rx', '0deg'); vw.style.setProperty('--ry', '0deg'); });
}

// magnetic buttons (mouse only)
if (fine && !reduce) {
  document.querySelectorAll('.btn').forEach((b) => {
    b.addEventListener('mousemove', (e) => {
      const r = b.getBoundingClientRect();
      b.style.setProperty('--bx', `${(e.clientX - r.left - r.width / 2) * 0.18}px`);
      b.style.setProperty('--by', `${(e.clientY - r.top - r.height / 2) * 0.28}px`);
    });
    b.addEventListener('mouseleave', () => { b.style.setProperty('--bx', '0px'); b.style.setProperty('--by', '0px'); });
  });
}

// client filter (text is read with dataset/textContent only)
const cf = document.querySelector('#client-filter');
if (cf) {
  const items = [...document.querySelectorAll('.sleeve')];
  const groupsEl = [...document.querySelectorAll('.bin-group')];
  const jumps = [...document.querySelectorAll('.az a')];
  const count = document.querySelector('#client-count');
  cf.addEventListener('input', () => {
    const q = cf.value.trim().toLowerCase();
    let n = 0;
    items.forEach((li) => { const hit = !q || li.dataset.name.toLowerCase().includes(q); li.hidden = !hit; if (hit) n++; });
    groupsEl.forEach((g, i) => {
      const any = g.querySelector('.sleeve:not([hidden])');
      g.hidden = !any;
      if (jumps[i]) jumps[i].hidden = !any;
    });
    count.textContent = n === 1 ? '1 client' : n + ' clients';
  });
}

// contact form
// With a real action URL (for example a Formspree endpoint) it posts there.
// Until then it opens the visitor's email app with the message filled in.
const form = document.querySelector('#contact-form');
if (form) {
  const status = form.querySelector('.form-status');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const action = form.getAttribute('action') || '';
    if (action && !action.includes('YOUR_FORM_ID')) {
      status.textContent = 'Sending…';
      try {
        const res = await fetch(action, { method: 'POST', body: data, headers: { Accept: 'application/json' } });
        if (!res.ok) throw new Error(String(res.status));
        form.reset();
        status.textContent = 'Thanks. Your message has been sent.';
      } catch {
        status.textContent = 'Could not send. Please email us directly instead.';
      }
      return;
    }
    const body = ['Name: ' + data.get('name'), 'Phone: ' + data.get('phone'), 'Service: ' + data.get('service'), '', data.get('message')].join('\n');
    location.href = 'mailto:' + form.dataset.email + '?subject=' + encodeURIComponent('Venom Digital enquiry from ' + data.get('name')) + '&body=' + encodeURIComponent(body);
    status.textContent = 'Your email app should open with the message ready to send.';
  });
}
