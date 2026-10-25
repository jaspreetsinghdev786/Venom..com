// Venom Digital: motion layer. GSAP + ScrollTrigger + SplitText + Lenis, plus the Three.js scenes.
// Everything here is progressive enhancement; the page works without it (see main.js fallback).
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger.js';
import { SplitText } from 'gsap/SplitText.js';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger, SplitText);
document.documentElement.classList.add('fx');

const mm = gsap.matchMedia();
const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
const root = document.documentElement;

// smooth scroll, wired into GSAP's ticker so ScrollTrigger stays in sync
mm.add('(prefers-reduced-motion: no-preference)', () => {
  if (!fine) return;
  const lenis = new Lenis({ lerp: 0.1, anchors: true });
  lenis.on('scroll', ScrollTrigger.update);
  const tick = (t) => lenis.raf(t * 1000);
  gsap.ticker.add(tick);
  gsap.ticker.lagSmoothing(0);
  return () => { gsap.ticker.remove(tick); lenis.destroy(); };
});

// ---------- hero ----------
const hero = document.querySelector('.hero');
const chars = [];
if (hero) {
  document.querySelectorAll('.hero h1 .ln > span').forEach((s) => {
    chars.push(...SplitText.create(s, { type: 'chars', charsClass: 'ch' }).chars);
  });
}

mm.add({ motion: '(prefers-reduced-motion: no-preference)', wide: '(min-width: 900px)' }, (ctx) => {
  if (!hero) return;
  const { motion } = ctx.conditions;
  const sub = hero.querySelector('.hero-sub');

  if (motion) {
    gsap.set('.hero h1 .ln', { perspective: 800 });
    gsap.set(chars, { yPercent: 115, rotationX: -85, opacity: 0, transformOrigin: '50% 100% -0.2em' });
    gsap.set(sub, { y: 28, opacity: 0 });
    gsap.timeline({ defaults: { ease: 'expo.out' } })
      .to(chars, { yPercent: 0, rotationX: 0, opacity: 1, duration: 1.25, stagger: 0.05 }, 0.1)
      .to(sub, { y: 0, opacity: 1, duration: 1.1 }, 0.7);
  }
  return () => {};
});

// 3D scenes load after first paint; failure leaves the CSS/SVG fallbacks in place
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

if (hero) {
  const canvas = hero.querySelector('.gl3d');
  import('./vinyl3d.js').then(({ initVinyl }) => {
    const v = canvas && initVinyl(canvas, hero, { animate: !reduce });
    if (!v) return;
    hero.classList.add('gl');
    if (!reduce) gsap.to(v.state, { intro: 1, duration: 2, ease: 'expo.out', delay: 0.15 });

    mm.add({ motion: '(prefers-reduced-motion: no-preference)', wide: '(min-width: 900px)' }, (ctx) => {
      if (!ctx.conditions.motion) return;
      const wide = ctx.conditions.wide;
      const copy = hero.querySelector('.hero-copy');
      const beat = hero.querySelector('.hero-beat');

      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: hero,
          start: 'top top',
          end: wide ? '+=90%' : 'bottom top',
          pin: wide,
          scrub: 1.1,
          onUpdate: (self) => { v.state.vel = gsap.utils.clamp(-8, 8, self.getVelocity() / 600); }
        }
      });
      tl.to(v.state, { p: 1, duration: 1 }, 0)
        .to(copy, { yPercent: wide ? -8 : -14, opacity: 0, ease: 'power1.in', duration: 0.55 }, 0.05);
      if (beat && wide) tl.fromTo(beat, { opacity: 0, y: 40 }, { opacity: 1, y: 0, ease: 'power2.out', duration: 0.3 }, 0.6);

      const settle = ScrollTrigger.create({ trigger: document.body, start: 0, end: 'max', onUpdate: (s) => { if (!tl.scrollTrigger.isActive) v.state.vel = gsap.utils.clamp(-8, 8, s.getVelocity() / 600); } });
      return () => { settle.kill(); v.state.p = 0; v.state.vel = 0; };
    });
    if (reduce) v.redraw();
  }).catch(() => {});
}

// ---------- full-page world: camera flies along a path as you scroll ----------
const worldCanvas = document.querySelector('.world');
const loader = document.querySelector('.loader');
const progress = () => {
  const max = root.scrollHeight - innerHeight;
  return max > 0 ? Math.min(1, scrollY / max) : 0;
};
const hideLoader = () => {
  if (!loader) return;
  loader.classList.add('done');
  setTimeout(() => loader.remove(), 900);
};
const ready = [document.fonts?.ready, new Promise((r) => (document.readyState === 'complete' ? r() : addEventListener('load', r)))];
if (worldCanvas) {
  ready.push(import('./world3d.js').then(({ initWorld }) => {
    const wd = initWorld(worldCanvas, { animate: !reduce });
    if (wd) root.classList.add('world-on');
  }).catch(() => {}));
}
Promise.all(ready).then(() => setTimeout(hideLoader, 450));
setTimeout(hideLoader, 5000);

const soundBtn = document.querySelector('.sound');
if (soundBtn) import('./sound.js').then(({ initSound }) => initSound(soundBtn, progress)).catch(() => soundBtn.remove());

// ---------- inner pages ----------
const pageHero = document.querySelector('.page-hero');
if (pageHero) {
  const pc = [];
  pageHero.querySelectorAll('h1 .ln > span').forEach((s) => pc.push(...SplitText.create(s, { type: 'chars', charsClass: 'ch' }).chars));
  mm.add('(prefers-reduced-motion: no-preference)', () => {
    gsap.set('.page-hero h1 .ln', { perspective: 800 });
    gsap.set(pc, { yPercent: 115, rotationX: -85, opacity: 0, transformOrigin: '50% 100% -0.2em' });
    gsap.timeline({ defaults: { ease: 'expo.out' } })
      .to(pc, { yPercent: 0, rotationX: 0, opacity: 1, duration: 1.2, stagger: 0.04 }, 0.15)
      .from('.page-hero .crumbs, .page-hero .wrap > p:not(.crumbs)', { y: 24, opacity: 0, duration: 1, stagger: 0.12 }, 0.5);
    // the decorative record rolls away as you scroll
    gsap.to(pageHero, { '--roll': 1, ease: 'none', scrollTrigger: { trigger: pageHero, start: 'top top', end: 'bottom top', scrub: true } });
    // list rows and groups slide in from the left as they pass
    gsap.utils.toArray('.svc-group, .contact-info div, .client-list li:nth-child(-n+12)').forEach((el) => {
      gsap.from(el, { x: -36, opacity: 0, duration: 0.9, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
    });
    // artist cards tilt toward the pointer
    if (fine) gsap.utils.toArray('.artist').forEach((a) => {
      const rx = gsap.quickTo(a, 'rotationX', { duration: 0.5, ease: 'power3.out' });
      const ry = gsap.quickTo(a, 'rotationY', { duration: 0.5, ease: 'power3.out' });
      gsap.set(a, { transformPerspective: 900 });
      a.addEventListener('pointermove', (e) => {
        const r = a.getBoundingClientRect();
        ry(((e.clientX - r.left) / r.width - 0.5) * 12); rx(-((e.clientY - r.top) / r.height - 0.5) * 12);
      });
      a.addEventListener('pointerleave', () => { rx(0); ry(0); });
    });
  });
}

// ---------- distribution globe ----------
const globeCanvas = document.querySelector('.globe3d');
if (globeCanvas) {
  import('./globe3d.js').then(({ initGlobe }) => {
    const g = initGlobe(globeCanvas, globeCanvas.parentElement, { animate: !reduce });
    if (!g) return;
    globeCanvas.classList.add('on');
    if (reduce) return;
    gsap.to(g.state, {
      rot: 2.4, ease: 'none',
      scrollTrigger: { trigger: '.dist', start: 'top bottom', end: 'bottom top', scrub: 1 }
    });
  }).catch(() => {});
}

// ---------- scroll-linked details ----------
mm.add('(prefers-reduced-motion: no-preference)', () => {
  // big headings: lines rise out of a mask
  document.querySelectorAll('.h2').forEach((h) => {
    SplitText.create(h, {
      type: 'lines', mask: 'lines', autoSplit: true,
      onSplit: (self) => gsap.from(self.lines, {
        yPercent: 110, duration: 1.1, stagger: 0.09, ease: 'expo.out',
        scrollTrigger: { trigger: h, start: 'top 88%', once: true }
      })
    });
  });

  // the big "150" drifts against the scroll
  gsap.fromTo('.big-num', { yPercent: 8 }, {
    yPercent: -10, ease: 'none',
    scrollTrigger: { trigger: '.dist', start: 'top bottom', end: 'bottom top', scrub: true }
  });

  // marquee leans into scroll speed
  const track = document.querySelector('.marquee');
  if (track) {
    const skew = gsap.quickTo(track, 'skewX', { duration: 0.5, ease: 'power3.out' });
    ScrollTrigger.create({
      start: 0, end: 'max',
      onUpdate: (s) => skew(gsap.utils.clamp(-8, 8, s.getVelocity() / -250)),
    });
    ScrollTrigger.addEventListener('scrollEnd', () => skew(0));
  }

  // numbered columns count their weight in as they pass
  gsap.utils.toArray('.why-col b').forEach((b) => {
    gsap.fromTo(b, { yPercent: 25 }, {
      yPercent: -15, ease: 'none',
      scrollTrigger: { trigger: b, start: 'top bottom', end: 'bottom top', scrub: true }
    });
  });
});

// ---------- cursor ring (mouse only) ----------
mm.add('(prefers-reduced-motion: no-preference)', () => {
  if (!fine) return;
  const ring = document.createElement('div');
  ring.className = 'cur';
  ring.setAttribute('aria-hidden', 'true');
  document.body.append(ring);
  const x = gsap.quickTo(ring, 'x', { duration: 0.35, ease: 'power3.out' });
  const y = gsap.quickTo(ring, 'y', { duration: 0.35, ease: 'power3.out' });
  const move = (e) => { x(e.clientX); y(e.clientY); ring.classList.add('show'); };
  const over = (e) => ring.classList.toggle('big', !!e.target.closest('a, button, summary, .track, .row-head'));
  const leave = () => ring.classList.remove('show');
  addEventListener('pointermove', move, { passive: true });
  addEventListener('pointerover', over, { passive: true });
  document.documentElement.addEventListener('pointerleave', leave);
  return () => {
    removeEventListener('pointermove', move); removeEventListener('pointerover', over);
    document.documentElement.removeEventListener('pointerleave', leave); ring.remove();
  };
});

document.fonts?.ready.then(() => ScrollTrigger.refresh());
addEventListener('load', () => ScrollTrigger.refresh());
