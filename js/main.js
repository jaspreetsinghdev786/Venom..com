// mobile nav
const toggle = document.querySelector('.nav-toggle');
const nav = document.querySelector('.nav');
if (toggle && nav) toggle.addEventListener('click', () => nav.classList.toggle('open'));

// active nav link
const here = location.pathname.split('/').pop() || 'index.html';
document.querySelectorAll('.nav a').forEach((a) => {
  if (a.getAttribute('href') === here) a.classList.add('active');
});

// reveal on scroll
const io = new IntersectionObserver(
  (entries) => entries.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }),
  { threshold: 0, rootMargin: '0px 0px -5% 0px' }
);
document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

// contact form (frontend only, no backend yet)
const form = document.querySelector('#contact-form');
if (form) form.addEventListener('submit', (e) => {
  e.preventDefault();
  form.reset();
  document.querySelector('.form-ok').style.display = 'block';
});
