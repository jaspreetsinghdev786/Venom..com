// Venom Digital: real-time 3D vinyl record (Three.js).
// Procedural textures only, so there are no model or image downloads.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const R = 1.6;          // record radius in scene units
const CAM_FOV = 32;
const CAM_Z = 7;
const GOLD = '#f0b90b';

function recordTexture() {
  const S = 2048, C = S / 2;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const g = c.getContext('2d');
  g.fillStyle = '#070708';
  g.fillRect(0, 0, S, S);

  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const lab = C * 0.33;

  for (let r = lab * 1.14; r < C * 0.972; r += 1.6) {
    g.strokeStyle = `rgba(210,210,222,${0.025 + rnd() * 0.09})`;
    g.lineWidth = 1;
    g.beginPath(); g.arc(C, C, r, 0, Math.PI * 2); g.stroke();
  }
  for (const f of [0.5, 0.64, 0.78, 0.9]) {            // gaps between tracks
    g.strokeStyle = 'rgba(0,0,0,.92)'; g.lineWidth = 7;
    g.beginPath(); g.arc(C, C, C * f, 0, Math.PI * 2); g.stroke();
  }
  g.strokeStyle = 'rgba(255,255,255,.10)'; g.lineWidth = 4;
  g.beginPath(); g.arc(C, C, C * 0.985, 0, Math.PI * 2); g.stroke();

  // gold label
  const lg = g.createRadialGradient(C - lab * 0.3, C - lab * 0.35, lab * 0.1, C, C, lab);
  lg.addColorStop(0, '#ffd95a'); lg.addColorStop(0.6, GOLD); lg.addColorStop(1, '#b98300');
  g.fillStyle = lg;
  g.beginPath(); g.arc(C, C, lab, 0, Math.PI * 2); g.fill();
  g.strokeStyle = 'rgba(21,15,0,.55)'; g.lineWidth = 3;
  g.beginPath(); g.arc(C, C, lab * 0.94, 0, Math.PI * 2); g.stroke();

  const arcText = (txt, radius, size, bottom, spacing) => {
    g.font = `800 ${size}px "Bricolage Grotesque", "Arial Black", sans-serif`;
    g.fillStyle = '#150f00'; g.textAlign = 'center'; g.textBaseline = 'middle';
    const ws = [...txt].map((ch) => g.measureText(ch).width + spacing);
    const total = ws.reduce((a, b) => a + b, 0);
    let off = 0;
    [...txt].forEach((ch, i) => {
      const mid = off + ws[i] / 2; off += ws[i];
      g.save(); g.translate(C, C);
      if (bottom) { g.rotate(Math.PI + (total / 2 - mid) / radius); g.translate(0, -radius); g.rotate(Math.PI); }
      else { g.rotate((mid - total / 2) / radius); g.translate(0, -radius); }
      g.fillText(ch, 0, 0); g.restore();
    });
  };
  arcText('VENOM', lab * 0.62, 118, false, 26);
  arcText('A COMPANY OF AME DIGITAL', lab * 0.66, 40, true, 12);
  g.fillStyle = '#150f00';
  g.fillRect(C - lab * 0.34, C - 3, lab * 0.68, 6);      // label rule

  g.fillStyle = '#0a0a0b';
  g.beginPath(); g.arc(C, C, C * 0.028, 0, Math.PI * 2); g.fill();

  const t = new THREE.CanvasTexture(c);
  t.flipY = false;                                        // cap UVs are upside down after rotateX
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

function sheenTexture() {
  const S = 1024, C = S / 2;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const g = c.getContext('2d');
  if (g.createConicGradient) {
    const gr = g.createConicGradient(0, C, C);
    const stops = [[0, 0], [0.05, 0.5], [0.11, 0], [0.5, 0], [0.56, 0.38], [0.62, 0], [1, 0]];
    stops.forEach(([o, a]) => gr.addColorStop(o, `rgba(255,236,185,${a})`));
    g.fillStyle = gr; g.fillRect(0, 0, S, S);
  }
  g.globalCompositeOperation = 'destination-out';          // keep the label clean
  g.beginPath(); g.arc(C, C, C * 0.34, 0, Math.PI * 2); g.fill();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function glowTexture(rgb, size = 256) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gr.addColorStop(0, `rgba(${rgb},1)`); gr.addColorStop(1, `rgba(${rgb},0)`);
  g.fillStyle = gr; g.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(c);
}

export function initVinyl(canvas, hero, { animate = true } = {}) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch { return null; }
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.55;

  const camera = new THREE.PerspectiveCamera(CAM_FOV, 1, 0.1, 50);
  camera.position.z = CAM_Z;

  const key = new THREE.DirectionalLight(0xfff4e0, 1.6); key.position.set(-3, 4, 5); scene.add(key);
  const rim = new THREE.PointLight(0xf0b90b, 70, 0, 2); rim.position.set(4, -1.5, 2.2); scene.add(rim);

  const root = new THREE.Group();
  scene.add(root);

  const face = new THREE.MeshPhysicalMaterial({
    map: recordTexture(), roughness: 0.34, metalness: 0.55, clearcoat: 0.6, clearcoatRoughness: 0.22
  });
  face.bumpMap = face.map; face.bumpScale = 0.8;
  const edge = new THREE.MeshStandardMaterial({ color: 0x0a0a0b, roughness: 0.4, metalness: 0.3 });
  const geo = new THREE.CylinderGeometry(R, R, 0.036, 160, 1);
  geo.rotateX(Math.PI / 2);                                // axis -> Z, label faces the camera
  const disc = new THREE.Mesh(geo, [edge, face, face]);
  root.add(disc);

  const sheen = new THREE.Mesh(
    new THREE.CircleGeometry(R * 0.995, 96),
    new THREE.MeshBasicMaterial({ map: sheenTexture(), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  sheen.position.z = 0.0195;
  root.add(sheen);

  const glow = new THREE.Mesh(
    new THREE.PlaneGeometry(7.5, 7.5),
    new THREE.MeshBasicMaterial({ map: glowTexture('240,185,11'), transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  glow.position.z = -0.5;
  root.add(glow);

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(R * 1.12, R * 1.125, 160),
    new THREE.MeshBasicMaterial({ color: GOLD, transparent: true, opacity: 0.35, side: THREE.DoubleSide })
  );
  ring.position.z = -0.12;
  root.add(ring);

  // gold dust drifting in front of and behind the record
  const N = 220;
  const dp = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) { dp[i * 3] = (Math.random() - 0.5) * 12; dp[i * 3 + 1] = (Math.random() - 0.5) * 7; dp[i * 3 + 2] = -3 + Math.random() * 5; }
  const dgeo = new THREE.BufferGeometry();
  dgeo.setAttribute('position', new THREE.BufferAttribute(dp, 3));
  const dust = new THREE.Points(dgeo, new THREE.PointsMaterial({
    map: glowTexture('255,217,90', 64), size: 0.09, transparent: true, opacity: 0.6, depthWrite: false, blending: THREE.AdditiveBlending
  }));
  scene.add(dust);

  // state driven by GSAP (see fx.js)
  const state = { p: 0, intro: animate ? 0 : 1, vel: 0 };
  let base = { x: 0, y: 0, s: 1, wide: true };
  let spinAngle = 0, boost = 0, px = 0, py = 0, tx = 0, ty = 0;
  let w = 1, h = 1, visible = true, raf = 0, last = performance.now();

  const layout = () => {
    const hh = Math.tan(THREE.MathUtils.degToRad(CAM_FOV / 2)) * CAM_Z;
    const hw = hh * (w / h);
    base = w >= 900
      ? { x: hw * 0.56, y: 0, s: Math.min(1.4, (hh * 1.12) / R), wide: true }
      : { x: hw * 0.3, y: -hh * 0.5, s: Math.min(1.1, (hw * 1.25) / R), wide: false };
  };

  const resize = () => {
    const r = hero.getBoundingClientRect();
    w = Math.max(1, r.width); h = Math.max(1, r.height);
    renderer.setPixelRatio(Math.min(devicePixelRatio, w < 700 ? 1.5 : 2));
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    layout(); draw(0);
  };

  const onMove = (e) => { tx = e.clientX / innerWidth - 0.5; ty = e.clientY / innerHeight - 0.5; };
  if (animate) addEventListener('pointermove', onMove, { passive: true });

  function draw(dt) {
    const k = state.p;
    const e = state.intro;
    px += (tx - px) * Math.min(1, dt * 3);
    py += (ty - py) * Math.min(1, dt * 3);
    boost += (state.vel - boost) * Math.min(1, dt * 4);
    spinAngle -= (0.7 + Math.abs(boost) * 1.3) * dt;

    const xEnd = base.wide ? base.x * 0.5 : base.x;
    root.position.set(base.x + (xEnd - base.x) * k, base.y * (1 - k), 0);
    const s = base.s * (0.7 + 0.3 * e) * (1 + 0.35 * k);
    root.scale.setScalar(s);
    root.rotation.set(
      0.3 * (1 - k) + py * 0.35,
      -0.5 * (1 - e) - 0.42 * (1 - k) + px * 0.5,
      -0.22 * k
    );
    disc.rotation.z = spinAngle;
    sheen.rotation.z = -px * 1.6 - k * 0.6;
    glow.material.opacity = 0.22 + 0.2 * k;
    rim.position.x = 4 - k * 2;

    const pos = dgeo.attributes.position;
    for (let i = 0; i < N; i++) {
      let y = pos.getY(i) + dt * (0.05 + (i % 5) * 0.012);
      if (y > 3.6) y = -3.6;
      pos.setY(i, y);
    }
    pos.needsUpdate = true;
    dust.position.y = k * 0.8;
    renderer.render(scene, camera);
  }

  function loop(now) {
    raf = 0;
    if (!visible || document.hidden) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    draw(dt);
    raf = requestAnimationFrame(loop);
  }
  const start = () => { if (!raf && animate && visible && !document.hidden) { last = performance.now(); raf = requestAnimationFrame(loop); } };

  const io = new IntersectionObserver((en) => { visible = en[0].isIntersecting; start(); }, { rootMargin: '100px' });
  io.observe(hero);
  document.addEventListener('visibilitychange', start);
  const ro = new ResizeObserver(resize);
  ro.observe(hero);
  resize();
  start();

  return {
    state,
    redraw: () => draw(0),
    dispose() {
      cancelAnimationFrame(raf); io.disconnect(); ro.disconnect();
      removeEventListener('pointermove', onMove);
      document.removeEventListener('visibilitychange', start);
      renderer.dispose();
    }
  };
}
