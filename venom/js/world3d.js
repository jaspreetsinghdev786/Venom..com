// Venom Digital: fixed full-page WebGL world. The camera flies along a curved path as the page scrolls.
// Gold lines and dark records only, one accent. No model or image downloads.
import * as THREE from 'three';

const GOLD = 0xf0b90b;

function labelTexture() {
  const S = 256, C = S / 2;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const g = c.getContext('2d');
  g.fillStyle = '#08080a'; g.fillRect(0, 0, S, S);
  for (let r = 40; r < C - 2; r += 3) {
    g.strokeStyle = `rgba(210,210,222,${0.05 + ((r * 7) % 10) / 120})`;
    g.beginPath(); g.arc(C, C, r, 0, Math.PI * 2); g.stroke();
  }
  g.fillStyle = '#f0b90b'; g.beginPath(); g.arc(C, C, 34, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#150f00'; g.beginPath(); g.arc(C, C, 4, 0, Math.PI * 2); g.fill();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function dotTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,217,90,1)'); gr.addColorStop(1, 'rgba(255,217,90,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

export function initWorld(canvas, { animate = true } = {}) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch { return null; }
  const small = innerWidth < 700;
  const seed = parseFloat(canvas.dataset.seed || '0');
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x09090a, 0.045);
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 120);

  // the flight path
  const pts = [];
  for (let i = 0; i < 9; i++) pts.push(new THREE.Vector3(Math.sin(i * 1.3 + seed) * 3.2, Math.cos(i * 0.9 + seed * 0.7) * 1.8, -i * 9));
  const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.5);

  const rig = new THREE.Group();
  scene.add(rig);

  // rings around the path
  const RINGS = small ? 36 : 64;
  const ringGeo = new THREE.BufferGeometry().setFromPoints(
    Array.from({ length: 97 }, (_, i) => new THREE.Vector3(Math.cos((i / 96) * Math.PI * 2), Math.sin((i / 96) * Math.PI * 2), 0))
  );
  const ringMat = new THREE.LineBasicMaterial({ color: GOLD, transparent: true, opacity: 0.34 });
  const up = new THREE.Vector3(0, 0, 1);
  for (let i = 0; i < RINGS; i++) {
    const t = i / (RINGS - 1);
    const ring = new THREE.LineLoop(ringGeo, ringMat);
    const p = curve.getPointAt(t);
    const tan = curve.getTangentAt(t);
    ring.position.copy(p);
    ring.quaternion.setFromUnitVectors(up, tan);
    ring.scale.setScalar(4.2 + Math.sin(i * 0.7) * 0.9);
    rig.add(ring);
  }

  // records floating beside the path, one per section
  const lab = labelTexture();
  const faceMat = new THREE.MeshStandardMaterial({ map: lab, roughness: 0.4, metalness: 0.6 });
  const edgeMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0b, roughness: 0.5, metalness: 0.3 });
  const discGeo = new THREE.CylinderGeometry(1.5, 1.5, 0.04, 72);
  const discs = [];
  const T = [0.1, 0.22, 0.34, 0.47, 0.6, 0.72, 0.85];
  T.forEach((t, i) => {
    const m = new THREE.Mesh(discGeo, [edgeMat, faceMat, faceMat]);
    const side = i % 2 ? 1 : -1;
    const p = curve.getPointAt(t);
    m.position.set(p.x + side * (small ? 2.4 : 4.4), p.y + (i % 3 - 1) * 1.4, p.z);
    m.rotation.set(Math.PI / 2 + 0.5 * side, 0.3, 0.4 * side);
    m.userData.spin = 0.3 + (i % 3) * 0.12;
    rig.add(m);
    discs.push(m);
  });

  scene.add(new THREE.AmbientLight(0xffffff, 0.5));
  const key = new THREE.DirectionalLight(0xfff4e0, 1.4);
  key.position.set(-3, 4, 5);
  scene.add(key);
  const cam = new THREE.PointLight(GOLD, 24, 0, 2);
  scene.add(cam);

  // dust
  const N = small ? 260 : 600;
  const dp = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    const p = curve.getPointAt(Math.random());
    dp[i * 3] = p.x + (Math.random() - 0.5) * 16;
    dp[i * 3 + 1] = p.y + (Math.random() - 0.5) * 10;
    dp[i * 3 + 2] = p.z + (Math.random() - 0.5) * 8;
  }
  const dg = new THREE.BufferGeometry();
  dg.setAttribute('position', new THREE.BufferAttribute(dp, 3));
  scene.add(new THREE.Points(dg, new THREE.PointsMaterial({
    map: dotTexture(), size: 0.12, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending
  })));

  const state = { vel: 0 };
  let t = 0, tx = 0, ty = 0, px = 0, py = 0, w = 1, h = 1, raf = 0, last = performance.now(), live = true;
  const look = new THREE.Vector3();

  const target = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    return max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0;
  };

  const resize = () => {
    w = Math.max(1, innerWidth); h = Math.max(1, innerHeight);
    renderer.setPixelRatio(Math.min(devicePixelRatio, small ? 1.25 : 1.75));
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    draw(0, true);
  };

  function draw(dt, snap) {
    const goal = target();
    t = snap ? goal : t + (goal - t) * Math.min(1, dt * 3.2);
    state.vel = (goal - t) * 40;
    px += (tx - px) * Math.min(1, dt * 3); py += (ty - py) * Math.min(1, dt * 3);

    const tt = Math.min(0.985, t);
    const p = curve.getPointAt(tt);
    curve.getPointAt(Math.min(1, tt + 0.015), look);
    camera.position.copy(p);
    camera.position.x += px * 0.8; camera.position.y -= py * 0.5;
    camera.lookAt(look);
    camera.rotateZ(THREE.MathUtils.clamp(state.vel, -0.35, 0.35) * 0.4);
    cam.position.copy(p);
    for (const d of discs) d.rotation.y += d.userData.spin * dt;
    renderer.render(scene, camera);
  }

  function loop(now) {
    raf = 0;
    if (!live || document.hidden) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    draw(dt, false);
    raf = requestAnimationFrame(loop);
  }
  const start = () => { if (!raf && animate && live && !document.hidden) { last = performance.now(); raf = requestAnimationFrame(loop); } };
  const onMove = (e) => { tx = e.clientX / innerWidth - 0.5; ty = e.clientY / innerHeight - 0.5; };
  // reduced motion: no loop, repaint only when the page scrolls
  const onScroll = () => draw(0, true);

  addEventListener('resize', resize);
  document.addEventListener('visibilitychange', start);
  if (animate) addEventListener('pointermove', onMove, { passive: true });
  else addEventListener('scroll', onScroll, { passive: true });
  resize();
  start();

  return {
    state,
    setLive(v) { live = v; start(); },
    dispose() {
      cancelAnimationFrame(raf);
      removeEventListener('resize', resize); removeEventListener('pointermove', onMove); removeEventListener('scroll', onScroll);
      document.removeEventListener('visibilitychange', start);
      renderer.dispose();
    }
  };
}
