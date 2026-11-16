import {
  AdditiveBlending, BufferAttribute, BufferGeometry, CanvasTexture, Color,
  DirectionalLight, DoubleSide, Group, HemisphereLight, Mesh, MeshBasicMaterial,
  MeshStandardMaterial, OrthographicCamera, PlaneGeometry, PointLight, Points,
  RingGeometry, Scene, ShaderMaterial, SphereGeometry, SRGBColorSpace, WebGLRenderer,
} from 'three';

const TAU = Math.PI * 2;
const skies = {
  chatgpt: ['#78ebd8','#5077ca','#e4adbc'],
  claude: ['#ffbc99','#7563af','#f4d3d1'],
  gemini: ['#a69cff','#3c91cf','#ffd3bc'],
};
const soils = [
  ['#171d3e','#337f9d','#b0e5ce'],
  ['#392451','#915889','#ffceaf'],
  ['#2d233e','#966450','#f6d5a5'],
  ['#172955','#5359ad','#bad4ff'],
  ['#16333f','#497d65','#dce2a6'],
];
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

// The luminous arms and the obscuring dust lanes are one authored sky texture.
function galaxyTexture(palette) {
  const [cyan,blue,rose] = palette.map(rgb);
  return makeTexture(480,272,(u,v,pixel,index)=>{
    const x = (u-.5)*2.12, y = (v-.5)*1.55;
    const ax = .89*x-.46*y, ay = (.46*x+.89*y)*1.24;
    const r = Math.hypot(ax,ay);
    const grain = clouds(ax*6.3,ay*6.3,11);
    const arms = .5+.5*Math.cos(2*Math.atan2(ay,ax)-4.15*Math.log(r+.13)+grain*2.7);
    const lane = .5+.5*Math.cos(arms*5.1+clouds(ax*18,ay*18,31)*4.8);
    const envelope = Math.exp(-r*r*2.25);
    const dust = Math.pow(arms,2.2)*envelope*(.25+.75*grain)*(.53+.47*lane)*clamp(r*4.9);
    const veil = Math.pow(grain,2.3)*envelope*.82;
    const spill = Math.exp(-Math.pow(ay+.22*ax+.09,2)*15-ax*ax*.76)*.74*(.35+.65*grain);
    const tint = clamp(.31+ax*.47+grain*.29);
    const vignette = Math.exp(-(x*x+y*y)*.73);
    for(let i=0;i<3;i++) {
      const lights = mix(cyan[i],rose[i],tint);
      pixel[index+i] = 5+i*4 + vignette*(lights*dust*.77+blue[i]*veil*.27+blue[i]*spill*.14);
    }
    pixel[index+3] = 255;
  });
}

// Equirectangular surface maps. Gas giants use perturbed bands; rocky worlds use grain and mineral patches.
function planetTexture(colors,index) {
  const [base,mid,light] = colors.map(rgb);
  const gas = index===1 || index===3;
  return makeTexture(144,72,(u,v,pixel,p)=>{
    const theta = TAU*u, latitude = Math.PI*(v-.5);
    const x = Math.cos(theta)*Math.cos(latitude), z = Math.sin(theta)*Math.cos(latitude);
    const y = Math.sin(latitude);
    const large = clouds(x*4.2+y*2,z*4.2-y*2.6,index+24);
    const ect = noise(x*14+y*9,z*14-y*9.1,index+8);
    const terrain = gas ? .5+.5*Math.sin(y*27+large*4.6+.65*ect) :
      clamp(.52+(large-.46)*2.6+(ect-.52)*.34);
    for(let c=0;c<3;c++) pixel[p+c]=mix(mix(base[c],mid[c],clamp(terrain*1.5)),light[c],
      Math.pow(terrain,3.4)*(.64+.31*ect));
    pixel[p+3]=255;
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
    uniforms:{tint:{value:new Color('#fff')},density:{value:1},strength:{value:strength}},
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
      uniform float strength;
      void main() {
        vec2 p=abs(gl_PointCoord-.5);
        float core=exp(-90.*dot(p,p));
        float halo=exp(-26.*dot(p,p))*.42;
        float ray=(exp(-90.*p.x)*exp(-8.*p.y)+exp(-90.*p.y)*exp(-8.*p.x))*.20;
        gl_FragColor=vec4(mix(tint,vec3(.95,.95,1.),power),
          (core+halo+ray*pow(power,9.))*mix(.12,.83,power)*strength);
      }
    `,
    transparent:true,depthWrite:false,blending:AdditiveBlending
  });
  return new Points(geometry,material);
}

function makeArt(canvas) {
  const renderer = new WebGLRenderer({canvas,antialias:true,powerPreference:'low-power'});
  const world = new Scene();
  const camera = new OrthographicCamera(-1,1,1,-1,1,1800);
  camera.position.z=720;
  const sky = new Mesh(new PlaneGeometry(1,1),new MeshBasicMaterial());
  sky.position.z=-430;
  const far = starLayer(700,19,.69);
  const near = starLayer(230,47,.98);
  far.position.z=-350;
  near.position.z=-244;
  const sphere = new SphereGeometry(1,32,22);
  const planets = soils.map((colors,i)=>{
    const group = new Group();
    const body = new Mesh(sphere,new MeshStandardMaterial({
      map:planetTexture(colors,i),roughness:.88,metalness:.04,
    }));
    group.add(body);
    if(i===2) {
      const ring = new Mesh(new RingGeometry(1.22,1.66,56),
        new MeshBasicMaterial({color:'#ddc6aa',side:DoubleSide,transparent:true,opacity:.52,depthWrite:false}));
      ring.rotation.set(.97,-.25,-.50);
      group.add(ring);
    }
    world.add(group);
    return {group,body};
  });
  const sun = new PointLight('#fff0d6',2.6,0,0);
  const fill = new HemisphereLight('#b6ccff','#4a4968',.74);
  const rim = new DirectionalLight('#a3bfff',1.65);
  rim.position.set(-5,4,6);
  world.add(sky,far,near,sun,fill,rim);
  return {renderer,world,camera,sky,far,near,sun,planets};
}

function mountOrbit(stage,canvas) {
  const root=document.documentElement;
  const track=stage.parentElement;
  const firstCard=stage.querySelector('.imos-wheel-card');
  let frame={position:-Number(firstCard?.style.getPropertyValue('--wheel-offset') || 0),
    count:stage.querySelectorAll('.imos-wheel-card').length || 4};
  let art,visible=false,contextLost=false,pending=0,lastPaint=-Infinity;
  let dimensionsDirty=true,paletteDirty=true;
  let rx,ry,depth,planetRadius,planetLift,depthScale;
  const skiesByVendor=new Map();

  function canPaint() {
    return visible && !contextLost && !document.hidden && document.body.dataset.scene==='chooser' &&
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
    if(dimensionsDirty) {
      const width=stage.clientWidth,height=stage.clientHeight;
      const planet=stage.querySelector('.imos-wheel-planet');
      if(!width || !height || !planet) return;
      const rail=getComputedStyle(stage,'::before');
      rx=parseFloat(rail.width)/2;
      ry=parseFloat(rail.height)/2;
      depth=Math.max(32,Math.sqrt(Math.max(0,rx*rx-ry*ry)));
      planetRadius=planet.offsetWidth/2;
      planetLift=planet.closest('a').offsetHeight*.11;
      depthScale=Number(getComputedStyle(track).getPropertyValue('--orbit-depth-size'));
      const pixelRatio=Math.min(devicePixelRatio || 1,1.4);
      art.renderer.setPixelRatio(pixelRatio);
      art.renderer.setSize(width,height,false);
      Object.assign(art.camera,{left:-width/2,right:width/2,top:height/2,bottom:-height/2});
      art.camera.updateProjectionMatrix();
      art.sky.scale.set(width*1.1,height*1.1,1);
      art.far.scale.set(width*.60,height*.62,39);
      art.near.scale.set(width*.63,height*.65,38);
      art.far.material.uniforms.density.value=pixelRatio*.79;
      art.near.material.uniforms.density.value=pixelRatio*1.01;
      art.sun.position.z=depth*.34;
      dimensionsDirty=false;
    }
    if(paletteDirty) {
      const name=document.body.dataset.guideProvider;
      const palette=skies[name] || skies.chatgpt;
      if(!skiesByVendor.has(name)) skiesByVendor.set(name,galaxyTexture(palette));
      art.sky.material.map=skiesByVendor.get(name);
      art.sky.material.needsUpdate=true;
      art.far.material.uniforms.tint.value.set(palette[1]);
      art.near.material.uniforms.tint.value.set(palette[2]);
      paletteDirty=false;
    }
    const phase=TAU*frame.position/frame.count;
    art.far.position.x=5*Math.sin(phase);
    art.far.position.y=3*Math.cos(phase);
    art.near.position.x=18*Math.sin(phase+.35);
    art.near.position.y=8*Math.cos(phase);
    art.sky.position.x=-5*Math.sin(phase);
    for(let i=0;i<art.planets.length;i++) {
      const {group,body}=art.planets[i];
      group.visible=i<frame.count;
      const angle=TAU*(i-frame.position)/frame.count;
      const front=Math.cos(angle);
      const distance=(1-front)/2;
      const labelScale=1-depthScale*distance;
      group.position.set(rx*Math.sin(angle),-ry*front+planetLift*labelScale,depth*front);
      group.scale.setScalar(planetRadius*labelScale*(1-.13*distance));
      body.rotation.y=phase+i*.93;
    }
    art.renderer.render(art.world,art.camera);
    stage.dataset.orbitRenderer='three';
    lastPaint=now;
  }

  track.addEventListener('imos:orbit-frame',event=>{frame=event.detail;schedule();});
  canvas.addEventListener('webglcontextlost',event=>{
    event.preventDefault();
    contextLost=true;
    delete stage.dataset.orbitRenderer;
  });
  canvas.addEventListener('webglcontextrestored',()=>{
    contextLost=false;
    dimensionsDirty=paletteDirty=true;
    schedule();
  });
  new ResizeObserver(()=>{dimensionsDirty=true;schedule();}).observe(stage);
  new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;schedule();}).observe(stage);
  new MutationObserver(()=>{paletteDirty=true;schedule();}).observe(document.body,{
    attributes:true,attributeFilter:['data-scene','data-guide-provider'],
  });
  new MutationObserver(schedule).observe(root,{attributes:true,attributeFilter:['data-portal-transition']});
  document.addEventListener('visibilitychange',schedule);
}

const canvas=document.querySelector('#imos-wheel .imos-orbit-canvas');
if(canvas) mountOrbit(canvas.parentElement,canvas);
