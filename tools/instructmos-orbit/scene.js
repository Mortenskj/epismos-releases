import {
  BufferAttribute, BufferGeometry, CanvasTexture, Color, Mesh, MeshBasicMaterial,
  OrthographicCamera, PlaneGeometry, Points, Scene, ShaderMaterial,
  SRGBColorSpace, WebGLRenderer,
} from 'three';

const TAU = Math.PI * 2;
const skies = {
  chatgpt: {colors:['#78ebd8','#5077ca','#d0dec4'],angle:.26,flatten:1.36,curl:3.8,arms:2,seed:11},
  claude: {colors:['#ffbc99','#8d65a8','#f5d9bf'],angle:-.49,flatten:1.06,curl:3.1,arms:2,seed:27},
  gemini: {colors:['#ad96ff','#4299e5','#f2afe1'],angle:.64,flatten:1.24,curl:4.2,arms:3,seed:47},
};
const mix = (a,b,t) => a+(b-a)*t;
const clamp = n => Math.max(0,Math.min(1,n));
const rgb = hex => [1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));

function cell(x,y,seed) {
  let n = Math.imul(x+seed,374761393) + Math.imul(y,668265263);
  n = Math.imul(n^(n>>>13),1274126177);
  return ((n^(n>>>16))>>>0)/4294967295;
}
function noise(x,y,seed) {
  const ix = Math.floor(x), iy = Math.floor(y);
  const dx = x-ix, dy = y-iy;
  const sx = dx*dx*(3-2*dx), sy = dy*dy*(3-2*dy);
  return mix(mix(cell(ix,iy,seed),cell(ix+1,iy,seed),sx),
    mix(cell(ix,iy+1,seed),cell(ix+1,iy+1,seed),sx),sy);
}
function clouds(x,y,seed) {
  return .58*noise(x,y,seed)+.28*noise(x*2.13,y*2.13,seed+4)+.14*noise(x*4.37,y*4.37,seed+13);
}
function makeTexture(width,height,sample) {
  const image = document.createElement('canvas');
  image.width = width;
  image.height = height;
  const context = image.getContext('2d');
  const output = context.createImageData(width,height);
  for(let y=0;y<height;y++) for(let x=0;x<width;x++) {
    sample(x/width,y/height,output.data,(y*width+x)*4);
  }
  context.putImageData(output,0,0);
  const texture = new CanvasTexture(image);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

// Keep each cloud near the orbit and let its feathered edges dissolve into the wider star field.
function galaxyTexture(sky,light) {
  const [cyan,blue,rose] = sky.colors.map(rgb);
  const cos=Math.cos(sky.angle),sin=Math.sin(sky.angle);
  return makeTexture(480,272,(u,v,pixel,index)=>{
    const x = (u-.5)*2.12, y = (v-.5)*1.55;
    const ax = cos*x-sin*y, ay = (sin*x+cos*y)*sky.flatten;
    const r = Math.hypot(ax,ay);
    const grain = clouds(ax*6.3,ay*6.3,sky.seed);
    const arms = .5+.5*Math.cos(sky.arms*Math.atan2(ay,ax)-sky.curl*Math.log(r+.13)+grain*2.7);
    const lane = .5+.5*Math.cos(arms*5.1+clouds(ax*18,ay*18,sky.seed+20)*4.8);
    const envelope = Math.exp(-r*r*2.25);
    const dust = Math.pow(arms,2.2)*envelope*(.25+.75*grain)*(.53+.47*lane)*clamp(r*4.9);
    const veil = Math.pow(grain,2.3)*envelope*.82;
    const spill = Math.exp(-Math.pow(ay+.22*ax+.09,2)*15-ax*ax*.76)*.74*(.35+.65*grain);
    const tint = clamp(.31+ax*.47+grain*.29);
    const vignette = Math.exp(-(x*x+y*y)*.73);
    for(let i=0;i<3;i++) {
      const illumination = mix(cyan[i],rose[i],tint);
      pixel[index+i] = light ?
        247+i*3 - vignette*((255-illumination)*dust*.77+(255-blue[i])*(veil*.31+spill*.22)) :
        5+i*4 + vignette*(illumination*dust*.86+blue[i]*veil*.36+blue[i]*spill*.21);
    }
    const feather=clamp(Math.min(u,1-u,v,1-v)*5.2);
    pixel[index+3]=255*feather*feather*(3-2*feather)*Math.exp(-r*r*.28);
  });
}

function starLayer(count,seed,strength) {
  const positions=[], intensities=[];
  for(let i=0;i<count;i++) {
    const x = cell(i,1,seed)*2-1;
    const y = cell(i,7,seed)*2-1;
    positions.push(x,y,cell(i,13,seed)*2-1);
    intensities.push(cell(i,17,seed));
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position',new BufferAttribute(new Float32Array(positions),3));
  geometry.setAttribute('brightness',new BufferAttribute(new Float32Array(intensities),1));
  const material = new ShaderMaterial({
    uniforms:{tint:{value:new Color('#fff')},coreColor:{value:new Color('#fff')},
      density:{value:1},strength:{value:strength}},
    vertexShader:`
      attribute float brightness;
      uniform float density;
      varying float power;
      void main() {
        power=brightness;
        gl_PointSize=(1.2+pow(brightness,6.0)*9.0)*density;
        gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);
      }
    `,
    fragmentShader:`
      varying float power;
      uniform vec3 tint;
      uniform vec3 coreColor;
      uniform float strength;
      void main() {
        vec2 p=abs(gl_PointCoord-.5);
        float core=exp(-90.*dot(p,p));
        float halo=exp(-26.*dot(p,p))*.42;
        float ray=(exp(-90.*p.x)*exp(-8.*p.y)+exp(-90.*p.y)*exp(-8.*p.x))*.20;
        gl_FragColor=vec4(mix(tint,coreColor,power),
          (core+halo+ray*pow(power,9.))*mix(.12,.83,power)*strength);
      }
    `,
    transparent:true,depthWrite:false
  });
  const stars = new Points(geometry,material);
  stars.userData.strength = strength;
  return stars;
}

function makeArt(canvas) {
  const renderer = new WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'low-power'});
  const world = new Scene();
  const camera = new OrthographicCamera(-1,1,1,-1,1,1800);
  camera.position.z=720;
  const sky = new Mesh(new PlaneGeometry(1,1),new MeshBasicMaterial({transparent:true,depthWrite:false}));
  sky.renderOrder=-1;
  sky.position.z=-430;
  const far = starLayer(1020,19,.63);
  const near = starLayer(218,47,.89);
  far.position.z=-350;
  near.position.z=-244;
  world.add(sky,far,near);
  return {renderer,world,camera,sky,far,near};
}

function mountGalaxy(backdrop,canvas) {
  const root=document.documentElement;
  const track=document.querySelector('#imos-wheel .imos-wheel-track');
  const firstCard=track.querySelector('.imos-wheel-card');
  let frame={position:-Number(firstCard?.style.getPropertyValue('--wheel-offset') || 0),
    count:track.querySelectorAll('.imos-wheel-card').length || 4};
  let art,contextLost=false,pending=0,lastPaint=-Infinity;
  let dimensionsDirty=true,paletteDirty=true,orbitDirty=true;
  let skyX=0,skyY=0;
  const skiesByVendor=new Map();

  function canPaint() {
    return !contextLost && !document.hidden && document.body.dataset.scene==='chooser' &&
      !root.hasAttribute('data-portal-transition');
  }
  function schedule() {
    if(!pending && canPaint()) pending=requestAnimationFrame(paint);
  }
  function paint(now) {
    pending=0;
    if(!canPaint()) return;
    if(now-lastPaint<32) {
      schedule();
      return;
    }
    if(!art) {
      try {art=makeArt(canvas);}
      catch {contextLost=true;return;}
    }
    const light=root.dataset.theme==='light';
    if(dimensionsDirty) {
      const width=backdrop.clientWidth,height=backdrop.clientHeight;
      if(!width || !height) return;
      const pixelRatio=Math.min(devicePixelRatio || 1,1.35,Math.sqrt(1550000/(width*height)));
      art.renderer.setPixelRatio(pixelRatio);
      art.renderer.setSize(width,height,false);
      Object.assign(art.camera,{left:-width/2,right:width/2,top:height/2,bottom:-height/2});
      art.camera.updateProjectionMatrix();
      art.far.scale.set(width*.60,height*.62,39);
      art.near.scale.set(width*.63,height*.65,38);
      art.far.material.uniforms.density.value=pixelRatio*.79;
      art.near.material.uniforms.density.value=pixelRatio*1.01;
      dimensionsDirty=false;
      orbitDirty=true;
    }
    if(orbitDirty) {
      const bounds=track.getBoundingClientRect();
      if(!bounds.width || !bounds.height) return;
      skyX=bounds.left+(bounds.width-backdrop.clientWidth)/2;
      skyY=(backdrop.clientHeight-bounds.height)/2-bounds.top;
      art.sky.scale.set(bounds.width*1.47,bounds.height*1.72,1);
      orbitDirty=false;
    }
    if(paletteDirty) {
      const name=document.body.dataset.guideProvider;
      const solarSystem=skies[name] || skies.chatgpt;
      const key=name+'/'+light;
      if(!skiesByVendor.has(key)) skiesByVendor.set(key,galaxyTexture(solarSystem,light));
      art.sky.material.map=skiesByVendor.get(key);
      art.sky.material.needsUpdate=true;
      for(const [stars,tint] of [[art.far,solarSystem.colors[1]],[art.near,solarSystem.colors[2]]]) {
        stars.material.uniforms.tint.value.set(tint);
        stars.material.uniforms.coreColor.value.set(light?'#71608d':'#eff6ff');
        stars.material.uniforms.strength.value=stars.userData.strength*(light?.5:1);
      }
      paletteDirty=false;
    }
    const phase=TAU*frame.position/frame.count;
    art.far.position.x=5*Math.sin(phase);
    art.far.position.y=3*Math.cos(phase);
    art.near.position.x=18*Math.sin(phase+.35);
    art.near.position.y=8*Math.cos(phase);
    art.sky.position.x=skyX-5*Math.sin(phase);
    art.sky.position.y=skyY;
    art.renderer.render(art.world,art.camera);
    if(!backdrop.dataset.orbitRenderer) backdrop.dataset.orbitRenderer='three';
    const theme=light?'light':'dark';
    if(backdrop.dataset.orbitTheme!==theme) backdrop.dataset.orbitTheme=theme;
    lastPaint=now;
  }

  track.addEventListener('imos:orbit-frame',event=>{frame=event.detail;schedule();});
  canvas.addEventListener('webglcontextlost',event=>{
    event.preventDefault();
    contextLost=true;
    delete backdrop.dataset.orbitRenderer;
  });
  canvas.addEventListener('webglcontextrestored',()=>{
    contextLost=false;
    dimensionsDirty=paletteDirty=true;
    schedule();
  });
  new ResizeObserver(()=>{dimensionsDirty=true;schedule();}).observe(backdrop);
  function syncOrbitPosition() {orbitDirty=true;schedule();}
  new ResizeObserver(syncOrbitPosition).observe(track);
  window.addEventListener('scroll',syncOrbitPosition,{passive:true});
  new MutationObserver(()=>{paletteDirty=orbitDirty=true;schedule();}).observe(document.body,{
    attributes:true,attributeFilter:['data-scene','data-guide-provider'],
  });
  new MutationObserver(schedule).observe(root,{attributes:true,attributeFilter:['data-portal-transition']});
  new MutationObserver(()=>{paletteDirty=true;schedule();}).observe(root,{attributes:true,attributeFilter:['data-theme']});
  document.addEventListener('visibilitychange',schedule);
  schedule();
}

const canvas=document.querySelector('.imos-orbit-canvas');
if(canvas) mountGalaxy(canvas.parentElement,canvas);
