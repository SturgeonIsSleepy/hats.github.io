import * as THREE from 'three';
import { geography } from './geography.js';
import { buildings } from './buildings.js';

// Railway, road and platform follow mapped coordinates. Buildings are actual
// PLATEAU LOD1 meshes; facade detail is reconstructed from reference photos.
export function buildShonan(scene) {
  const world = new THREE.Group(); world.name = 'Kamakurakokomae'; scene.add(world);
  const materialCache = new Map();
  const material = (color, roughness = 0.8, metalness = 0) => {
    const key = `${color}/${roughness}/${metalness}`;
    if (!materialCache.has(key)) materialCache.set(key, new THREE.MeshStandardMaterial({ color, roughness, metalness }));
    return materialCache.get(key);
  };
  const concrete = material('#99958a'), cream = material('#ded6b3'), steel = material('#717c79', 0.4, 0.7);
  const dark = material('#252d2b'), green = material('#245a40', 0.35, 0.25), yellow = material('#e9b93f');
  const glass = material('#254a56', 0.14, 0.45);
  const sand = material('#9c907b');
  function grain(base, amplitude, repeat) {
    const data = new Uint8Array(128 * 128 * 4);
    for (let i = 0; i < 128 * 128; i++) {
      const noise = ((Math.sin(i * 127.1 + 31.7) * 43758.5453) % 1) * amplitude;
      for (let j = 0; j < 3; j++) data[i * 4 + j] = base[j] + noise;
      data[i * 4 + 3] = 255;
    }
    const texture = new THREE.DataTexture(data, 128, 128); texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping; texture.repeat.set(...repeat); texture.needsUpdate = true;
    return texture;
  }
  const asphalt = material('#ffffff'); asphalt.map = grain([88, 89, 88], 17, [60, 4]); asphalt.bumpMap = asphalt.map; asphalt.bumpScale = 0.018;
  concrete.map = grain([177, 173, 163], 12, [8, 2]);
  sand.map = grain([195, 181, 157], 17, [40, 10]);
  const ballastMaterial = material('#aaa79c'); ballastMaterial.map = grain([119, 120, 114], 45, [90, 3]); ballastMaterial.bumpMap = ballastMaterial.map; ballastMaterial.bumpScale = 0.08;
  function box(parent, dimensions, position, mat, shadow = false) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(...dimensions), mat);
    mesh.position.set(...position); mesh.receiveShadow = true; mesh.castShadow = shadow; parent.add(mesh); return mesh;
  }
  function rod(parent, a, b, radius, mat) {
    const p = new THREE.Vector3(...a), q = new THREE.Vector3(...b);
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, p.distanceTo(q), 8), mat);
    mesh.position.copy(p).add(q).multiplyScalar(0.5);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), q.sub(p).normalize()); parent.add(mesh); return mesh;
  }
  function wire(points, mat) {
    const path = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)));
    const mesh = new THREE.Mesh(new THREE.TubeGeometry(path, 20, 0.012, 4, false), mat); world.add(mesh);
  }
  function board(text, width, height, bg = '#eee9d8', fg = '#234e3e') {
    const canvas = document.createElement('canvas'); canvas.width = 1024; canvas.height = 256;
    const ctx = canvas.getContext('2d'); ctx.fillStyle = bg; ctx.fillRect(0, 0, 1024, 256);
    ctx.fillStyle = fg; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const lines = text.split('\n');
    lines.forEach((line, i) => { ctx.font = `${i ? 36 : 72}px sans-serif`; ctx.fillText(line, 512, lines.length === 1 ? 128 : 80 + i * 112, 970); });
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide }));
    return mesh;
  }

  // Physically shaded sky and ocean, without external image downloads at runtime.
  const sun = new THREE.Vector3(-0.4, 0.65, -0.64).normalize();
  const sky = new THREE.Mesh(new THREE.SphereGeometry(1800, 32, 16), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, uniforms: { sun: { value: sun } },
    vertexShader: 'varying vec3 direction; void main(){direction=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader: `uniform vec3 sun; varying vec3 direction;
      float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
      void main(){vec3 d=normalize(direction);float h=max(d.y,0.0);
        vec3 col=mix(vec3(0.78,0.85,0.88),vec3(0.22,0.48,0.73),pow(h,0.38));
        float glow=pow(max(dot(d,sun),0.0),32.0);col+=vec3(0.25,0.22,0.14)*glow;
        vec2 p=d.xz/max(d.y+0.15,0.12)*2.0;
        float n=noise(p)*0.6+noise(p*2.1)*0.27+noise(p*4.3)*0.13;
        float cloud=smoothstep(0.53,0.78,n)*smoothstep(0.03,0.2,h)*0.75;
        col=mix(col,vec3(0.89,0.91,0.92),cloud);
        col+=vec3(1.5,1.35,1.0)*smoothstep(0.9994,0.99985,dot(d,sun));
        gl_FragColor=vec4(col,1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`
  })); scene.add(sky);
  const skyPixels = new Uint8Array(256 * 128 * 4);
  for (let y = 0; y < 128; y++) for (let x = 0; x < 256; x++) {
    const elevation = -Math.cos(y / 127 * Math.PI);
    const horizon = Math.pow(Math.max(elevation, 0), 0.38);
    const color = elevation > 0 ? [198 - horizon * 108, 215 - horizon * 49, 226 - horizon * 12] : [99, 105, 93];
    const i = (y * 256 + x) * 4;
    for (let c = 0; c < 3; c++) skyPixels[i + c] = color[c];
    skyPixels[i + 3] = 255;
  }
  const environment = new THREE.DataTexture(skyPixels, 256, 128);
  environment.colorSpace = THREE.SRGBColorSpace; environment.mapping = THREE.EquirectangularReflectionMapping;
  environment.needsUpdate = true; scene.environment = environment; scene.environmentIntensity = 0.65;
  const waterMaterial = new THREE.ShaderMaterial({ uniforms: { time: { value: 0 }, sun: { value: sun } },
    vertexShader: `uniform float time;varying vec3 worldPosition;
      void main(){vec3 p=position;float worldZ=(modelMatrix*vec4(p,1.0)).z;float deep=smoothstep(0.0,15.0,-worldZ-10.0);
        p.z+=(sin(p.x*0.21+p.y*0.34+time)*0.10+sin(p.x*0.53-p.y*0.19+time*1.4)*0.035)*deep;
        worldPosition=(modelMatrix*vec4(p,1.0)).xyz;gl_Position=projectionMatrix*viewMatrix*vec4(worldPosition,1.0);}`,
    fragmentShader: `uniform float time;uniform vec3 sun;varying vec3 worldPosition;
      void main(){vec3 p=worldPosition;float coastline=-22.0-clamp(p.x+100.0,0.0,400.0)*0.13; float shore=1.0-smoothstep(coastline-20.0,coastline,p.z);
        float nx=cos(p.x*0.6+p.z*0.81+time*1.5)*0.07+cos(p.x*2.4-p.z*1.8-time)*0.03;
        float nz=sin(p.z*0.8+p.x*0.41-time*1.2)*0.10+sin(p.z*2.8+p.x*1.6-time*2.0)*0.025;
        vec3 n=normalize(vec3(nx,1.0,nz));vec3 v=normalize(cameraPosition-p);
        float fresnel=pow(1.0-max(dot(n,v),0.0),4.0);
        vec3 color=mix(vec3(0.12,0.30,0.34),vec3(0.07,0.24,0.36),shore);
        color=mix(color,vec3(0.62,0.75,0.80),fresnel*0.7);
        float spec=pow(max(dot(n,normalize(sun+v)),0.0),220.0);
        color+=vec3(1.6,1.4,1.05)*spec;
        float wave=sin(p.z*2.0+sin(p.x*0.27)*0.4+time*1.6);
        float foam=smoothstep(0.90,1.0,wave)*(1.0-smoothstep(0.0,7.0,-p.z-10.0));
        color=mix(color,vec3(0.79,0.84,0.82),foam*0.65);
        float fog=1.0-exp(-length(cameraPosition-p)*0.005);color=mix(color,vec3(0.73,0.82,0.85),fog);
        gl_FragColor=vec4(color,1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`
  });
  const water = new THREE.Mesh(new THREE.PlaneGeometry(1600, 1100, 160, 100), waterMaterial);
  water.rotation.x = -Math.PI / 2; water.position.set(0, -1.4, -500); scene.add(water);
  function interpolate(points, x) {
    for (let i = 1; i < points.length; i++) {
      const [a, b] = [points[i - 1], points[i]];
      if (x >= a[0] && x <= b[0]) return THREE.MathUtils.lerp(a[1], b[1], (x - a[0]) / (b[0] - a[0]));
    }
    return x < points[0][0] ? points[0][1] : points.at(-1)[1];
  }
  const railZ = x => interpolate(geography.rail, x);
  const roadZ = x => interpolate(geography.road, x);
  const walkZ = x => interpolate(geography.walk, x);
  function ribbon(points, width, height, mat, name) {
    const vertices = [], indices = [];
    points.forEach((p, i) => {
      const a = points[Math.max(0, i - 1)], b = points[Math.min(points.length - 1, i + 1)];
      const dx = b[0] - a[0], dz = b[1] - a[1], length = Math.hypot(dx, dz) || 1;
      const y = typeof height === 'function' ? height(p[0], p[1]) : height;
      for (const side of [-1, 1]) vertices.push(p[0] - dz / length * width / 2 * side, y, p[1] + dx / length * width / 2 * side);
      if (i) { const j = i * 2; indices.push(j - 2, j - 1, j, j - 1, j + 1, j); }
    });
    const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setIndex(indices); geometry.computeVertexNormals();
    // Repeating UVs retain real metre-scale grain across long roads.
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(points.flatMap((p, i) => [i / 4, 0, i / 4, 1]), 2));
    const mesh = new THREE.Mesh(geometry, mat); mesh.name = name || ''; mesh.receiveShadow = true; world.add(mesh); return mesh;
  }
  const samples = Array.from({ length: 181 }, (_, i) => -360 + i * 4);
  ribbon(samples.map(x => [x, roadZ(x) + 5]), 24, -0.04, concrete, 'CoastalFoundation');
  ribbon(samples.map(x => [x, railZ(x) + 92]), 180, -0.03, material('#788374'), 'InlandGround');
  ribbon(samples.map(x => [x, roadZ(x)]), 7.2, 0.04, asphalt, 'Route134');
  ribbon(samples.map(x => [x, roadZ(x)]), 0.075, 0.046, material('#c99538'));
  for (const side of [-1, 1]) ribbon(samples.map(x => [x, roadZ(x) + side * 3.35]), 0.08, 0.048, cream);
  ribbon(samples.map(x => [x, walkZ(x)]), 3.0, 0.09, concrete, 'RailSideWalk');
  ribbon(samples.map(x => [x, roadZ(x) - 4.8]), 1.8, 0.08, concrete);
  ribbon(samples.map(x => [x, roadZ(x) - 7.5]), 4, -0.65, sand);
  ribbon(samples.map(x => [x, railZ(x)]), 2.2, 0.10, ballastMaterial, 'EnodenTrack');
  const matrix = new THREE.Matrix4();
  const sleepers = new THREE.InstancedMesh(new THREE.BoxGeometry(0.19, 0.10, 1.8), material('#574d3c'), 1160);
  for (let i = 0; i < 1160; i++) { const x = -360 + i * 0.62; matrix.makeTranslation(x, 0.14, railZ(x)); sleepers.setMatrixAt(i, matrix); }
  world.add(sleepers);
  for (const dz of [-0.5335, 0.5335]) ribbon(samples.map(x => [x, railZ(x) + dz]), 0.07, 0.27, steel);
  for (let x = -356; x < 356; x += 4) {
    const z = roadZ(x) - 5.7;
    rod(world, [x, 0, z], [x, 0.88, z], 0.035, cream);
    for (const y of [0.35, 0.78]) rod(world, [x, y, z], [x + 4, y, roadZ(x + 4) - 5.7], 0.025, steel);
    if (Math.abs(x) > 3) {
      const rz = railZ(x) - 1.55;
      box(world, [0.12, 0.85, 0.12], [x, 0.48, rz], concrete);
      rod(world, [x, 0.86, rz], [x + 4, 0.86, railZ(x + 4) - 1.55], 0.06, concrete);
      rod(world, [x, 0.42, rz], [x + 4, 0.42, railZ(x + 4) - 1.55], 0.04, concrete);
    }
  }
  for (let x = -350; x < 350; x += 23) {
    const z = railZ(x);
    rod(world, [x, 0, z + 2.2], [x, 7.3, z + 2.2], 0.10, concrete);
    rod(world, [x, 6.5, z + 2.2], [x, 6.5, z - 0.8], 0.05, steel);
    rod(world, [x, 7.0, z + 2.2], [x, 6.5, z - 0.6], 0.03, steel);
    wire([[x, 6.05, z], [x + 11.5, 5.95, railZ(x + 11.5)], [x + 23, 6.05, railZ(x + 23)]], dark);
    for (const y of [7.0, 7.25]) wire([[x, y, z + 2.2], [x + 11.5, y - 0.3, railZ(x + 11.5) + 2.2], [x + 23, y, railZ(x + 23) + 2.2]], dark);
  }
  const uphill = (x, z) => Math.max(0, z - railZ(x) - 3) * 0.105;
  ribbon(geography.hillStreet.filter(p => p[1] < 145), 5.2, uphill, asphalt, 'Nissaka');
  box(world, [5.2, 0.13, 2.2], [0.5, 0.10, -11.1], asphalt);
  for (let i = 0; i < 7; i++) box(world, [0.42, 0.012, 1.8], [-2 + i * 0.8, 0.055, -18], cream);

  // Actual station footprint is retained; LOD1 station mesh is replaced by the
  // open platform canopy, not a solid block. Operator photos guide its detail.
  const platformShape = new THREE.Shape(); geography.platform.forEach((p, i) => i ? platformShape.lineTo(p[0], -p[1]) : platformShape.moveTo(p[0], -p[1]));
  const platform = new THREE.Mesh(new THREE.ExtrudeGeometry(platformShape, { depth: 0.8, bevelEnabled: false }), concrete);
  platform.rotation.x = -Math.PI / 2; platform.receiveShadow = true; world.add(platform);
  const stationRoof = box(world, [43, 0.16, 3.1], [-141, 3.9, 3.1], material('#79786d'), true);
  stationRoof.rotation.z = 0.006;
  for (let x = -162; x <= -120; x += 4.2) {
    box(world, [0.13, 3.0, 0.13], [x, 2.3, 4.0], material('#575b50'), true);
    rod(world, [x, 3.76, 1.4], [x, 3.76, 4.8], 0.07, steel);
    box(world, [3.8, 0.04, 0.25], [x, 0.82, railZ(x) + 1.1], yellow);
    box(world, [2.0, 0.1, 0.5], [x, 1.3, 3.6], material('#896c42'));
  }
  const stationTitle = board('江ノ電 鎌倉高校前駅', 10, 0.8, '#315d41', '#faf3df'); stationTitle.position.set(-137, 4.35, 1.5); stationTitle.rotation.y = Math.PI; world.add(stationTitle);
  for (const x of [-125, -154]) {
    const name = board('鎌倉高校前\nEN08  KAMAKURAKOKOMAE', 3.5, 0.8); name.position.set(x, 2.4, 4.1); name.rotation.y = Math.PI; world.add(name);
  }
  // Actual mapped access lane north of the railway, beside the brick apartments.
  for (const street of geography.streets) ribbon(street.points, street.type === 'footway' || street.type === 'path' ? 2.5 : 4.5, (x,z) => uphill(x,z) + 0.015, asphalt);

  const lamps = [], gates = [];
  function crossingPole(x, z, direction) {
    const pole = new THREE.Group(); pole.position.set(x, 0.05, z); world.add(pole);
    for (let i = 0; i < 12; i++) rod(pole, [0, i * 0.27, 0], [0, (i + 1) * 0.27, 0], 0.062, i % 2 ? dark : yellow);
    for (const angle of [-Math.PI / 4, Math.PI / 4]) {
      const cross = new THREE.Group(); cross.position.y = 3.05; cross.rotation.z = angle;
      for (let i = 0; i < 5; i++) box(cross, [0.24, 0.15, 0.10], [(i - 2) * 0.24, 0, 0], i % 2 ? dark : yellow);
      pole.add(cross);
    }
    for (let i = 0; i < 2; i++) {
      const fixture = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.19, 0.19, 20), dark); fixture.rotation.x = Math.PI / 2; fixture.position.set(0, 2.1 + i * 0.42, 0.03); pole.add(fixture);
      const lightMat = new THREE.MeshStandardMaterial({ color: '#571a13', emissive: '#ff2913', emissiveIntensity: 0 });
      const light = new THREE.Mesh(new THREE.CircleGeometry(0.12, 20), lightMat); light.position.set(0, 2.1 + i * 0.42, 0.135); pole.add(light); lamps.push({ material: lightMat, side: i });
      const back = light.clone(); back.rotation.y = Math.PI; back.position.z = -0.08; pole.add(back);
    }
    box(pole, [0.32, 0.46, 0.28], [0, 0.62, 0], material('#c5b47d'));
    const arm = new THREE.Group(); arm.position.set(0, 0.85, 0.1); pole.add(arm);
    for (let i = 0; i < 14; i++) box(arm, [0.30, 0.055, 0.055], [direction * (i * 0.30 + 0.15), 0, 0], i % 2 ? dark : yellow);
    gates.push({ arm, direction });
  }
  crossingPole(-2.3, -8.8, 1); crossingPole(3.2, -13.3, -1);
  const roadSign = new THREE.Group(); roadSign.position.set(3.8, 0, -25); world.add(roadSign);
  rod(roadSign, [0, 0, 0], [0, 2.7, 0], 0.035, steel);
  const routeSign = board('134', 0.52, 0.45, '#286096', '#ffffff'); routeSign.position.y = 2.6; roadSign.add(routeSign);
  const mirror = new THREE.Mesh(new THREE.CircleGeometry(0.27, 24), material('#bdc4bd', 0.16, 0.8)); mirror.position.set(3.4, 2.65, -6.5); world.add(mirror);
  const mirrorRim = new THREE.Mesh(new THREE.TorusGeometry(0.27, 0.018, 8, 30), material('#ce793a')); mirrorRim.position.copy(mirror.position); world.add(mirrorRim);

  // Official 2024 LOD1: actual footprint and measured elevation of every house.
  // Colours and windows are photo-guided reconstruction, not scanned textures.
  const facadeMaterials = ['#dedbd2', '#c6c1b4', '#b7b9b6', '#e5e0d5'].map(c => material(c));
  for (const building of buildings) {
    if (building.id === 'bldg_24e04f92-cc0a-40e6-81b3-9612fda18163') continue;
    const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.Float32BufferAttribute(building.positions, 3)); geometry.computeVertexNormals();
    const apartment = building.id === 'bldg_1850fe63-486c-41d7-8a79-c092e5ed9d32';
    const mesh = new THREE.Mesh(geometry, apartment ? material('#a88a68') : facadeMaterials[building.id.charCodeAt(7) % 4]);
    mesh.name = building.id; mesh.castShadow = mesh.receiveShadow = true; world.add(mesh);
    const [x0,x1,y0,y1,z0,z1] = building.bounds;
    // Foundations reach the reference datum so surveyed buildings never float.
    if (y0 > 0.15) box(world, [x1-x0, y0, z1-z0], [(x0+x1)/2,y0/2,(z0+z1)/2], concrete);
    const floors = Math.max(1, Math.round((y1-y0)/3));
    for (let floor = 0; floor < floors; floor++) for (let x = x0 + 1.4; x < x1-1; x += apartment ? 4.2 : 3.0) {
      const y = y0 + 1.5 + floor * (y1-y0)/floors;
      box(world, [apartment ? 2.1 : 1.2, 1.35, 0.035], [x,y,z0-0.035], glass);
      box(world, [0.04, 1.35, 0.045], [x,y,z0-0.06], cream);
      if (apartment) {
        box(world, [3.7,0.12,1.2], [x,y-0.78,z0-0.55], cream);
        box(world, [3.65,0.65,0.04], [x,y-0.35,z0-1.1], material('#78908f',0.2,0.45));
        rod(world,[x-1.8,y+0.01,z0-1.1],[x+1.8,y+0.01,z0-1.1],0.025,steel);
      }
    }
  }
  // Nissaka's roadside retaining walls follow the mapped slope.
  for (const x of [-3.2, 4.6]) {
    for (let z = -5; z < 85; z += 5) box(world, [0.4,1.3,5], [x,uphill(x,z)+0.65,z], concrete);
  }
  const train = new THREE.Group(); train.name = 'Enoden'; train.position.z = railZ(0); world.add(train);
  const trainWheels = [];
  function carriage(offset, number) {
    const car = new THREE.Group(); car.position.x = offset; train.add(car);
    box(car, [7.2, 1.28, 1.9], [0, 1.32, 0], green, true);
    box(car, [7.2, 1.18, 1.9], [0, 2.52, 0], cream, true);
    box(car, [7.24, 0.065, 1.93], [0, 1.94, 0], material('#beac6d', 0.4, 0.4));
    box(car, [7.18, 0.23, 1.98], [0, 3.19, 0], material('#506057'), true);
    box(car, [5.7, 0.23, 1.58], [0, 3.37, 0], material('#929a8e'));
    box(car, [5.8, 0.3, 1.5], [0, 0.76, 0], dark);
    for (const side of [-1, 1]) {
      for (let i = 0; i < 8; i++) {
        const x = -2.95 + i * 0.83;
        box(car, [0.69, 0.88, 0.035], [x, 2.52, side * 0.967], steel);
        box(car, [0.61, 0.80, 0.045], [x, 2.52, side * 0.99], glass);
        box(car, [0.61, 0.015, 0.01], [x, 2.32, side * 1.016], steel);
      }
      for (const x of [-2.45, 2.45]) {
        box(car, [0.72, 1.95, 0.035], [x, 2.0, side * 1.024], cream);
        box(car, [0.49, 0.75, 0.025], [x, 2.47, side * 1.048], glass);
        box(car, [0.018, 1.88, 0.01], [x, 2, side * 1.05], steel);
      }
      const id = board(String(number), 0.50, 0.18, '#245a40', '#eee9d8'); id.position.set(0.7, 1.47, side * 0.973); id.rotation.y = side === 1 ? 0 : Math.PI; car.add(id);
    }
    for (const end of [-1, 1]) {
      for (const z of [-0.59, 0, 0.59]) box(car, [0.05, 0.81, 0.49], [end * 3.62, 2.55, z], glass);
      const destination = board('鎌倉', 0.68, 0.22, '#202a23', '#eee3b9'); destination.position.set(end * 3.659, 3.01, 0); destination.rotation.y = end * Math.PI / 2; car.add(destination);
      for (const z of [-0.64, 0.64]) {
        const headlight = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 8), new THREE.MeshStandardMaterial({ color: '#fff6c7', emissive: '#ffe7a8', emissiveIntensity: 0.4 })); headlight.position.set(end * 3.65, 1.75, z); car.add(headlight);
      }
      box(car, [0.14, 0.12, 1.7], [end * 3.7, 0.91, 0], steel);
    }
    for (const x of [-2.1, 2.1]) {
      box(car, [1.55, 0.32, 1.7], [x, 0.59, 0], dark);
      for (const dx of [-0.47, 0.47]) for (const side of [-1, 1]) {
        const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.11, 20), steel); wheel.rotation.x = Math.PI / 2; wheel.position.set(x + dx, 0.55, side * 0.67); car.add(wheel); trainWheels.push(wheel);
      }
    }
  }
  carriage(-3.85, 1001); carriage(3.85, 1051);
  train.scale.set(1.65, 1, 1.15);
  box(train, [0.35, 1.65, 1.5], [0, 2.0, 0], dark);
  // Diamond pantograph reaches the contact wire, with no disconnected roof gear.
  for (const z of [-0.32, 0.32]) {
    rod(train, [-4.5, 3.55, z], [-3.7, 4.68, z], 0.027, steel);
    rod(train, [-2.9, 3.55, z], [-3.7, 4.68, z], 0.027, steel);
    rod(train, [-3.7, 4.68, z], [-4.35, 5.96, z], 0.022, steel);
    rod(train, [-3.7, 4.68, z], [-3.05, 5.96, z], 0.022, steel);
  }
  rod(train, [-4.4, 5.97, -0.5], [-3.0, 5.97, 0.5], 0.04, dark);

  for (let x=-196; x<40; x+=9) {
    const z=walkZ(x);
    box(world,[0.75,0.012,0.4],[x,0.10,z-1.14],material('#5e625b',0.7,0.35));
    for (let k=0;k<7;k++) box(world,[0.04,0.016,0.36],[x-0.3+k*0.1,0.11,z-1.14],dark);
  }
  for(let x=-95;x<-18;x+=2.7) for(let y=0.45;y<3.2;y+=0.65){
    box(world,[2.55,0.014,0.016],[x+(Math.round(y/0.65)%2)*0.2,y,6.81],material('#87877d'));
    box(world,[0.012,0.60,0.016],[x,y+0.3,6.81],material('#87877d'));
  }
  const traffic = [];
  function japaneseCar(kind, color, direction, startX) {
    const car = new THREE.Group(); car.name = 'JapaneseTraffic'; world.add(car);
    const paint = new THREE.MeshPhysicalMaterial({ color, roughness: 0.23, metalness: 0.3, clearcoat: 0.8, clearcoatRoughness: 0.12 });
    const length = kind === 'kei' ? 3.35 : kind === 'suv' ? 3.7 : 4.5, width = kind === 'kei' ? 1.45 : 1.75;
    function body(points, depth, mat) {
      const shape = new THREE.Shape(); points.forEach((p,i) => i ? shape.lineTo(...p) : shape.moveTo(...p)); shape.closePath();
      const mesh = new THREE.Mesh(new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelSize:0.055,bevelThickness:0.04,bevelSegments:3}),mat);
      mesh.position.z = -depth/2; mesh.castShadow = true; car.add(mesh);
    }
    body([[-length/2,0.43],[-length/2,0.83],[-length/2+0.3,1.01],[length/2-0.4,1.01],[length/2,0.78],[length/2,0.43]],width,paint);
    const rear = -length/2+0.45, front = length/2-1;
    const roof = kind === 'kei' ? 1.83 : kind === 'suv' ? 1.72 : 1.44;
    body([[rear,0.99],[rear+0.35,roof],[front-0.35,roof],[front+0.5,0.99]],width*0.91,glass);
    box(car,[front-rear-0.65,0.075,width*0.94],[(rear+front)/2,roof+0.06,0],paint,true);
    for (const z of [-width/2,width/2]) {
      rod(car,[rear,1,z],[rear+0.35,roof,z*0.91],0.05,paint);
      rod(car,[front+0.5,1,z],[front-0.35,roof,z*0.91],0.05,paint);
      rod(car,[(rear+front)/2,1,z],[(rear+front)/2,roof,z*0.91],0.035,paint);
      box(car,[0.24,0.04,0.035],[-0.05,0.89,z*1.04],steel);
      box(car,[0.15,0.10,0.13],[front+0.18,1.15,z*1.08],paint);
    }
    const wheels = [];
    for (const x of [-length*0.32,length*0.32]) for (const side of [-1,1]) {
      const wheel = new THREE.Group(); wheel.position.set(x,0.32,side*width/2); car.add(wheel);
      const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.30,0.30,0.17,24),dark); tire.rotation.x = Math.PI/2; wheel.add(tire);
      const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.20,0.20,0.19,12),steel); rim.rotation.x = Math.PI/2; wheel.add(rim); wheels.push(wheel);
    }
    for (const z of [-width*0.35,width*0.35]) {
      box(car,[0.055,0.14,0.38],[length/2+0.035,0.77,z],material('#e6e9d3',0.15));
      box(car,[0.055,0.15,0.3],[-length/2-0.035,0.76,z],material('#9e2921',0.2));
    }
    box(car,[0.06,0.20,width*0.6],[length/2+0.025,0.51,0],dark);
    for (const end of [-1,1]) {
      const plate = board('湘南 580\n12-34',0.32,0.15,kind === 'kei' ? '#efc44c' : '#e9e8dd','#36584c'); plate.position.set(end*(length/2+0.07),0.55,0); plate.rotation.y=end*Math.PI/2; car.add(plate);
    }
    traffic.push({car,wheels,direction,startX});
  }
  for (let i=0;i<14;i++) japaneseCar(['hybrid','kei','suv'][i%3],['#d9dcd7','#b4bec1','#273e42','#e9e5d9','#9faca0'][i%5],i%2 ? -1 : 1,-330+i*49);

  // Merge static geometry by material to keep mobile draw calls manageable.
  // Animated train, traffic, lamps and crossing arms remain separate groups.
  world.updateMatrixWorld(true);
  const batches = new Map();
  for (const mesh of [...world.children]) {
    if (!mesh.isMesh || mesh.isInstancedMesh || !mesh.material.isMeshStandardMaterial) continue;
    if (!batches.has(mesh.material)) batches.set(mesh.material, []);
    batches.get(mesh.material).push(mesh);
  }
  for (const [mat, meshes] of batches) {
    if (meshes.length < 2) continue;
    const geometries = meshes.map(mesh => {
      const geometry = mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry.clone();
      geometry.applyMatrix4(mesh.matrixWorld); return geometry;
    });
    const count = geometries.reduce((n,g) => n+g.attributes.position.count,0);
    const position = new Float32Array(count*3), normal = new Float32Array(count*3), uv = new Float32Array(count*2);
    let offset=0;
    for (const g of geometries) {
      position.set(g.attributes.position.array,offset*3); normal.set(g.attributes.normal.array,offset*3);
      if (g.attributes.uv) uv.set(g.attributes.uv.array,offset*2);
      offset+=g.attributes.position.count; g.dispose();
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position',new THREE.BufferAttribute(position,3)); geometry.setAttribute('normal',new THREE.BufferAttribute(normal,3)); geometry.setAttribute('uv',new THREE.BufferAttribute(uv,2));
    geometry.computeBoundingSphere();
    const batch = new THREE.Mesh(geometry,mat); batch.name='PhotoReferencedScenery'; batch.receiveShadow=true; batch.castShadow=meshes.some(mesh=>mesh.castShadow); world.add(batch);
    for (const mesh of meshes) { world.remove(mesh); mesh.geometry.dispose(); }
  }

  // A continuous out-and-back loop on the mapped railway-side sidewalk.
  // Two narrow lanes and smooth U turns avoid inventing an inland return street.
  const routePoints = [], left=-185, right=32, turnRadius=0.6;
  for(let x=left;x<=right;x+=1) routePoints.push(new THREE.Vector3(x,0.09,walkZ(x)-turnRadius));
  for(let i=1;i<=24;i++){const a=-Math.PI/2+i*Math.PI/24;routePoints.push(new THREE.Vector3(right+turnRadius*Math.cos(a),0.09,walkZ(right)+turnRadius*Math.sin(a)));}
  for(let x=right-1;x>=left;x-=1) routePoints.push(new THREE.Vector3(x,0.09,walkZ(x)+turnRadius));
  for(let i=1;i<24;i++){const a=Math.PI/2+i*Math.PI/24;routePoints.push(new THREE.Vector3(left+turnRadius*Math.cos(a),0.09,walkZ(left)+turnRadius*Math.sin(a)));}
  const route = new THREE.CatmullRomCurve3(routePoints,true,'centripetal'); route.arcLengthDivisions=16384;
  const routeLength=route.getLength(), riderSpeed=3.0;
  let gateAngle=0;
  return {
    routeLength, route,
    update(time,dt) {
      // Train turns outside the camera's visible range; no in-view teleport.
      const travel=(time*7)%1280; train.position.x=travel<640 ? -340+travel : 940-travel;
      const forward=travel<640;
      train.position.z=railZ(train.position.x); train.rotation.y=-Math.atan2(railZ(train.position.x+1)-railZ(train.position.x-1),2);
      trainWheels.forEach(w=>{w.rotation.y=(forward?-1:1)*time*7/0.28;});
      const closed=Math.abs(train.position.x-0.5)<36;
      gateAngle+=( (closed?0:Math.PI/2)-gateAngle)*Math.min(1,dt*4);
      gates.forEach(({arm,direction})=>{arm.rotation.z=gateAngle*direction;});
      lamps.forEach(({material:light,side})=>{light.emissiveIntensity=closed&&Math.floor(time*2.5)%2===side?2.8:0;});
      waterMaterial.uniforms.time.value=time;
      for(const {car,wheels,direction,startX} of traffic){
        const x=((startX+time*8*direction+360)%720+720)%720-360;
        car.position.set(x,0.04,roadZ(x)+direction*1.65);
        car.rotation.y=(direction===1?0:Math.PI)-Math.atan2(roadZ(x+1)-roadZ(x-1),2);
        wheels.forEach(w=>{w.rotation.z=-time*8/0.30;});
      }
      const u=((time*riderSpeed+180)%routeLength)/routeLength;
      const position=route.getPointAt(u),tangent=route.getTangentAt(u);
      return {x:position.x,z:position.z,y:position.y,angle:Math.atan2(-tangent.z,tangent.x),moving:true};
    }
  };
}
