import * as THREE from 'three';
import { OrbitControls } from './vendor/OrbitControls.js';

const loading = document.querySelector('#loading');
try {
  start();
} catch (error) {
  loading.textContent = '无法启动 3D 场景，请使用支持 WebGL 的浏览器打开。';
  console.error(error);
}

function start() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#bce4e7');
  scene.fog = new THREE.Fog('#bce4e7', 22, 65);
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  document.querySelector('#scene').append(renderer.domElement);
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0.15, 1.65, 0);
  controls.enableDamping = true;
  controls.enablePan = false;
  controls.minDistance = 6.5;
  controls.maxDistance = 19;
  controls.maxPolarAngle = Math.PI * 0.48;
  function resetCamera() {
    camera.position.set(7.5, 5.3, 10.5).multiplyScalar(innerWidth < 600 ? 1.35 : 1);
    controls.target.set(0.15, 1.65, 0);
    controls.update();
  }
  resetCamera();
  scene.add(new THREE.HemisphereLight('#eefaff', '#6e9c81', 2.5));
  const sunlight = new THREE.DirectionalLight('#fff0d4', 3.2);
  sunlight.position.set(-3, 9, 7);
  sunlight.castShadow = true;
  sunlight.shadow.mapSize.set(2048, 2048);
  Object.assign(sunlight.shadow.camera, { left: -10, right: 10, top: 10, bottom: -10, near: 1, far: 25 });
  sunlight.shadow.normalBias = 0.035;
  sunlight.shadow.bias = -0.0001;
  scene.add(sunlight);

  const mat = (color, roughness = 0.7, metalness = 0) => new THREE.MeshStandardMaterial({ color, roughness, metalness });
  const white = mat('#fff9ea'), feather = mat('#eeeade'), bill = mat('#fbb94e'), pouch = mat('#eaa85b');
  const black = mat('#283a3b'), tire = mat('#253739'), teal = mat('#12878c', 0.3, 0.35);
  const chrome = mat('#c5d6d5', 0.3, 0.7), tan = mat('#bf7354'), orange = mat('#eda048');
  const sphere = new THREE.SphereGeometry(1, 32, 20);
  function ellipsoid(parent, material, position, scale) {
    const mesh = new THREE.Mesh(sphere, material);
    mesh.position.set(...position); mesh.scale.set(...scale);
    mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
  }
  function tube(parent, a, b, radius, material) {
    const av = new THREE.Vector3(...a), bv = new THREE.Vector3(...b);
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, av.distanceTo(bv), 12), material);
    mesh.position.copy(av).add(bv).multiplyScalar(0.5);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), bv.sub(av).normalize());
    mesh.castShadow = true; parent.add(mesh); return mesh;
  }
  function curve(parent, points, radius, material) {
    const path = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)));
    const mesh = new THREE.Mesh(new THREE.TubeGeometry(path, 32, radius, 10, false), material);
    mesh.castShadow = true; parent.add(mesh); return mesh;
  }

  // The fixed rider and moving scenery form a seamless ride in every camera view.
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(150, 150), mat('#53bec6', 0.28));
  sea.rotation.x = -Math.PI / 2; sea.position.y = -0.25; scene.add(sea);
  const coast = new THREE.Mesh(new THREE.BoxGeometry(90, 0.4, 7), mat('#d2dcac'));
  coast.position.y = -0.2; coast.receiveShadow = true; scene.add(coast);
  const road = new THREE.Mesh(new THREE.BoxGeometry(90, 0.045, 3.3), mat('#859d97'));
  road.position.y = 0.025; road.receiveShadow = true; scene.add(road);
  for (const z of [-1.56, 1.56]) {
    const edge = new THREE.Mesh(new THREE.BoxGeometry(90, 0.007, 0.045), mat('#e4e8cf'));
    edge.position.set(0, 0.052, z); scene.add(edge);
  }
  const moving = [];
  for (let i = 0; i < 22; i++) {
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.006, 0.055), mat('#e5ead6'));
    stripe.position.set(i * 2 - 22, 0.053, 0); scene.add(stripe); moving.push(stripe);
  }
  const grass = mat('#769d62');
  for (let i = 0; i < 28; i++) {
    const cluster = new THREE.Group();
    cluster.position.set(i * 1.6 - 22, 0, (i % 2 ? 1 : -1) * (2 + (i % 4) * 0.32));
    for (let j = 0; j < 4; j++) {
      const blade = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.17 + j * 0.035, 4), grass);
      blade.position.set(j * 0.05, 0.09, j % 2 * 0.05); blade.rotation.z = (j - 1.5) * 0.15; cluster.add(blade);
    }
    if (i % 5 === 0) ellipsoid(cluster, mat('#e7dbb6'), [0.2, 0.09, 0.1], [0.2, 0.1, 0.15]);
    scene.add(cluster); moving.push(cluster);
  }
  const ripples = [];
  const rippleMaterial = new THREE.MeshBasicMaterial({ color: '#a8e1db', transparent: true, opacity: 0.3 });
  for (let i = 0; i < 55; i++) {
    const ripple = new THREE.Mesh(new THREE.PlaneGeometry(0.6 + i % 4 * 0.3, 0.035), rippleMaterial);
    ripple.rotation.x = -Math.PI / 2;
    ripple.position.set((i * 7.13 % 50) - 25, -0.235, (i % 2 ? 1 : -1) * (4.2 + i % 11 * 1.1));
    scene.add(ripple); ripples.push(ripple);
  }
  // Palms sit beyond the riding lane and roll past without entering the bicycle.
  function palm(x, z) {
    const group = new THREE.Group(); group.position.set(x, 0, z);
    curve(group, [[0, 0, 0], [0.1, 1, 0], [0.4, 2.3, 0]], 0.09, mat('#9a8161'));
    const leafMaterial = mat('#428c73');
    for (let i = 0; i < 7; i++) {
      const angle = i * Math.PI * 2 / 7;
      const leaf = new THREE.Shape();
      leaf.moveTo(0, 0); leaf.quadraticCurveTo(0.7, 0.25, 1.35, 0); leaf.quadraticCurveTo(0.65, -0.25, 0, 0);
      const mesh = new THREE.Mesh(new THREE.ExtrudeGeometry(leaf, { depth: 0.025, bevelEnabled: false }), leafMaterial);
      mesh.rotation.set(-Math.PI / 2, 0.25, angle); mesh.position.set(0.4, 2.3, 0); mesh.castShadow = true; group.add(mesh);
    }
    scene.add(group); moving.push(group);
  }
  palm(-7, -2.8); palm(9, -3); palm(19, 2.8);

  const ride = new THREE.Group(); scene.add(ride);
  const wheels = [];
  const radius = 0.65, wheelHeight = radius + 0.054;
  function wheel(x) {
    const group = new THREE.Group(); group.position.set(x, wheelHeight, 0); ride.add(group);
    const rubber = new THREE.Mesh(new THREE.TorusGeometry(radius - 0.04, 0.04, 12, 64), tire); rubber.castShadow = true; group.add(rubber);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(radius - 0.086, 0.017, 8, 64), chrome); group.add(rim);
    for (let i = 0; i < 24; i++) {
      const a = i / 24 * Math.PI * 2;
      tube(group, [0, 0, i % 2 ? -0.022 : 0.022], [Math.cos(a) * 0.56, Math.sin(a) * 0.56, 0], 0.007, chrome);
    }
    ellipsoid(group, chrome, [0, 0, 0], [0.06, 0.06, 0.08]);
    ellipsoid(group, orange, [0.34, 0, 0.013], [0.07, 0.016, 0.017]);
    wheels.push(group);
  }
  wheel(-1.12); wheel(1.12);
  const rear = [-1.12, wheelHeight, 0], front = [1.12, wheelHeight, 0];
  const crankCenter = [-0.14, 0.79, 0], seat = [-0.55, 1.65, 0], head = [0.65, 1.63, 0];
  for (const [a, b] of [[rear, seat], [seat, crankCenter], [crankCenter, rear], [seat, head], [head, crankCenter]]) tube(ride, a, b, 0.044, teal);
  for (const z of [-0.085, 0.085]) {
    tube(ride, [head[0], head[1], z], [front[0], front[1], z], 0.033, teal);
    tube(ride, [rear[0], rear[1], z], [seat[0], seat[1], 0], 0.025, teal);
  }
  tube(ride, seat, [-0.6, 1.91, 0], 0.028, chrome);
  ellipsoid(ride, tan, [-0.61, 1.93, 0], [0.29, 0.06, 0.18]);
  tube(ride, head, [0.55, 1.96, 0], 0.029, chrome);
  curve(ride, [[0.55, 1.96, -0.42], [0.65, 2.03, -0.28], [0.55, 2.03, 0], [0.65, 2.03, 0.28], [0.55, 1.96, 0.42]], 0.028, chrome);
  for (const z of [-0.38, 0.38]) tube(ride, [0.55, 1.96, z - 0.07], [0.55, 1.96, z + 0.07], 0.043, tan);
  const gear = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.022, 8, 40), chrome); gear.position.set(-0.14, 0.79, 0.12); ride.add(gear);
  curve(ride, [[-1.12, wheelHeight + 0.075, 0.13], [-0.14, 0.95, 0.13], [0.02, 0.79, 0.13], [-0.14, 0.63, 0.13], [-1.12, wheelHeight - 0.075, 0.13], [-1.2, wheelHeight, 0.13], [-1.12, wheelHeight + 0.075, 0.13]], 0.009, black);

  const bird = new THREE.Group(); ride.add(bird);
  const body = ellipsoid(bird, white, [-0.67, 2.49, 0], [0.68, 0.68, 0.42]); body.rotation.z = -0.32;
  const breast = ellipsoid(bird, white, [-0.26, 2.5, 0], [0.36, 0.53, 0.37]); breast.rotation.z = 0.22;
  const tail = ellipsoid(bird, feather, [-1.22, 2.38, 0], [0.39, 0.14, 0.26]); tail.rotation.z = -0.32;
  curve(bird, [[-0.43, 2.75, 0], [-0.48, 3.06, 0], [-0.35, 3.43, 0], [-0.12, 3.64, 0]], 0.19, white);
  ellipsoid(bird, white, [-0.05, 3.64, 0], [0.32, 0.28, 0.25]);
  // The bill has a broad base, a narrow tip and the characteristic throat pouch.
  const beakShape = new THREE.Shape();
  beakShape.moveTo(0.15, 3.68); beakShape.lineTo(1.55, 3.58); beakShape.quadraticCurveTo(1.67, 3.53, 1.5, 3.5); beakShape.lineTo(0.16, 3.52); beakShape.closePath();
  const beakMesh = new THREE.Mesh(new THREE.ExtrudeGeometry(beakShape, { depth: 0.16, bevelEnabled: true, bevelSize: 0.025, bevelThickness: 0.025, bevelSegments: 3, steps: 1 }), bill);
  beakMesh.position.z = -0.08; beakMesh.castShadow = true; bird.add(beakMesh);
  const throat = ellipsoid(bird, pouch, [0.62, 3.47, 0], [0.61, 0.16, 0.105]); throat.rotation.z = 0.085;
  for (const side of [-1, 1]) {
    tube(bird, [0.22, 3.535, side * 0.101], [1.48, 3.515, side * 0.09], 0.006, tan);
    ellipsoid(bird, mat('#eecb72'), [0.01, 3.705, side * 0.228], [0.075, 0.075, 0.024]);
    ellipsoid(bird, black, [0.028, 3.71, side * 0.249], [0.038, 0.042, 0.014]);
    ellipsoid(bird, white, [0.04, 3.729, side * 0.261], [0.01, 0.012, 0.005]);
    const wing = ellipsoid(bird, feather, [-0.69, 2.48, side * 0.37], [0.55, 0.36, 0.1]); wing.rotation.z = -0.32;
    for (let i = 0; i < 6; i++) {
      const f = ellipsoid(bird, i % 2 ? white : feather, [-0.83 - i * 0.045, 2.33 + i * 0.065, side * 0.414], [0.25, 0.055, 0.035]); f.rotation.z = -0.35;
    }
    curve(bird, [[-0.29, 2.67, side * 0.3], [0.11, 2.46, side * 0.39], [0.38, 2.16, side * 0.4], [0.56, 2.03, side * 0.38]], 0.09, white);
    for (let j = 0; j < 3; j++) {
      const finger = ellipsoid(bird, feather, [0.58, 2 + j * 0.035, side * 0.39], [0.085, 0.023, 0.074]); finger.rotation.z = -0.45;
    }
  }

  const legParts = [];
  for (const side of [-1, 1]) {
    const upper = tube(ride, [0, 0, 0], [0, 1, 0], 0.052, orange);
    const lower = tube(ride, [0, 0, 0], [0, 1, 0], 0.042, orange);
    const knee = ellipsoid(ride, orange, [0, 0, 0], [0.059, 0.059, 0.06]);
    const foot = new THREE.Group(); ride.add(foot);
    const web = new THREE.Shape(); web.moveTo(-0.1, -0.07); web.lineTo(0.21, -0.14); web.lineTo(0.16, 0); web.lineTo(0.21, 0.14); web.lineTo(-0.1, 0.07); web.closePath();
    const webMesh = new THREE.Mesh(new THREE.ExtrudeGeometry(web, { depth: 0.035, bevelEnabled: true, bevelSize: 0.018, bevelThickness: 0.01, bevelSegments: 2 }), orange);
    webMesh.rotation.x = -Math.PI / 2; webMesh.castShadow = true; foot.add(webMesh);
    const pedal = new THREE.Mesh(new THREE.BoxGeometry(0.23, 0.05, 0.2), black); pedal.position.y = -0.045; foot.add(pedal);
    const arm = tube(ride, [0, 0, 0], [0, 1, 0], 0.018, chrome);
    legParts.push({ side, upper, lower, knee, foot, arm });
  }
  function setBone(mesh, a, b) {
    mesh.position.copy(a).add(b).multiplyScalar(0.5);
    mesh.scale.y = a.distanceTo(b);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
  }
  function animateRider(phase) {
    const bob = Math.sin(phase * 2) * 0.015;
    bird.position.y = bob;
    for (const part of legParts) {
      const a = -phase + (part.side === 1 ? 0 : Math.PI);
      const ankle = new THREE.Vector3(-0.14 + Math.cos(a) * 0.22, 0.79 + Math.sin(a) * 0.22 + 0.07, part.side * 0.26);
      const hip = new THREE.Vector3(-0.55, 2.07 + bob, part.side * 0.25);
      const delta = ankle.clone().sub(hip), d = delta.length();
      const length = 0.76;
      const middle = hip.clone().add(ankle).multiplyScalar(0.5);
      const bend = Math.sqrt(Math.max(0, length * length - d * d / 4));
      const knee = middle.add(new THREE.Vector3(delta.y, -delta.x, 0).normalize().multiplyScalar(bend));
      setBone(part.upper, hip, knee); setBone(part.lower, knee, ankle); part.knee.position.copy(knee);
      part.foot.position.copy(ankle);
      setBone(part.arm, new THREE.Vector3(-0.14, 0.79, part.side * 0.18), new THREE.Vector3(ankle.x, ankle.y - 0.07, part.side * 0.18));
    }
    wheels.forEach(w => { w.rotation.z = -phase * 2.4; });
  }
  let paused = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let speed = 1, phase = 0, previous = 0;
  const pause = document.querySelector('#pause');
  function updatePause() {
    pause.querySelector('span').textContent = paused ? '播放' : '暂停';
    pause.setAttribute('aria-label', paused ? '播放动画' : '暂停动画');
    pause.setAttribute('aria-pressed', String(paused));
    pause.querySelector('path').setAttribute('d', paused ? 'M8 5l10 7-10 7z' : 'M8 5v14M16 5v14');
  }
  updatePause();
  pause.addEventListener('click', () => { paused = !paused; updatePause(); });
  document.querySelector('#speed').addEventListener('input', e => {
    speed = Number(e.target.value); document.querySelector('#speed-value').value = `${speed.toFixed(1)}×`;
  });
  document.querySelector('#reset').addEventListener('click', resetCamera);
  function resize() {
    camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight);
  }
  addEventListener('resize', resize); resize();
  animateRider(0); loading.hidden = true;
  renderer.setAnimationLoop(now => {
    const dt = Math.min((now - previous) / 1000 || 0, 0.05); previous = now;
    if (!paused && !document.hidden) {
      phase += dt * 2.5 * speed;
      animateRider(phase);
      const distance = dt * 2.5 * speed * 2.4 * radius;
      for (const item of moving) { item.position.x -= distance; if (item.position.x < -22) item.position.x += 44; }
      for (const ripple of ripples) { ripple.position.x -= distance * 0.45; if (ripple.position.x < -25) ripple.position.x += 50; }
    }
    controls.update(); renderer.render(scene, camera);
  });
}
