import * as THREE from 'three';

// Layout follows the Enoden station photos and the inland-facing crossing view.
// Distances are an artistic reconstruction, not a surveyed map.
export function buildShonan(scene) {
  const world = new THREE.Group(); world.name = 'Kamakurakokomae'; scene.add(world);
  const material = (color, roughness = 0.8, metalness = 0) => new THREE.MeshStandardMaterial({ color, roughness, metalness });
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
  const sky = new THREE.Mesh(new THREE.SphereGeometry(450, 32, 16), new THREE.ShaderMaterial({
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
    const elevation = Math.cos(y / 127 * Math.PI);
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
      void main(){vec3 p=worldPosition;float shore=1.0-smoothstep(-28.0,-10.0,p.z);
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
  const water = new THREE.Mesh(new THREE.PlaneGeometry(600, 420, 180, 100), waterMaterial);
  water.rotation.x = -Math.PI / 2; water.position.set(0, -0.86, -220); scene.add(water);
  box(world, [150, 0.7, 24], [0, -0.4, 3], concrete);
  const terrainGeometry = new THREE.PlaneGeometry(180, 80, 60, 28);
  const terrainVertices = terrainGeometry.attributes.position;
  for (let i = 0; i < terrainVertices.count; i++) {
    const z = 45 - terrainVertices.getY(i);
    terrainVertices.setZ(i, Math.max(0, z - 15) * 0.08 + Math.sin(terrainVertices.getX(i) * 0.08) * Math.max(0, z - 20) * 0.025);
  }
  terrainGeometry.computeVertexNormals();
  const terrain = new THREE.Mesh(terrainGeometry, material('#647359'));
  terrain.rotation.x = -Math.PI / 2; terrain.position.set(0, -0.2, 45); terrain.receiveShadow = true; world.add(terrain);
  box(world, [150, 0.08, 7.2], [0, 0.005, -2.5], asphalt);
  box(world, [150, 0.16, 1.55], [0, -0.04, -6.9], concrete);
  box(world, [150, 1, 0.6], [0, -0.5, -7.85], concrete);
  box(world, [150, 0.15, 2.5], [0, -0.92, -9.1], sand);
  box(world, [150, 0.008, 0.075], [0, 0.05, -2.5], material('#c99538'));
  for (const z of [-5.75, 0.8]) box(world, [150, 0.007, 0.08], [0, 0.05, z], material('#e0ded3'));
  for (let x = -72; x <= 72; x += 3) {
    rod(world, [x, 0, -7.7], [x, 0.85, -7.7], 0.04, cream);
    for (const y of [0.32, 0.7]) rod(world, [x, y, -7.7], [x + 3, y, -7.7], 0.025, steel);
  }
  // A side street slopes down toward the sea and crosses a single railway track.
  const slope = box(world, [4.5, 0.12, 23], [-4, 1.17, 15.45], asphalt); slope.rotation.x = -Math.atan(0.1);
  box(world, [4.5, 0.025, 8.5], [-4, 0.055, 0.6], asphalt);
  for (let i = 0; i < 6; i++) box(world, [0.35, 0.012, 1.15], [-5.75 + i * 0.7, 0.055, -0.05], cream);
  box(world, [150, 0.12, 2.0], [0, 0.06, 3.3], ballastMaterial);
  const sleeperMaterial = material('#574d3c');
  const sleepers = new THREE.InstancedMesh(new THREE.BoxGeometry(0.19, 0.10, 1.8), sleeperMaterial, 240);
  const matrix = new THREE.Matrix4();
  for (let i = 0; i < 240; i++) { matrix.makeTranslation(i * 0.62 - 75, 0.12, 3.3); sleepers.setMatrixAt(i, matrix); }
  world.add(sleepers);
  for (const z of [2.78, 3.82]) {
    box(world, [150, 0.12, 0.06], [0, 0.21, z], steel);
    box(world, [150, 0.026, 0.12], [0, 0.27, z], material('#afbab6', 0.2, 0.85));
  }
  // Asphalt infill at the crossing leaves the rail heads visible.
  box(world, [4.5, 0.13, 2.0], [-4, 0.10, 3.3], asphalt);
  for (let x = -65; x < 70; x += 13) {
    rod(world, [x, 0, 5.1], [x, 7.3, 5.1], 0.10, concrete);
    rod(world, [x, 6.4, 5.1], [x, 6.4, 2.6], 0.05, steel);
    rod(world, [x, 7.0, 5.1], [x, 6.4, 3.0], 0.028, steel);
    wire([[x, 6.05, 3.3], [x + 6.5, 5.95, 3.3], [x + 13, 6.05, 3.3]], dark);
    for (const y of [6.95, 7.2, 7.45]) wire([[x, y, 5.3], [x + 6.5, y - 0.18, 5.3], [x + 13, y, 5.3]], dark);
  }

  // Seaward-facing open platform and EN08 signage, based on the operator's photos.
  box(world, [24, 0.8, 2.6], [-19, 0.4, 5.8], concrete);
  box(world, [24, 0.025, 0.18], [-19, 0.815, 4.62], yellow);
  box(world, [20, 0.14, 2.95], [-20, 3.6, 5.8], material('#666c62'), true);
  for (let x = -29; x <= -11; x += 3.6) {
    box(world, [0.11, 2.8, 0.11], [x, 2.17, 6.55], material('#746b53'), true);
    rod(world, [x, 3.55, 4.5], [x, 3.55, 7.0], 0.055, steel);
    box(world, [0.8, 0.05, 0.12], [x, 3.4, 5.3], cream);
  }
  const stationTitle = board('江ノ電 鎌倉高校前駅', 7.2, 0.65, '#315d41', '#faf3df'); stationTitle.position.set(-18, 3.89, 4.52); stationTitle.rotation.y = Math.PI; stationTitle.material.side = THREE.FrontSide; world.add(stationTitle);
  const inlandTitle = stationTitle.clone(); inlandTitle.rotation.y = 0; inlandTitle.position.z = 7.3; world.add(inlandTitle);
  for (const x of [-12, -23]) {
    const name = board('鎌倉高校前\nEN08  KAMAKURAKOKOMAE', 3.5, 0.8); name.position.set(x, 2.4, 6.54); name.rotation.y = Math.PI; world.add(name);
    const back = name.clone(); back.rotation.y = 0; back.position.z += 0.03; world.add(back);
  }
  for (let x = -28; x < -10; x += 5) {
    box(world, [1.5, 0.10, 0.4], [x, 1.28, 6.2], material('#997a48'));
    for (const dx of [-0.55, 0.55]) box(world, [0.05, 0.4, 0.3], [x + dx, 1.03, 6.2], steel);
  }
  for (let x = -32; x < -7; x += 2) {
    box(world, [0.10, 0.9, 0.10], [x, 0.47, 1.45], concrete);
    box(world, [2, 0.12, 0.12], [x + 1, 0.85, 1.45], concrete);
  }

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
  crossingPole(-6.3, 4.8, 1); crossingPole(-1.7, 1.7, -1);
  const roadSign = new THREE.Group(); roadSign.position.set(-1.6, 0, -4.2); world.add(roadSign);
  rod(roadSign, [0, 0, 0], [0, 2.7, 0], 0.035, steel);
  const routeSign = board('134', 0.52, 0.45, '#286096', '#ffffff'); routeSign.position.y = 2.6; roadSign.add(routeSign);
  const mirror = new THREE.Mesh(new THREE.CircleGeometry(0.27, 24), material('#bdc4bd', 0.16, 0.8)); mirror.position.set(-1.6, 2.65, 5.2); world.add(mirror);
  const mirrorRim = new THREE.Mesh(new THREE.TorusGeometry(0.27, 0.018, 8, 30), material('#ce793a')); mirrorRim.position.copy(mirror.position); world.add(mirrorRim);

  // Inland retaining walls, low-rise houses, balconies and dense utility cables.
  const houseColors = ['#c5bfae', '#e4dfd2', '#b7b7ab', '#b8a38c'];
  for (let i = 0; i < 12; i++) {
    const x = i < 6 ? -40 + i * 5.1 : 3 + (i - 6) * 5.5;
    const z = 9 + i % 3 * 2.5, h = 4.6 + i % 3 * 1.1, w = 4.2;
    box(world, [w + 0.3, 1.6, 4.3], [x, 0.8, z], concrete);
    box(world, [w, h, 3.7], [x, h / 2 + 1.6, z], material(houseColors[i % 4]), true);
    box(world, [w + 0.35, 0.16, 4.0], [x, h + 1.65, z], material('#646b68'), true);
    for (let floor = 0; floor < 2; floor++) for (let j = 0; j < 3; j++) {
      box(world, [0.8, 1.0, 0.055], [x - 1.35 + j * 1.35, 2.9 + floor * 2.0, z - 1.88], glass);
      box(world, [0.035, 1.0, 0.06], [x - 1.35 + j * 1.35, 2.9 + floor * 2.0, z - 1.92], steel);
    }
    box(world, [w * 0.75, 0.13, 0.7], [x, 4.2, z - 2.15], cream);
    rod(world, [x - 1.5, 5, z - 2.45], [x + 1.5, 5, z - 2.45], 0.025, steel);
    for (let j = 0; j < 7; j++) rod(world, [x - 1.5 + j * 0.5, 4.2, z - 2.45], [x - 1.5 + j * 0.5, 5, z - 2.45], 0.013, steel);
    box(world, [0.6, 0.45, 0.3], [x + 1.15, 2.5, z - 2.02], cream);
  }
  // Higher side-street walls leave a clear sightline to the railway and ocean.
  for (const x of [-7.4, -0.6]) {
    const wall = box(world, [0.45, 1.7, 19], [x, 1.65, 15.5], concrete); wall.rotation.x = -Math.atan(0.1);
    for (let z = 8; z < 25; z += 4) {
      const shrub = new THREE.Mesh(new THREE.IcosahedronGeometry(0.7, 2), material('#52704e'));
      shrub.position.set(x, 2.2 + (z - 4) * 0.1, z); shrub.scale.set(1.1, 0.8, 1); world.add(shrub);
    }
  }
  wire([[-15, 7.2, 5.3], [-4, 6.6, 15], [3, 8.4, 28]], dark);
  wire([[-15, 7.4, 5.3], [-4, 6.8, 15], [3, 8.6, 28]], dark);

  const train = new THREE.Group(); train.name = 'Enoden'; train.position.z = 3.3; world.add(train);
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
  box(train, [0.35, 1.65, 1.5], [0, 2.0, 0], dark);
  // Diamond pantograph reaches the contact wire, with no disconnected roof gear.
  for (const z of [-0.32, 0.32]) {
    rod(train, [-4.5, 3.55, z], [-3.7, 4.68, z], 0.027, steel);
    rod(train, [-2.9, 3.55, z], [-3.7, 4.68, z], 0.027, steel);
    rod(train, [-3.7, 4.68, z], [-4.35, 5.96, z], 0.022, steel);
    rod(train, [-3.7, 4.68, z], [-3.05, 5.96, z], 0.022, steel);
  }
  rod(train, [-4.4, 5.97, -0.5], [-3.0, 5.97, 0.5], 0.04, dark);

  let gateAngle = 0;
  return {
    update(time, dt) {
      const t = time % 35;
      train.position.x = -26 + t * 3.2;
      trainWheels.forEach(wheel => { wheel.rotation.y = -time * 3.2 / 0.28; });
      const closed = Math.abs(train.position.x + 4) < 16;
      const target = closed ? 0 : Math.PI / 2;
      gateAngle += (target - gateAngle) * Math.min(1, dt * 4);
      gates.forEach(({ arm, direction }) => { arm.rotation.z = gateAngle * direction; });
      lamps.forEach(({ material: light, side }) => { light.emissiveIntensity = closed && Math.floor(time * 2.5) % 2 === side ? 2.8 : 0; });
      waterMaterial.uniforms.time.value = time;
      // A complete ride: approach, wait for the train, cross, then turn along Route 134.
      if (t < 6) return { x: -4, z: 19.5 - t * 2.2, angle: Math.PI / 2, moving: true, slope: true };
      if (t < 13.5) return { x: -4, z: 6.3, angle: Math.PI / 2, moving: false, slope: true };
      if (t < 19) return { x: -4, z: 6.3 - (t - 13.5) * 2.2, angle: Math.PI / 2, moving: true, slope: false };
      if (t < 20) {
        const a = (t - 19) * Math.PI / 2;
        return { x: -4 + 1.1 * (1 - Math.cos(a)), z: -5.8 - 1.1 * Math.sin(a), angle: Math.PI / 2 - a, moving: true, slope: false };
      }
      return { x: -2.9 + (t - 20) * 2.2, z: -6.9, angle: 0, moving: true, slope: false };
    }
  };
}
