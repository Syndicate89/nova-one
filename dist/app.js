const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const palette={obsidian:{hex:'#24262B',name:'Obsidian',ko:'옵시디언'},lunar:{hex:'#D8D5CF',name:'Lunar',ko:'루나'},pulse:{hex:'#61517D',name:'Pulse',ko:'펄스'}};
const motion=matchMedia('(prefers-reduced-motion: reduce)');
let selected='obsidian',model=null,detail=0,rotation=-.5,studioTilt=-.1,dragging=false;
const scenes=$$('[data-scene]'),studio=$('#colors'),dialog=$('#purchase-dialog');
function selectColor(key){selected=key;const p=palette[key];document.body.dataset.color=key;$$('[data-color-name]').forEach(e=>e.textContent=p.name);$$('[data-color-ko]').forEach(e=>e.textContent=p.ko);$$('[data-swatch]').forEach(e=>e.setAttribute('aria-pressed',String(e.dataset.swatch===key)));}
$$('[data-swatch]').forEach(b=>b.addEventListener('click',()=>selectColor(b.dataset.swatch)));
function angle(value){rotation=Math.atan2(Math.sin(value),Math.cos(value));$('#rotation').value=Math.round(rotation*180/Math.PI);$('#angle').textContent=`${Math.round(rotation*180/Math.PI)}°`;}
$('#rotation').addEventListener('input',e=>angle(+e.target.value*Math.PI/180));
$$('[data-view]').forEach(b=>b.addEventListener('click',()=>{angle(+b.dataset.view);studioTilt=0;}));
$('#reset').addEventListener('click',()=>{angle(-.5);studioTilt=-.1;});
const drag=$('#drag-zone');let pointer=null;
drag.addEventListener('pointerdown',e=>{if(e.button!==0)return;pointer={x:e.clientX,y:e.clientY,angle:rotation,id:e.pointerId};dragging=true;drag.classList.add('dragging');if(e.pointerType==='mouse')drag.setPointerCapture(e.pointerId);});
drag.addEventListener('pointermove',e=>{if(!pointer||pointer.id!==e.pointerId)return;angle(pointer.angle+(e.clientX-pointer.x)*.009);});
function endDrag(){pointer=null;dragging=false;drag.classList.remove('dragging');}
drag.addEventListener('pointerup',endDrag);drag.addEventListener('pointercancel',endDrag);drag.addEventListener('lostpointercapture',endDrag);window.addEventListener('pointerup',endDrag);
const details=[['부드러운 패브릭 이어패드','도톰한 쿠션과 직물의 부드러운 감촉.\n귀를 포근하게 감싸는 타원형 디자인.'],['길이를 조절하는 헤드밴드','매끈한 외장과 안쪽의 부드러운 쿠션.\n슬림한 연결부로 길이를 조절하는 구조.'],['손끝으로 조작하는 다이얼','눈으로 찾지 않아도 손끝으로 자연스럽게.\n오른쪽 이어컵에 놓인 물리 다이얼과 버튼.']];
function selectDetail(i,focus=false){detail=i;$$('[data-detail]').forEach(b=>{const active=+b.dataset.detail===i;b.setAttribute('aria-selected',String(active));b.tabIndex=active?0:-1;if(active&&focus)b.focus();});$('#detail-title').textContent=details[i][0];$('#detail-description').textContent=details[i][1];$('#detail-description').style.whiteSpace='pre-line';$('#detail-panel').setAttribute('aria-labelledby',`detail-${i}`);}
$$('[data-detail]').forEach(b=>{b.addEventListener('click',()=>selectDetail(+b.dataset.detail));b.addEventListener('keydown',e=>{if(['ArrowRight','ArrowLeft','Home','End'].includes(e.key)){e.preventDefault();selectDetail(e.key==='Home'?0:e.key==='End'?2:(detail+(e.key==='ArrowRight'?1:2))%3,true);}});});
$('#immersion').addEventListener('click',e=>{const b=e.currentTarget,on=b.getAttribute('aria-checked')!=='true';b.setAttribute('aria-checked',String(on));document.body.classList.toggle('immersed',on);});
let opener=null;$$('[data-buy]').forEach(b=>b.addEventListener('click',()=>{opener=b;dialog.showModal();document.body.classList.add('modal-open');}));
function closeDialog(){dialog.close();}
$('#close-dialog').addEventListener('click',closeDialog);$('#continue').addEventListener('click',closeDialog);dialog.addEventListener('close',()=>{document.body.classList.remove('modal-open');opener?.focus({preventScroll:true});});dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeDialog();}});
let paths='';for(let i=0;i<17;i++){let d='';for(let x=-100;x<=1500;x+=20){const y=350+Math.sin(x/160+i*.32)*(65+i*7)+(i-8)*9;d+=`${x===-100?'M':'L'}${x},${y.toFixed(1)} `;}paths+=`<path d="${d}"/>`;}$('#waves').innerHTML=paths;
let batteryDone=false;const batteryObserver=new IntersectionObserver(entries=>{if(entries[0].isIntersecting&&!batteryDone){batteryDone=true;const start=performance.now();function count(t){const p=motion.matches?1:Math.min(1,(t-start)/1400),ease=1-Math.pow(1-p,3);$('#hours').textContent=Math.round(ease*40);document.documentElement.style.setProperty('--charge',`${ease*360}deg`);if(p<1)requestAnimationFrame(count);}requestAnimationFrame(count);batteryObserver.disconnect();}},{threshold:.25});batteryObserver.observe($('#battery'));
function onScroll(){const y=scrollY;$('#header').classList.toggle('scrolled',y>30);$('#progress').style.height=`${y/Math.max(1,document.documentElement.scrollHeight-innerHeight)*100}%`;if(document.body.dataset.renderer==='fallback')updateFallback();}
addEventListener('scroll',onScroll,{passive:true});onScroll();
function updateFallback(){let i=0;scenes.forEach((s,j)=>{if(s.getBoundingClientRect().top<innerHeight*.35)i=j;});const f=$('#fallback'),mobile=innerWidth<=600;f.style.left=mobile?'12%':i===0?'28%':i===2||i===5?'4%':i===4?'12%':'53%';f.style.width=mobile?'76%':'43%';f.style.top=mobile&&i===4?`${studio.getBoundingClientRect().top+250}px`:mobile?'16%':'12%';f.style.height=mobile?'39%':'72%';const r=$('#specs').getBoundingClientRect();$('#stage').style.opacity=r.top<innerHeight*.5&&r.bottom>innerHeight*.5||$('footer').getBoundingClientRect().top<innerHeight*.6?'0':'1';}
function fail3D(){document.body.dataset.renderer='fallback';$('#product').hidden=true;$('#fallback').hidden=false;drag.hidden=true;$('.view-controls').hidden=true;$('#rotation').hidden=true;$('.rotation-label').hidden=true;$('#reset').hidden=true;updateFallback();addEventListener('resize',updateFallback);}
const pointerOffset={x:0,y:0};addEventListener('pointermove',e=>{if(e.pointerType==='mouse'&&innerWidth>600){pointerOffset.x=(e.clientX/innerWidth-.5)*.12;pointerOffset.y=(e.clientY/innerHeight-.5)*.08;}},{passive:true});
async function start3D(){
 try{
  const [T,{createHeadphones},{RoomEnvironment}]=await Promise.all([import('./vendor/three.module.js'),import('./headphones.js'),import('./vendor/RoomEnvironment.js')]);
  const canvas=$('#product'),renderer=new T.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,innerWidth<=600?1.5:1.75));renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;renderer.setClearColor(0,0);
  const scene=new T.Scene(),camera=new T.OrthographicCamera(-4,4,3,-3,.1,100);camera.position.set(0,.2,12);camera.lookAt(0,.2,0);
  const pmrem=new T.PMREMGenerator(renderer),room=new RoomEnvironment(),env=pmrem.fromScene(room,.04);scene.environment=env.texture;scene.environmentIntensity=.65;room.dispose();pmrem.dispose();
  scene.add(new T.HemisphereLight(0xd8e5ff,0x252531,1.2));
  const key=new T.DirectionalLight(0xffffff,2.4);key.position.set(-3,5,6);scene.add(key);
  const rim=new T.DirectionalLight(0xd6ff9d,2.6);rim.position.set(3,2,-4);scene.add(rim);
  const fill=new T.DirectionalLight(0xb7c3e5,1.6);fill.position.set(-5,-1,2);scene.add(fill);
  model=createHeadphones();scene.add(model.group);const group=model.group;
  const currentColor=new T.Color(palette[selected].hex),targetColor=new T.Color();
  let w=0,h=0,initial=performance.now(),last=0,offsets=[];
  function resize(){w=innerWidth;h=innerHeight;const height=w<=600?7.8:Math.max(5.5,7.6/(w/h));camera.left=-height*w/h/2;camera.right=height*w/h/2;camera.top=height/2;camera.bottom=-height/2;camera.updateProjectionMatrix();renderer.setSize(w,h,false);offsets=scenes.map(e=>e.offsetTop);}
  resize();addEventListener('resize',resize);new ResizeObserver(resize).observe(document.body);
  function poses(){const mobile=w<=600;const x=Math.min(2.35,(camera.right-camera.left)*.25);return mobile?[
   {x:0,y:1.15,s:.82,ry:-.5,rz:-.13,rx:.06},
   {x:0,y:1.52,s:.80,ry:.65,rz:.06,rx:.04},
   {x:0,y:1.55,s:detail===1?.91:.81,ry:[-.8,-.32,-1.28][detail],rz:.05,rx:.09},
   {x:0,y:1.65,s:.77,ry:-.7,rz:-.08,rx:.10},
   {x:0,y:-.10,s:.83,ry:rotation,rz:studioTilt,rx:.03},
   {x:0,y:1.60,s:.79,ry:-.6,rz:-.13,rx:.10}
  ]:[
   {x:0,y:-.10,s:1.08,ry:-.5,rz:-.16,rx:.08},
   {x:x,y:-.10,s:1.08,ry:.6,rz:.09,rx:.06},
   {x:-x,y:detail===1?-.52:.08,s:detail===1?1.55:1.27,ry:[-.85,-.25,-1.23][detail],rz:.08,rx:.08},
   {x:x,y:-.12,s:1.05,ry:-.65,rz:-.12,rx:.1},
   {x:-.45,y:-.15,s:1.08,ry:rotation,rz:studioTilt,rx:.03},
   {x:-x,y:-.15,s:1.08,ry:-.6,rz:-.13,rx:.1}
  ];}
  function render(t){
   if(document.hidden)return;if(t-last<(w<=600?30:15))return;const dt=Math.min(.1,(t-last)/1000||.016);last=t;
   const y=scrollY,ps=poses();let index=0;for(let i=1;i<offsets.length;i++)if(y>=offsets[i])index=i;
   let p=index===ps.length-1?0:T.MathUtils.clamp((y-offsets[index])/(offsets[index+1]-offsets[index]),0,1);p=T.MathUtils.smoothstep(p,.14,.90);if(motion.matches)p=p<.5?0:1;
   const a=ps[index],b=ps[Math.min(index+1,ps.length-1)],lerp=k=>T.MathUtils.lerp(a[k],b[k],p);const entry=motion.matches?0:Math.max(0,1-(t-initial)/1250),bob=motion.matches?0:Math.sin(t*.0008)*.025;
   const inMobileStudio=w<=600&&y>=studio.offsetTop-h*.20&&y<$('#specs').offsetTop;
   const targetY=inMobileStudio?-.1+(y-studio.offsetTop)/h*7.8:lerp('y');
   const smooth=motion.matches?1:1-Math.exp(-dt*9);
   group.position.x=T.MathUtils.lerp(group.position.x,lerp('x'),smooth);group.position.y=T.MathUtils.lerp(group.position.y,targetY+bob,smooth);group.scale.setScalar(T.MathUtils.lerp(group.scale.x,lerp('s'),smooth));
   group.rotation.x=T.MathUtils.lerp(group.rotation.x,lerp('rx')+(motion.matches?0:pointerOffset.y),smooth);group.rotation.y=T.MathUtils.lerp(group.rotation.y,lerp('ry')+entry*.7+(index===0&&!motion.matches?pointerOffset.x:0),smooth);group.rotation.z=T.MathUtils.lerp(group.rotation.z,lerp('rz'),smooth);
   targetColor.set(palette[selected].hex);currentColor.lerp(targetColor,motion.matches?1:1-Math.exp(-dt*6));model.setColor('#'+currentColor.getHexString());
   const specRect=$('#specs').getBoundingClientRect(),footRect=$('footer').getBoundingClientRect();const specOverlap=Math.max(0,Math.min(h,specRect.bottom)-Math.max(0,specRect.top))/h;const footOverlap=Math.max(0,h-footRect.top)/h;$('#stage').style.opacity=String(1-Math.min(1,Math.max(specOverlap,footOverlap)*1.5));
   renderer.toneMappingExposure=selected==='lunar'?.9:1.25;renderer.render(scene,camera);document.body.dataset.renderer='webgl';canvas.dataset.rotation=group.rotation.y.toFixed(3);canvas.dataset.scene=String(index);canvas.dataset.color=selected;
  }
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();renderer.setAnimationLoop(null);fail3D();});renderer.setAnimationLoop(render);
 }catch(error){console.error('NOVA 3D could not start:',error);fail3D();}
}
if(new URLSearchParams(location.search).get('view')==='static')fail3D();else start3D();
