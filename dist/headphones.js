import * as THREE from './vendor/three.module.js';

// Model adapter: replace createHeadphones with a GLTFLoader adapter returning
// { group, setColor(hex) }. The presentation never depends on mesh names.
export function createHeadphones(){
 const group=new THREE.Group(); group.name='NOVA_ONE';
 const shell=new THREE.MeshPhysicalMaterial({color:'#24262b',metalness:.48,roughness:.31,clearcoat:.25,clearcoatRoughness:.38});
 const metal=new THREE.MeshStandardMaterial({color:'#70747b',metalness:.9,roughness:.27});
 const trim=new THREE.MeshStandardMaterial({color:'#41464e',metalness:.85,roughness:.3});
 const fabric=new THREE.MeshStandardMaterial({color:'#22252b',roughness:.95,bumpMap:weave(),bumpScale:.022});
 const black=new THREE.MeshStandardMaterial({color:'#080a0c',roughness:.98});
 const logoMaterial=new THREE.MeshStandardMaterial({color:'#b7bbc0',roughness:.55,metalness:.4,transparent:true,map:label()});
 function mesh(geo,mat,parent=group){const m=new THREE.Mesh(geo,mat);parent.add(m);return m;}
 function tube(points,r,mat,parent=group){return mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),36,r,10,false),mat,parent);}
 // Swept ellipse with a flattened cross section gives a continuous padded arch.
 function arch(rx,ry,start,end,radial,depth,mat){const positions=[],indices=[],N=96,M=20;for(let i=0;i<=N;i++){const t=start+(end-start)*i/N;const n=new THREE.Vector3(Math.cos(t)/rx,Math.sin(t)/ry,0).normalize();for(let j=0;j<=M;j++){const a=j/M*Math.PI*2;positions.push(rx*Math.cos(t)+n.x*radial*Math.cos(a),.28+ry*Math.sin(t)+n.y*radial*Math.cos(a),depth*Math.sin(a));if(i<N&&j<M){const k=i*(M+1)+j;indices.push(k,k+M+1,k+1,k+1,k+M+1,k+M+2);}}}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();return mesh(g,mat);}
 arch(1.48,1.72,.025,Math.PI-.025,.105,.255,shell).name='headband-shell';
 arch(1.42,1.60,.20,Math.PI-.20,.075,.225,fabric).name='headband-padding';
 // Fine inset seam, visible in silhouette without decorative visual clutter.
 for(const z of [-.235,.235]){const points=[];for(let i=0;i<=64;i++){const t=.08+(Math.PI-.16)*i/64;points.push([1.49*Math.cos(t),.28+1.72*Math.sin(t),z]);}tube(points,.009,trim);}
 function oval(w,h,d,bevel){const s=new THREE.Shape();const r=w/2;s.moveTo(-r,-h/2+r);s.lineTo(-r,h/2-r);s.absarc(0,h/2-r,r,Math.PI,0,true);s.lineTo(r,-h/2+r);s.absarc(0,-h/2+r,r,0,-Math.PI,true);return new THREE.ExtrudeGeometry(s,{depth:d,bevelEnabled:true,bevelSize:bevel,bevelThickness:bevel,bevelSegments:6,steps:1,curveSegments:32});}
 function cushion(){const g=new THREE.BufferGeometry(),p=[],idx=[],N=96,M=20;for(let i=0;i<=N;i++){const t=i/N*Math.PI*2;for(let j=0;j<=M;j++){const a=j/M*Math.PI*2;p.push((.375+.145*Math.cos(a))*Math.cos(t),(.615+.145*Math.cos(a))*Math.sin(t),.14*Math.sin(a));if(i<N&&j<M){let k=i*(M+1)+j;idx.push(k,k+M+1,k+1,k+1,k+M+1,k+M+2);}}}g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setIndex(idx);g.computeVertexNormals();return g;}
 for(const side of [-1,1]){
  const cup=new THREE.Group();cup.name=side===1?'right-earcup':'left-earcup';cup.position.set(side*1.47,-.61,0);cup.rotation.y=side*Math.PI/2;cup.rotation.x=.045;group.add(cup);
  mesh(oval(.87,1.42,.18,.105),shell,cup).name='earcup-housing';
  const seam=mesh(oval(.89,1.44,.022,.07),trim,cup);seam.position.z=-.045;
  const base=mesh(oval(.83,1.36,.06,.075),black,cup);base.position.z=-.14;
  const pad=mesh(cushion(),fabric,cup);pad.position.z=-.225;pad.name='fabric-cushion';
  const inner=mesh(new THREE.CircleGeometry(1,64),fabric,cup);inner.scale.set(.29,.51,1);inner.position.z=-.18;inner.rotation.y=Math.PI;
  const plate=mesh(new THREE.PlaneGeometry(.45,.13),logoMaterial,cup);plate.position.set(0,-.12,.287);plate.name='NOVA-logo';
  // Twin arms and hinge pivots provide a mechanically continuous connection.
  const yoke=new THREE.Group();yoke.name='aluminium-yoke';group.add(yoke);
  for(const z of [-.39,.39]){
   tube([[side*1.48,.32,0],[side*1.52,.05,z*.64],[side*1.59,-.16,z],[side*1.59,-.57,z]],.043,metal,yoke);
   const hinge=mesh(new THREE.CylinderGeometry(.077,.077,.07,32),trim,yoke);hinge.rotation.z=Math.PI/2;hinge.position.set(side*1.60,-.57,z);
  }
  const rail=mesh(new THREE.CylinderGeometry(.061,.061,.43,20),metal);rail.position.set(side*1.47,.22,0);
  if(side===1){
   const dial=mesh(new THREE.CylinderGeometry(.123,.123,.09,64),metal,cup);dial.rotation.x=Math.PI/2;dial.position.set(.28,-.43,.292);dial.name='control-dial';
   const cap=mesh(new THREE.CircleGeometry(.103,48),trim,cup);cap.position.set(.28,-.43,.34);
   for(let j=0;j<36;j++){const t=j/36*Math.PI*2;const line=mesh(new THREE.BoxGeometry(.007,.017,.08),trim,cup);line.position.set(.28+.12*Math.cos(t),-.43+.12*Math.sin(t),.294);line.rotation.z=t-Math.PI/2;}
   const led=mesh(new THREE.SphereGeometry(.018,12,8),new THREE.MeshBasicMaterial({color:'#caff69'}),cup);led.position.set(.15,-.61,.28);
   const port=mesh(new THREE.BoxGeometry(.13,.034,.052),black,cup);port.position.set(0,-.81,.08);port.name='USB-C';
   const button=mesh(new THREE.CapsuleGeometry(.027,.11,4,12),trim,cup);button.rotation.z=Math.PI/2;button.position.set(-.22,-.54,.281);
  }
 }
 function setColor(hex){shell.color.set(hex);const c=new THREE.Color(hex);fabric.color.copy(c).multiplyScalar(hex==='#D8D5CF'?.65:.8);trim.color.copy(c).lerp(new THREE.Color('#91949b'),.24);}
 return {group,setColor};
}
function weave(){const n=128,data=new Uint8Array(n*n*4);for(let y=0;y<n;y++)for(let x=0;x<n;x++){const k=(y*n+x)*4,v=100+((x%4<2)!==(y%4<2)?65:0)+Math.round(12*Math.sin(x*11+y*7));data[k]=data[k+1]=data[k+2]=v;data[k+3]=255;}const t=new THREE.DataTexture(data,n,n);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(5,7);t.needsUpdate=true;return t;}
function label(){const c=document.createElement('canvas');c.width=512;c.height=128;const ctx=c.getContext('2d');ctx.fillStyle='#c5c8cc';ctx.font='500 70px Arial';ctx.textAlign='center';ctx.fillText('N O V A',256,86);return new THREE.CanvasTexture(c);}

