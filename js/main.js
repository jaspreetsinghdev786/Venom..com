// mobile nav
const toggle = document.querySelector('.nav-toggle');
const nav = document.querySelector('.nav');
if (toggle && nav) {
  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    toggle.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
  });
}

// active nav link
const here = location.pathname.split('/').pop() || 'index.html';
document.querySelectorAll('.nav a').forEach((a) => {
  if (a.getAttribute('href') === here) {
    a.classList.add('active');
    a.setAttribute('aria-current', 'page');
  }
});

// staggered reveal on scroll
const io = new IntersectionObserver(
  (entries) => entries.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }),
  { threshold: 0, rootMargin: '1000% 0px -8% 0px' }
);
const reveals = document.querySelectorAll('.reveal');
reveals.forEach((el, i) => {
  if (!el.style.getPropertyValue('--d')) el.style.setProperty('--d', `${(i % 4) * 0.06}s`);
  io.observe(el);
});
// safety: never leave content hidden if the observer misses something
setTimeout(() => reveals.forEach((el) => el.classList.add('in')), 3000);

// cursor spotlight on cards
document.querySelectorAll('.cell, .svc').forEach((card) => {
  card.addEventListener('pointermove', (e) => {
    const r = card.getBoundingClientRect();
    card.style.setProperty('--mx', `${e.clientX - r.left}px`);
    card.style.setProperty('--my', `${e.clientY - r.top}px`);
  });
});

// hero parallax (subtle)
const heroBg = document.querySelector('.hero-bg');
if (heroBg && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  addEventListener('scroll', () => {
    heroBg.style.transform = `scale(1.04) translateY(${scrollY * 0.12}px)`;
  }, { passive: true });
}

// contact form: client-side validation, no backend yet
const form = document.querySelector('#contact-form');
if (form) {
  const check = (input) => {
    const label = input.closest('label');
    let ok = input.checkValidity();
    if (input.type === 'email' && input.value) ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value);
    label.classList.toggle('invalid', !ok);
    return ok;
  };
  form.querySelectorAll('input, textarea').forEach((i) => i.addEventListener('blur', () => check(i)));
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const all = [...form.querySelectorAll('input, textarea')].map(check).every(Boolean);
    if (!all) return;
    form.reset();
    form.querySelector('.form-ok').style.display = 'block';
  });
}
