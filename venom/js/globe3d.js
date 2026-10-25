// Venom Digital: wireframe-dot globe with release arcs for the distribution section.
import * as THREE from 'three';

const CITIES = [[19.07, 72.88], [51.5, -0.12], [40.7, -74], [-33.9, 151.2], [25.2, 55.3], [1.35, 103.8], [34, -118.2], [28.6, 77.2]];
const ROUTES = [[0, 1], [0, 2], [0, 3], [0, 4], [7, 5], [1, 2], [2, 6], [4, 1]];

const toVec = (lat, lon, r = 1) => {
  const phi = THREE.MathUtils.degToRad(90 - lat), th = THREE.MathUtils.degToRad(lon + 180);
  return new THREE.Vector3(-r * Math.sin(phi) * Math.cos(th), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(th));
};

export function initGlobe(canvas, box, { animate = true } = {}) {
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true }); } catch { return null; }
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
  camera.position.z = 5;
  const root = new THREE.Group();
  root.rotation.x = 0.38;
  scene.add(root);

  root.add(new THREE.Mesh(new THREE.SphereGeometry(0.985, 48, 32), new THREE.MeshBasicMaterial({ color: 0x111113 })));

  // fibonacci sphere; a few overlapping sine waves stand in for continents
  const N = 2800, pos = new Float32Array(N * 3), col = new Float32Array(N * 3);
  const gold = new THREE.Color('#f0b90b'), dim = new THREE.Color('#34301f');
  for (let i = 0; i < N; i++) {
    const y = 1 - (2 * (i + 0.5)) / N, r = Math.sqrt(1 - y * y), th = i * 2.399963;
    const x = Math.cos(th) * r, z = Math.sin(th) * r;
    pos.set([x, y, z], i * 3);
    const land = Math.sin(x * 3.1 + 1.3) * Math.sin(y * 2.7 + 0.4) + Math.sin(z * 3.7 - x * 1.9) * 0.8 + Math.sin(y * 5.1 + z * 2.3) * 0.4;
    (land > 0.3 ? gold : dim).toArray(col, i * 3);
  }
  const dg = new THREE.BufferGeometry();
  dg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  dg.setAttribute('color', new THREE.BufferAttribute(col, 3));
  root.add(new THREE.Points(dg, new THREE.PointsMaterial({ size: 0.02, vertexColors: true, sizeAttenuation: true })));

  const curves = ROUTES.map(([a, b]) => {
    const va = toVec(...CITIES[a]), vb = toVec(...CITIES[b]);
    const mid = va.clone().add(vb).normalize().multiplyScalar(1 + 0.12 + va.distanceTo(vb) * 0.2);
    return new THREE.QuadraticBezierCurve3(va, mid, vb);
  });
  curves.forEach((c) => root.add(new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(c.getPoints(48)),
    new THREE.LineBasicMaterial({ color: 0xffd95a, transparent: true, opacity: 0.45 })
  )));

  const pg = new THREE.BufferGeometry();
  pg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(curves.length * 3), 3));
  root.add(new THREE.Points(pg, new THREE.PointsMaterial({ size: 0.075, color: 0xfff1b8 })));

  const state = { rot: 0 };
  let visible = true, raf = 0, t = 0, last = performance.now();

  const resize = () => {
    const r = canvas.getBoundingClientRect();
    const w = Math.max(1, r.width), h = Math.max(1, r.height);
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.position.z = 5 * Math.max(1, 1 / camera.aspect);
    camera.updateProjectionMatrix();
    draw(0);
  };

  function draw(dt) {
    t += dt;
    root.rotation.y = t * 0.12 + state.rot;
    const p = pg.attributes.position;
    curves.forEach((c, i) => {
      const v = c.getPoint((t * 0.22 + i * 0.37) % 1);
      p.setXYZ(i, v.x, v.y, v.z);
    });
    p.needsUpdate = true;
    renderer.render(scene, camera);
  }
  function loop(now) {
    raf = 0;
    if (!visible || document.hidden) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now; draw(dt);
    raf = requestAnimationFrame(loop);
  }
  const start = () => { if (!raf && animate && visible && !document.hidden) { last = performance.now(); raf = requestAnimationFrame(loop); } };

  const io = new IntersectionObserver((en) => { visible = en[0].isIntersecting; start(); }, { rootMargin: '100px' });
  io.observe(box);
  document.addEventListener('visibilitychange', start);
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize(); start();

  return { state, redraw: () => draw(0) };
}
