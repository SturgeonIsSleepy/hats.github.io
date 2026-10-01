import * as THREE from 'three';
import { OrbitControls } from './vendor/OrbitControls.js';
import { buildShonan } from './shonan.js';

const loading = document.querySelector('#loading');
try {
  start();
} catch (error) {
  loading.textContent = '无法启动 3D 场景，请使用支持 WebGL 的浏览器打开。';
  console.error(error);
}

function start() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#bdd1dc');
  scene.fog = new THREE.Fog('#c1d0d8', 110, 680);
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.95;
  document.querySelector('#scene').append(renderer.domElement);
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1800);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(-4, 1.8, 1.8);
  controls.enableDamping = true;
  controls.enablePan = false;
  controls.minDistance = 5;
  controls.maxDistance = 60;
  controls.maxPolarAngle = Math.PI * 0.48;
  let manualCamera = false;
  const cameraTarget = new THREE.Vector3(), cameraOffset = new THREE.Vector3();
  function resetCamera() {
    manualCamera = false;
    if (!lastPose) return;
    cameraTarget.set(lastPose.x, lastPose.y + 1.45, lastPose.z);
    const scale = innerWidth < 600 ? 1.25 : 1;
    cameraOffset.set(-Math.cos(lastPose.angle) * 8.5, 4.5, -8).multiplyScalar(scale);
    controls.target.copy(cameraTarget); camera.position.copy(cameraTarget).add(cameraOffset); controls.update();
  }
  controls.addEventListener('start', () => { manualCamera = true; });
  scene.add(new THREE.HemisphereLight('#d9eaff', '#807463', 1.7));
  const sunlight = new THREE.DirectionalLight('#fff4df', 3.0);
  sunlight.position.set(-18, 30, -25);
  sunlight.castShadow = true;
  sunlight.shadow.mapSize.set(2048, 2048);
  Object.assign(sunlight.shadow.camera, { left: -36, right: 36, top: 36, bottom: -36, near: 1, far: 110 });
  sunlight.shadow.normalBias = 0.035;
  sunlight.shadow.bias = -0.0001;
  scene.add(sunlight, sunlight.target);

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

  const shonan = buildShonan(scene);

  const ride = new THREE.Group(); ride.name = "PelicanCyclist"; ride.scale.setScalar(0.7); scene.add(ride);
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
  let speed = 1, phase = 0, previous = 0, time = 4;
  let lastPose = null;
  function placeRider(pose) {
    ride.position.set(pose.x, pose.y - 0.0378, pose.z);
    ride.rotation.set(0, pose.angle, 0);
    const newTarget = new THREE.Vector3(pose.x, pose.y + 1.45, pose.z);
    if (lastPose) {
      const delta = newTarget.clone().sub(cameraTarget);
      controls.target.add(delta); camera.position.add(delta);
    }
    cameraTarget.copy(newTarget);
    sunlight.position.set(pose.x - 18, 30, pose.z - 25);
    sunlight.target.position.set(pose.x, 0, pose.z);
    if (lastPose) {
      const distance = Math.hypot(pose.x - lastPose.x, pose.z - lastPose.z);
      if (pose.moving && distance < 0.3) phase += distance / (radius * 0.7 * 2.4);
    }
    lastPose = pose;
    animateRider(phase);
  }
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
  placeRider(shonan.update(time, 1)); resetCamera(); loading.hidden = true;
  renderer.setAnimationLoop(now => {
    const dt = Math.min((now - previous) / 1000 || 0, 0.05); previous = now;
    if (!paused && !document.hidden) {
      time += dt * speed;
      placeRider(shonan.update(time, dt * speed));
    }
    if (!manualCamera) {
      const scale = innerWidth < 600 ? 1.25 : 1;
      cameraOffset.set(-Math.cos(lastPose.angle) * 8.5, 4.5, -8).multiplyScalar(scale);
      const desired = cameraTarget.clone().add(cameraOffset);
      camera.position.lerp(desired, 1 - Math.exp(-dt * 3));
      controls.target.copy(cameraTarget);
    }
    controls.update(); renderer.render(scene, camera);
  });
}
