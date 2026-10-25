// Venom Digital: optional ambient sound. Synthesised with Web Audio, off until the visitor opts in.
let ctx, master, oscs = [], filter;

function build() {
  ctx = new (window.AudioContext || window.webkitAudioContext)();
  master = ctx.createGain();
  master.gain.value = 0;
  filter = ctx.createBiquadFilter();
  filter.type = 'lowpass'; filter.frequency.value = 500; filter.Q.value = 0.7;
  filter.connect(master); master.connect(ctx.destination);
  [55, 82.4, 110.3, 164.8].forEach((f, i) => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = i % 2 ? 'triangle' : 'sine'; o.frequency.value = f; g.gain.value = 0.16 / (i + 1);
    o.connect(g); g.connect(filter); o.start(); oscs.push(o);
  });
  const lfo = ctx.createOscillator(); const lg = ctx.createGain();
  lfo.frequency.value = 0.07; lg.gain.value = 220;
  lfo.connect(lg); lg.connect(filter.frequency); lfo.start();
}

export function initSound(btn, getProgress) {
  let on = false, tick = 0;
  const paint = () => { btn.setAttribute('aria-pressed', String(on)); btn.classList.toggle('on', on); };
  btn.addEventListener('click', async () => {
    on = !on;
    if (on) {
      if (!ctx) build();
      await ctx.resume();
      master.gain.setTargetAtTime(0.5, ctx.currentTime, 0.6);
      tick = setInterval(() => {
        const p = getProgress();
        filter.frequency.setTargetAtTime(380 + p * 1400, ctx.currentTime, 0.4);
        oscs.forEach((o, i) => o.detune.setTargetAtTime(p * 40 * (i + 1), ctx.currentTime, 0.4));
      }, 200);
    } else if (ctx) {
      master.gain.setTargetAtTime(0, ctx.currentTime, 0.3);
      clearInterval(tick);
      setTimeout(() => !on && ctx.suspend(), 1200);
    }
    paint();
  });
  paint();
}
