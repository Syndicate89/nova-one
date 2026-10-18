import * as THREE from './vendor/three.module.js';

// Replace this adapter with a GLTFLoader implementation returning the same
// { group, setColor(hex) } contract to change the asset without changing scenes.
export function createHeadphones() {
  const group = new THREE.Group();
  group.name = 'NOVA_ONE';
  const textile = weave();
  const shell = new THREE.MeshPhysicalMaterial({ color: '#24262b', metalness: .32, roughness: .37, clearcoat: .18, clearcoatRoughness: .4 });
  const metal = new THREE.MeshStandardMaterial({ color: '#777b82', metalness: .88, roughness: .33 });
  const trim = new THREE.MeshStandardMaterial({ color: '#41464e', metalness: .72, roughness: .35 });
  const fabric = new THREE.MeshPhysicalMaterial({ color: '#22252b', roughness: .96, bumpMap: textile, bumpScale: .012, sheen: .55, sheenRoughness: .85, sheenColor: '#8c8f96' });
  const stitching = new THREE.MeshStandardMaterial({ color: '#34363d', roughness: 1 });
  const black = new THREE.MeshStandardMaterial({ color: '#080a0c', roughness: .98 });
  const speaker = new THREE.MeshStandardMaterial({ color: '#111318', roughness: 1, bumpMap: textile, bumpScale: .009, side: THREE.DoubleSide });
  const logoMaterial = new THREE.MeshStandardMaterial({ color: '#a5a9ae', roughness: .6, metalness: .25, transparent: true, alphaTest: .05, depthWrite: false, map: label() });
  const color = new THREE.Color();
  const silver = new THREE.Color('#91949b');

  function mesh(geometry, material, parent = group) {
    const m = new THREE.Mesh(geometry, material);
    parent.add(m);
    return m;
  }
  function tube(points, radius, material, parent = group) {
    const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)));
    return mesh(new THREE.TubeGeometry(curve, Math.max(40, points.length * 2), radius, 10, false), material, parent);
  }

  // Continuous, flattened cross sections with UVs for the woven underside.
  function arch(rx, ry, start, end, radial, depth, material) {
    const positions = [], uvs = [], indices = [], N = 96, M = 24;
    for (let i = 0; i <= N; i++) {
      const t = start + (end - start) * i / N;
      const n = new THREE.Vector3(Math.cos(t) / rx, Math.sin(t) / ry, 0).normalize();
      for (let j = 0; j <= M; j++) {
        const a = j / M * Math.PI * 2;
        positions.push(rx * Math.cos(t) + n.x * radial * Math.cos(a), .28 + ry * Math.sin(t) + n.y * radial * Math.cos(a), depth * Math.sin(a));
        uvs.push(i / N * 2, j / M);
        if (i < N && j < M) {
          const k = i * (M + 1) + j;
          indices.push(k, k + M + 1, k + 1, k + 1, k + M + 1, k + M + 2);
        }
      }
    }
    // End caps close the headband and padding at the telescoping sleeves.
    for (const i of [0, N]) {
      const t = start + (end - start) * i / N, center = positions.length / 3;
      positions.push(rx * Math.cos(t), .28 + ry * Math.sin(t), 0); uvs.push(.5, .5);
      for (let j = 0; j < M; j++) {
        const k = i * (M + 1) + j;
        if (i === 0) indices.push(center, k + 1, k); else indices.push(center, k, k + 1);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    g.setIndex(indices); g.computeVertexNormals();
    return mesh(g, material);
  }
  arch(1.48, 1.72, .025, Math.PI - .025, .105, .255, shell).name = 'headband-shell';
  arch(1.42, 1.60, .20, Math.PI - .20, .075, .225, fabric).name = 'headband-padding';
  for (const z of [-.235, .235]) {
    const points = [];
    for (let i = 0; i <= 64; i++) {
      const t = .08 + (Math.PI - .16) * i / 64;
      points.push([1.49 * Math.cos(t), .28 + 1.72 * Math.sin(t), z]);
    }
    tube(points, .006, trim);
  }

  for (const side of [-1, 1]) {
    const cup = new THREE.Group();
    cup.name = side === 1 ? 'right-earcup' : 'left-earcup';
    cup.position.set(side * 1.47, -.61, 0);
    cup.rotation.y = side * Math.PI / 2; cup.rotation.x = .045; group.add(cup);
    mesh(oval(.87, 1.42, .18, .105), shell, cup).name = 'earcup-housing';
    const seam = mesh(oval(.89, 1.44, .022, .07), trim, cup); seam.position.z = -.045;
    const base = mesh(oval(.83, 1.36, .06, .075), black, cup); base.position.z = -.14;
    const pad = mesh(cushion(), fabric, cup); pad.position.z = -.225; pad.name = 'fabric-cushion';
    const inner = mesh(new THREE.CircleGeometry(1, 64), speaker, cup);
    inner.scale.set(.29, .51, 1); inner.position.z = -.18; inner.rotation.y = Math.PI;
    const stitchPoints = [];
    for (let i = 0; i <= 96; i++) {
      const t = i / 96 * Math.PI * 2;
      stitchPoints.push([.477 * Math.cos(t), .717 * Math.sin(t), -.324]);
    }
    tube(stitchPoints, .004, stitching, cup).name = 'cushion-seam';
    const plate = mesh(new THREE.PlaneGeometry(.39, .11), logoMaterial, cup);
    plate.position.set(0, -.09, .287); plate.name = 'NOVA-logo';

    // The fork ends sit outside the shell and meet the physical pivot discs.
    const yoke = new THREE.Group(); yoke.name = 'aluminium-yoke'; group.add(yoke);
    for (const z of [-.38, .38]) {
      tube([[side * 1.48, .30, 0], [side * 1.66, .065, z * .64], [side * 1.79, -.15, z], [side * 1.79, -.55, z]], .036, metal, yoke);
      const hinge = mesh(new THREE.CylinderGeometry(.069, .069, .085, 40), trim, yoke);
      hinge.rotation.z = Math.PI / 2; hinge.position.set(side * 1.79, -.55, z);
      const pivot = mesh(new THREE.CylinderGeometry(.037, .037, .088, 32), metal, yoke);
      pivot.rotation.z = Math.PI / 2; pivot.position.copy(hinge.position);
    }
    const rail = mesh(new THREE.CylinderGeometry(.061, .061, .43, 24), metal);
    rail.position.set(side * 1.47, .22, 0);
    const collar = mesh(new THREE.CylinderGeometry(.079, .079, .085, 32), trim);
    collar.position.set(side * 1.47, .12, 0);

    if (side === 1) {
      const dial = mesh(new THREE.CylinderGeometry(.123, .123, .09, 64), metal, cup);
      dial.rotation.x = Math.PI / 2; dial.position.set(.28, -.43, .292); dial.name = 'control-dial';
      const cap = mesh(new THREE.CircleGeometry(.103, 48), trim, cup); cap.position.set(.28, -.43, .34);
      const dialRing = mesh(new THREE.TorusGeometry(.096, .004, 8, 64), metal, cup); dialRing.position.set(.28, -.43, .341);
      const knurl = new THREE.InstancedMesh(new THREE.BoxGeometry(.006, .015, .075), trim, 36);
      knurl.name = 'dial-knurl'; cup.add(knurl);
      const tooth = new THREE.Object3D();
      for (let j = 0; j < 36; j++) {
        const t = j / 36 * Math.PI * 2;
        tooth.position.set(.28 + .12 * Math.cos(t), -.43 + .12 * Math.sin(t), .294); tooth.rotation.z = t - Math.PI / 2; tooth.updateMatrix(); knurl.setMatrixAt(j, tooth.matrix);
      }
      const led = mesh(new THREE.SphereGeometry(.013, 12, 8), new THREE.MeshBasicMaterial({ color: '#caff69' }), cup);
      led.position.set(.15, -.61, .28);
      const port = mesh(oval(.095, .033, .015, .008), black, cup);
      port.rotation.x = Math.PI / 2; port.position.set(0, -.817, .07); port.name = 'USB-C';
      const tongue = mesh(new THREE.BoxGeometry(.068, .006, .008), metal, cup); tongue.position.set(0, -.83, .07);
      const button = mesh(new THREE.CapsuleGeometry(.027, .11, 4, 12), trim, cup);
      button.rotation.z = Math.PI / 2; button.position.set(-.22, -.54, .281);
    }
  }
  function setColor(hex) {
    color.set(hex); shell.color.copy(color);
    const luminance = color.r * .2126 + color.g * .7152 + color.b * .0722;
    fabric.color.copy(color).multiplyScalar(luminance > .4 ? .6 : .78);
    stitching.color.copy(fabric.color).multiplyScalar(.75);
    trim.color.copy(color).lerp(silver, .24);
    logoMaterial.color.set(luminance > .4 ? '#4a4d52' : '#a5a9ae');
  }
  return { group, setColor };
}

// A stadium perimeter swept through quarter-round bevels. Analytic normals
// keep the highlights continuous across the housing, bevels and face caps.
function oval(w, h, depth, bevel) {
  if (h < w) { const g = oval(h, w, depth, bevel); g.rotateZ(Math.PI / 2); return g; }
  const perimeter = [], radius = w / 2, c = (h - w) / 2;
  for (let i = 0; i < 48; i++) { const t = i / 48 * Math.PI; perimeter.push([radius * Math.cos(t), c + radius * Math.sin(t), Math.cos(t), Math.sin(t)]); }
  for (let i = 0; i < 12; i++) perimeter.push([-radius, c - 2 * c * i / 12, -1, 0]);
  for (let i = 0; i < 48; i++) { const t = Math.PI + i / 48 * Math.PI; perimeter.push([radius * Math.cos(t), -c + radius * Math.sin(t), Math.cos(t), Math.sin(t)]); }
  for (let i = 0; i < 12; i++) perimeter.push([radius, -c + 2 * c * i / 12, 1, 0]);
  const rings = [], N = perimeter.length;
  for (let i = 0; i <= 10; i++) { const t = i / 10 * Math.PI / 2; rings.push([bevel * Math.sin(t), -bevel * Math.cos(t), Math.sin(t), -Math.cos(t)]); }
  for (let i = 0; i <= 10; i++) { const t = i / 10 * Math.PI / 2; rings.push([bevel * Math.cos(t), depth + bevel * Math.sin(t), Math.cos(t), Math.sin(t)]); }
  const positions = [], normals = [], uvs = [], indices = [];
  rings.forEach(([offset, z, radialNormal, zNormal], i) => {
    for (let j = 0; j <= N; j++) {
      const [x, y, nx, ny] = perimeter[j % N];
      positions.push(x + nx * offset, y + ny * offset, z); normals.push(nx * radialNormal, ny * radialNormal, zNormal); uvs.push(j / N, i / (rings.length - 1));
      if (i < rings.length - 1 && j < N) { const k = i * (N + 1) + j; indices.push(k, k + 1, k + N + 1, k + 1, k + N + 2, k + N + 1); }
    }
  });
  for (const front of [false, true]) {
    const z = front ? depth + bevel : -bevel, start = positions.length / 3;
    positions.push(0, 0, z); normals.push(0, 0, front ? 1 : -1); uvs.push(.5, .5);
    perimeter.forEach(([x, y]) => { positions.push(x, y, z); normals.push(0, 0, front ? 1 : -1); uvs.push(x / w + .5, y / h + .5); });
    for (let j = 0; j < N; j++) { const a = start + 1 + j, b = start + 1 + (j + 1) % N; if (front) indices.push(start, a, b); else indices.push(start, b, a); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2)); g.setIndex(indices);
  return g;
}

function cushion() {
  const positions = [], normals = [], uvs = [], indices = [], N = 112, M = 28;
  for (let i = 0; i <= N; i++) {
    const t = i / N * Math.PI * 2;
    for (let j = 0; j <= M; j++) {
      const a = j / M * Math.PI * 2, A = .375 + .145 * Math.cos(a), B = .615 + .145 * Math.cos(a);
      positions.push(A * Math.cos(t), B * Math.sin(t), .14 * Math.sin(a));
      const n = new THREE.Vector3(B * Math.cos(t) * .14 * Math.cos(a), A * Math.sin(t) * .14 * Math.cos(a), .145 * Math.sin(a) * (A * Math.sin(t) ** 2 + B * Math.cos(t) ** 2)).normalize();
      normals.push(n.x, n.y, n.z); uvs.push(i / N * 2, j / M);
      if (i < N && j < M) { const k = i * (M + 1) + j; indices.push(k, k + M + 1, k + 1, k + 1, k + M + 1, k + M + 2); }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2)); g.setIndex(indices); return g;
}
function weave() {
  const n = 128, data = new Uint8Array(n * n * 4);
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const k = (y * n + x) * 4;
    const v = 115 + ((x % 4 < 2) !== (y % 4 < 2) ? 48 : 0) + Math.round(8 * Math.sin(x * 11 + y * 7));
    data[k] = data[k + 1] = data[k + 2] = v; data[k + 3] = 255;
  }
  const t = new THREE.DataTexture(data, n, n); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(5, 7); t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true; t.needsUpdate = true; return t;
}
function label() {
  const c = document.createElement('canvas'); c.width = 512; c.height = 128;
  const ctx = c.getContext('2d'); ctx.fillStyle = '#e2e3e5'; ctx.font = '500 70px Arial'; ctx.textAlign = 'center'; ctx.fillText('N O V A', 256, 86); return new THREE.CanvasTexture(c);
}
