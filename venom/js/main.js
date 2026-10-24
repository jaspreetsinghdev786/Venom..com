// mobile nav
const toggle = document.querySelector('.nav-toggle');
const nav = document.querySelector('.nav');
if (toggle && nav) {
  const set = (open) => {
    nav.classList.toggle('open', open);
    toggle.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', open);
  };
  toggle.addEventListener('click', () => set(!nav.classList.contains('open')));
  nav.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => set(false)));
  addEventListener('keydown', (e) => e.key === 'Escape' && set(false));
}

// header state + active link
const header = document.querySelector('.site-header');
const onScroll = () => header.classList.toggle('scrolled', scrollY > 24);
onScroll();
addEventListener('scroll', onScroll, { passive: true });
const here = location.pathname.split('/').pop() || 'index.html';
document.querySelectorAll('.nav a').forEach((a) => {
  if (a.getAttribute('href') === here) a.classList.add('active');
});

// contact form (frontend only, no backend yet)
const form = document.querySelector('#contact-form');
if (form) form.addEventListener('submit', (e) => {
  e.preventDefault();
  form.reset();
  document.querySelector('.form-ok').style.display = 'block';
});

// motion
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
if (window.gsap && window.ScrollTrigger && !reduce) {
  gsap.registerPlugin(ScrollTrigger);

  if (window.Lenis) {
    const lenis = new Lenis({ lerp: 0.1 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  // line-mask title reveal
  gsap.from('.ln > span', { yPercent: 110, duration: 1.2, ease: 'expo.out', stagger: 0.12, delay: 0.15 });
  gsap.from('.hero-sub, .hero-row, .page-hero p', { opacity: 0, y: 30, duration: 1, ease: 'power3.out', delay: 0.7, stagger: 0.1 });

  // generic reveals
  ScrollTrigger.batch('.rv', {
    start: 'top 90%',
    once: true,
    onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.09 }),
  });

  // pinned horizontal services (desktop only)
  gsap.matchMedia().add('(min-width: 961px)', () => {
    const track = document.querySelector('.hscroll-track');
    if (!track) return;
    const dist = () => track.scrollWidth - innerWidth + 80;
    gsap.to(track, {
      x: () => -dist(),
      ease: 'none',
      scrollTrigger: { trigger: '.hscroll-pin', pin: true, scrub: 1, start: 'top top', end: () => '+=' + dist(), invalidateOnRefresh: true },
    });
  });

  // count-up
  document.querySelectorAll('[data-count]').forEach((el) => {
    const end = parseFloat(el.dataset.count);
    const suffix = el.dataset.suffix || '';
    const o = { v: 0 };
    ScrollTrigger.create({
      trigger: el, start: 'top 95%', once: true,
      onEnter: () => gsap.to(o, { v: end, duration: 2, ease: 'power2.out', onUpdate: () => (el.textContent = Math.round(o.v) + suffix) }),
    });
  });

  addEventListener('load', () => ScrollTrigger.refresh());

  // cursor glow + magnetic buttons (mouse only)
  if (matchMedia('(pointer: fine)').matches) {
    const c = document.querySelector('.cursor');
    if (c) {
      const x = gsap.quickTo(c, 'x', { duration: 0.6, ease: 'power3' });
      const y = gsap.quickTo(c, 'y', { duration: 0.6, ease: 'power3' });
      addEventListener('mousemove', (e) => { c.classList.add('on'); x(e.clientX); y(e.clientY); });
    }
    document.querySelectorAll('.btn').forEach((b) => {
      b.addEventListener('mousemove', (e) => {
        const r = b.getBoundingClientRect();
        b.style.setProperty('--bx', (e.clientX - r.left - r.width / 2) * 0.25 + 'px');
        b.style.setProperty('--by', (e.clientY - r.top - r.height / 2) * 0.35 + 'px');
      });
      b.addEventListener('mouseleave', () => { b.style.setProperty('--bx', '0px'); b.style.setProperty('--by', '0px'); });
    });
  }
} else {
  // no motion / no GSAP: show everything
  document.querySelectorAll('.rv').forEach((el) => { el.style.opacity = 1; el.style.transform = 'none'; });
  document.querySelectorAll('[data-count]').forEach((el) => { el.textContent = el.dataset.count + (el.dataset.suffix || ''); });
}
