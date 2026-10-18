import * as THREE from './vendor/three.module.js';

// Replace this adapter with a GLTFLoader implementation returning the same
// { group, setColor(hex) } contract to change the asset without changing scenes.
export function createHeadphones({quality='high'}={}) {
  const mobile=quality==='mobile';
  const group = new THREE.Group();
  group.name = 'NOVA_ONE';
  const textile = fabricTextures();
  const shell = new THREE.MeshPhysicalMaterial({ color: '#24262b', metalness: .24, roughness: .3, clearcoat: .3, clearcoatRoughness: .35 });
  const metal = new THREE.MeshStandardMaterial({ color: '#9da0a5', metalness: .92, roughness: .3 });
  const trim = new THREE.MeshStandardMaterial({ color: '#41464e', metalness: .72, roughness: .35 });
  const fabric = new THREE.MeshPhysicalMaterial({ color: '#22252b', map: textile.color, normalMap: textile.normal, normalScale: new THREE.Vector2(.32,.32), roughnessMap: textile.roughness, roughness: 1, sheen: .8, sheenRoughness: .9, sheenColor: '#a4a4a0' });
  const cushionFabric = fabric.clone(); cushionFabric.vertexColors = true;
  const stitching = new THREE.MeshStandardMaterial({ color: '#34363d', roughness: 1 });
  const black = new THREE.MeshStandardMaterial({ color: '#080a0c', roughness: .98 });
  const speaker = new THREE.MeshStandardMaterial({ color: '#12151a', roughness: 1, map: textile.color, normalMap: textile.normal, normalScale: new THREE.Vector2(.18,.18), side: THREE.DoubleSide });
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
    return mesh(new THREE.TubeGeometry(curve, Math.max(24,Math.min(mobile?80:128,points.length)), radius, radius<.01?6:10, false), material, parent);
  }

  // Continuous, flattened cross sections with UVs for the woven underside.
  function arch(rx, ry, start, end, radial, depth, material) {
    const positions = [], uvs = [], indices = [], N = mobile?64:96, M = mobile?16:24;
    for (let i = 0; i <= N; i++) {
      const t = start + (end - start) * i / N;
      const n = new THREE.Vector3(Math.cos(t) / rx, Math.sin(t) / ry, 0).normalize();
      for (let j = 0; j <= M; j++) {
        const a = j / M * Math.PI * 2;
        const radialProfile = Math.sign(Math.cos(a)) * Math.abs(Math.cos(a)) ** .62;
        const depthProfile = Math.sign(Math.sin(a)) * Math.abs(Math.sin(a)) ** .62;
        positions.push(rx * Math.cos(t) + n.x * radial * radialProfile, .28 + ry * Math.sin(t) + n.y * radial * radialProfile, depth * depthProfile);
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
  arch(1.48, 1.72, .025, Math.PI - .025, .09, .28, shell).name = 'headband-shell';
  arch(1.42, 1.60, .17, Math.PI - .17, .08, .253, fabric).name = 'headband-padding';
  for (const z of [-.268, .268]) {
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
    mesh(domedHousing(mobile), shell, cup).name = 'sculpted-earcup-housing';
    const seamPoints=[], accentPoints=[];
    for(let i=0;i<=128;i++){const p=superellipse(i/128*Math.PI*2,.52,.79,2.6);seamPoints.push([p.x*1.003,p.y*1.003,-.018]);accentPoints.push([p.x*.975,p.y*.975,.181]);}
    tube(seamPoints,.006,black,cup).name='housing-parting-line';
    tube(accentPoints,.0045,metal,cup).name='machined-edge';
    const base = mesh(oval(.83, 1.36, .04, .065), black, cup); base.position.z = -.17;
    const pad = mesh(cushion(mobile), cushionFabric, cup); pad.position.z = -.255; pad.name = 'fabric-cushion';
    const inner = mesh(new THREE.CircleGeometry(1, 64), speaker, cup);
    inner.scale.set(.255, .48, 1); inner.position.z = -.20; inner.rotation.y = Math.PI;
    const stitchPoints = [];
    for (let i = 0; i <= 96; i++) {
      const t = i / 96 * Math.PI * 2;
      const p=superellipse(t,.37,.60,2.5), n=contourNormal(t,.37,.60,2.5);
      stitchPoints.push([p.x+n.x*.104,p.y+n.y*.104,-.359]);
    }
    tube(stitchPoints, .004, stitching, cup).name = 'cushion-seam';
    const plate = mesh(new THREE.PlaneGeometry(.34, .096), logoMaterial, cup);
    plate.position.set(0, -.04, .328); plate.name = 'NOVA-logo';
    const channel = mesh(new THREE.PlaneGeometry(.13,.14),new THREE.MeshBasicMaterial({map:label(side===1?'R':'L'),transparent:true,opacity:.26,depthWrite:false}),cup);
    channel.rotation.y=Math.PI;channel.position.set(0,-.14,-.205);channel.name='channel-mark';

    // Flattened aluminium forks meet lateral pivots, leaving the face clean.
    const yoke = new THREE.Group(); yoke.name = 'aluminium-yoke'; cup.add(yoke);
    for (const edge of [-1,1]) {
      mesh(flatStrap([[0,.88,0],[edge*.32,.73,.005],[edge*.55,.41,.012],[edge*.55,.02,.015]]),metal,yoke).name='forged-yoke-arm';
      const hinge = mesh(new THREE.CylinderGeometry(.071,.071,.075,40),trim,yoke);
      hinge.rotation.z=Math.PI/2;hinge.position.set(edge*.543,.02,.015);
      const pivot = mesh(new THREE.CylinderGeometry(.047,.047,.079,32),metal,yoke);pivot.rotation.z=Math.PI/2;pivot.position.copy(hinge.position);
      const inset = mesh(new THREE.CylinderGeometry(.023,.023,.081,24),black,yoke);inset.rotation.z=Math.PI/2;inset.position.copy(hinge.position);
    }
    const rail = mesh(oval(.09,.34,.13,.018),metal);rail.position.set(side*1.47,.24,-.065);rail.name='telescoping-slider';
    const collar = mesh(oval(.13,.09,.17,.021),trim);collar.position.set(side*1.47,.13,-.085);

    if (side === 1) {
      const dial = mesh(new THREE.CylinderGeometry(.123, .123, .09, 64), metal, cup);
      dial.rotation.x = Math.PI / 2; dial.position.set(.28, -.43, .325); dial.name = 'control-dial';
      const cap = mesh(new THREE.CircleGeometry(.103, 48), trim, cup); cap.position.set(.28, -.43, .372);
      const dialRing = mesh(new THREE.TorusGeometry(.096, .004, 8, 64), metal, cup); dialRing.position.set(.28, -.43, .373);
      const knurl = new THREE.InstancedMesh(new THREE.BoxGeometry(.006, .015, .075), trim, 36);
      knurl.name = 'dial-knurl'; cup.add(knurl);
      const tooth = new THREE.Object3D();
      for (let j = 0; j < 36; j++) {
        const t = j / 36 * Math.PI * 2;
        tooth.position.set(.28 + .12 * Math.cos(t), -.43 + .12 * Math.sin(t), .325); tooth.rotation.z = t - Math.PI / 2; tooth.updateMatrix(); knurl.setMatrixAt(j, tooth.matrix);
      }
      const led = mesh(new THREE.SphereGeometry(.009, 12, 8), new THREE.MeshBasicMaterial({ color: '#caff69' }), cup);
      led.position.set(.12, -.61, .287);
      const portRim=mesh(oval(.13,.040,.01,.009),trim,cup);portRim.rotation.x=Math.PI/2;portRim.position.set(0,-.790,.045);
      const port = mesh(oval(.105, .025, .014, .006), black, cup);
      port.rotation.x = Math.PI / 2; port.position.set(0, -.798, .045); port.name = 'USB-C';
      const tongue = mesh(new THREE.BoxGeometry(.073, .006, .006), metal, cup); tongue.position.set(0, -.814, .045);
      const button = mesh(new THREE.CapsuleGeometry(.027, .11, 4, 12), trim, cup);
      button.rotation.z = Math.PI / 2; button.position.set(-.18, -.56, .293);
      const vents=new THREE.InstancedMesh(new THREE.CircleGeometry(.008,10),black,5);cup.add(vents);vents.name='microphone-ports';
      const vent=new THREE.Object3D();for(let i=0;i<5;i++){vent.position.set(-.18+i*.024,-.657,.262);vent.updateMatrix();vents.setMatrixAt(i,vent.matrix);}
    }
  }
  function setColor(hex) {
    color.set(hex); shell.color.copy(color);
    const luminance = color.r * .2126 + color.g * .7152 + color.b * .0722;
    fabric.color.copy(color).multiplyScalar(luminance > .4 ? .88 : .86);
    cushionFabric.color.copy(fabric.color);
    stitching.color.copy(fabric.color).multiplyScalar(.75);
    trim.color.copy(color).lerp(silver, .24);
    logoMaterial.color.set(luminance > .4 ? '#4a4d52' : '#a5a9ae');
  }
  return { group, setColor };
}

function superellipse(t,rx,ry,power=2.6){const c=Math.cos(t),s=Math.sin(t);return new THREE.Vector2(rx*Math.sign(c)*Math.abs(c)**(2/power),ry*Math.sign(s)*Math.abs(s)**(2/power));}
function contourNormal(t,rx,ry,power=2.6){const p=superellipse(t,rx,ry,power);return new THREE.Vector2(Math.sign(p.x)*Math.abs(p.x/rx)**(power-1)/rx,Math.sign(p.y)*Math.abs(p.y/ry)**(power-1)/ry).normalize();}
function smoothGeometry(positions,uvs,indices,stride,ringCount,colors){
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));if(colors)g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.setIndex(indices);g.computeVertexNormals();
  const n=g.getAttribute('normal');
  for(let i=0;i<ringCount;i++){const a=i*stride,b=a+stride-1;const v=new THREE.Vector3(n.getX(a)+n.getX(b),n.getY(a)+n.getY(b),n.getZ(a)+n.getZ(b)).normalize();n.setXYZ(a,v.x,v.y,v.z);n.setXYZ(b,v.x,v.y,v.z);}
  return g;
}
// A continuous convex shell, with a slightly squared oval planform. The
// crown has real curvature rather than a flat disc behind a rounded rim.
function domedHousing(mobile=false){
  const profile=new THREE.CatmullRomCurve3([[.04,-.158],[.84,-.158],[.96,-.12],[1,-.04],[1,.075],[.983,.16],[.94,.23],[.84,.278],[.65,.307],[.35,.322],[.04,.326]].map(([r,z])=>new THREE.Vector3(r,0,z)),false,'centripetal');
  const samples=profile.getPoints(mobile?36:60),N=mobile?80:128,p=[],uv=[],idx=[];
  samples.forEach((v,i)=>{for(let j=0;j<=N;j++){const q=superellipse(j/N*Math.PI*2,.52,.79,2.6);p.push(q.x*v.x,q.y*v.x,v.z);uv.push(j/N,i/(samples.length-1));if(i<samples.length-1&&j<N){const k=i*(N+1)+j;idx.push(k,k+1,k+N+1,k+1,k+N+2,k+N+1);}}});
  for(const front of [false,true]){const center=p.length/3,row=front?(samples.length-1)*(N+1):0;p.push(0,0,front?.326:-.158);uv.push(.5,.5);for(let j=0;j<N;j++){if(front)idx.push(center,row+j,row+j+1);else idx.push(center,row+j+1,row+j);}}
  return smoothGeometry(p,uv,idx,N+1,samples.length);
}
function flatStrap(points){
  const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),p=[],uv=[],idx=[],N=48,M=12;
  for(let i=0;i<=N;i++){const t=i/N,center=curve.getPoint(t),tangent=curve.getTangent(t),normal=new THREE.Vector3(-tangent.y,tangent.x,0).normalize();for(let j=0;j<=M;j++){const a=j/M*Math.PI*2,c=Math.cos(a),s=Math.sin(a),u=.043*Math.sign(c)*Math.abs(c)**.6,z=.025*Math.sign(s)*Math.abs(s)**.6;p.push(center.x+normal.x*u,center.y+normal.y*u,center.z+z);uv.push(t,j/M);if(i<N&&j<M){const k=i*(M+1)+j;idx.push(k,k+1,k+M+1,k+1,k+M+2,k+M+1);}}}
  return smoothGeometry(p,uv,idx,M+1,N+1);
}

// A stadium perimeter swept through quarter-round bevels. Analytic normals
// keep the highlights continuous across the housing, bevels and face caps.
function oval(w, h, depth, bevel) {
  if (h < w) { const g = oval(h, w, depth, bevel); g.rotateZ(Math.PI / 2); return g; }
  const perimeter = [], radius = w / 2, c = (h - w) / 2;
  for (let i = 0; i < 24; i++) { const t = i / 24 * Math.PI; perimeter.push([radius * Math.cos(t), c + radius * Math.sin(t), Math.cos(t), Math.sin(t)]); }
  for (let i = 0; i < 6; i++) perimeter.push([-radius, c - 2 * c * i / 6, -1, 0]);
  for (let i = 0; i < 24; i++) { const t = Math.PI + i / 24 * Math.PI; perimeter.push([radius * Math.cos(t), -c + radius * Math.sin(t), Math.cos(t), Math.sin(t)]); }
  for (let i = 0; i < 6; i++) perimeter.push([radius, -c + 2 * c * i / 6, 1, 0]);
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

function cushion(mobile=false) {
  const positions = [], uvs = [], indices = [], colors=[], N = mobile?80:128, M = mobile?24:32;
  for (let i = 0; i <= N; i++) {
    const t = i / N * Math.PI * 2;
    const p=superellipse(t,.37,.60,2.5),n=contourNormal(t,.37,.60,2.5);
    for (let j = 0; j <= M; j++) {
      const a = j / M * Math.PI * 2, radius=.133*Math.cos(a),compression=1-.055*Math.cos(t*2);
      positions.push(p.x+n.x*radius,p.y+n.y*radius,.16*Math.sin(a)*compression);
      const ao=(.64+.36*THREE.MathUtils.smoothstep(Math.cos(a),-.85,.5))*(.88+.12*THREE.MathUtils.smoothstep(-Math.sin(a),-.5,.9));colors.push(ao,ao,ao);uvs.push(i/N*2,j/M);
      if (i < N && j < M) { const k = i * (M + 1) + j; indices.push(k, k + M + 1, k + 1, k + 1, k + M + 1, k + M + 2); }
    }
  }
  const geometry=smoothGeometry(positions,uvs,indices,M+1,N+1,colors),normals=geometry.getAttribute('normal');
  for(let j=0;j<=M;j++){const a=j,b=N*(M+1)+j,n=new THREE.Vector3(normals.getX(a)+normals.getX(b),normals.getY(a)+normals.getY(b),normals.getZ(a)+normals.getZ(b)).normalize();normals.setXYZ(a,n.x,n.y,n.z);normals.setXYZ(b,n.x,n.y,n.z);}
  return geometry;
}
function fabricTextures() {
  const n=256,height=new Float32Array(n*n),albedo=new Uint8Array(n*n*4),normal=new Uint8Array(n*n*4),rough=new Uint8Array(n*n*4);
  for(let y=0;y<n;y++)for(let x=0;x<n;x++){
    const tx=x%16,ty=y%16,warp=Math.sin(Math.PI*tx/16)**2,weft=Math.sin(Math.PI*ty/16)**2,over=((x>>4)+(y>>4))%2;
    const fiber=.035*Math.sin(x*2.4+y*.5)+.025*Math.cos(y*2.8-x*.4);height[y*n+x]=(over?warp*.72+weft*.22:weft*.72+warp*.22)+fiber;
  }
  for(let y=0;y<n;y++)for(let x=0;x<n;x++){
    const i=y*n+x,k=i*4,h=height[i],c=Math.round(181+h*52);albedo[k]=albedo[k+1]=albedo[k+2]=c;albedo[k+3]=255;
    const dx=(height[y*n+(x+1)%n]-height[y*n+(x+n-1)%n])*2.4,dy=(height[((y+1)%n)*n+x]-height[((y+n-1)%n)*n+x])*2.4,v=new THREE.Vector3(-dx,-dy,1).normalize();
    normal[k]=Math.round((v.x*.5+.5)*255);normal[k+1]=Math.round((v.y*.5+.5)*255);normal[k+2]=Math.round((v.z*.5+.5)*255);normal[k+3]=255;
    rough[k]=rough[k+1]=rough[k+2]=Math.round(225+h*25);rough[k+3]=255;
  }
  const texture=data=>{const t=new THREE.DataTexture(data,n,n);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(7,3);t.magFilter=THREE.LinearFilter;t.minFilter=THREE.LinearMipmapLinearFilter;t.generateMipmaps=true;t.needsUpdate=true;return t;};
  const color=texture(albedo);color.colorSpace=THREE.SRGBColorSpace;return {color,normal:texture(normal),roughness:texture(rough)};
}
function label(text='N O V A') {
  const c = document.createElement('canvas'); c.width = 512; c.height = 128;
  const ctx = c.getContext('2d'); ctx.fillStyle = '#e2e3e5'; ctx.font = '500 70px Arial'; ctx.textAlign = 'center'; ctx.fillText(text, 256, 86); return new THREE.CanvasTexture(c);
}
