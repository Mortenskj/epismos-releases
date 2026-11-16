import {
  AdditiveBlending, BufferAttribute, BufferGeometry, CanvasTexture, Color,
  DirectionalLight, EquirectangularReflectionMapping, Group, HemisphereLight,
  Line, LineBasicMaterial, LineSegments, Mesh, MeshBasicMaterial, MeshPhysicalMaterial,
  OrthographicCamera, Points, PointsMaterial, Scene, SphereGeometry, Sprite,
  SpriteMaterial, SRGBColorSpace, TorusGeometry, WebGLRenderer,
} from 'three';

const TAU = Math.PI * 2;
const palettes = {
  chatgpt: ['#64dfbf', '#174c42', '#c8faf1'],
  claude: ['#f1aa78', '#7a3928', '#ffddba'],
  gemini: ['#a394ff', '#3a318e', '#7fe8fb'],
};

// Studio softboxes painted into an equirectangular reflection map.
function studioTexture() {
  const image = document.createElement('canvas');
  image.width = 256;
  image.height = 128;
  const ctx = image.getContext('2d');
  const horizon = ctx.createLinearGradient(0,0,0,128);
  horizon.addColorStop(0,'#59657b');
  horizon.addColorStop(.43,'#303951');
  horizon.addColorStop(.57,'#161b2b');
  horizon.addColorStop(1,'#111321');
  ctx.fillStyle = horizon;
  ctx.fillRect(0,0,256,128);
  for (const [x,y,w,h,color] of [[72,32,48,15,'#fff0df'],[174,50,33,9,'#afcfff'],[209,79,27,5,'#6e91bd'],[32,67,14,2,'#ead8c7']]) {
    const light = ctx.createRadialGradient(0,0,0,0,0,1);
    light.addColorStop(0,color);
    light.addColorStop(.52,color);
    light.addColorStop(1,color+'00');
    ctx.save();
    ctx.translate(x,y);
    ctx.scale(w,h);
    ctx.fillStyle = light;
    ctx.fillRect(-1,-1,2,2);
    ctx.restore();
  }
  const texture = new CanvasTexture(image);
  texture.mapping = EquirectangularReflectionMapping;
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

// A compact optical flare also serves as the point-sprite mask.
function flareTexture() {
  const image = document.createElement('canvas');
  image.width = image.height = 64;
  const ctx = image.getContext('2d');
  const gradient = ctx.createRadialGradient(32,32,0,32,32,31);
  gradient.addColorStop(0,'#fff');
  gradient.addColorStop(.15,'#fffc');
  gradient.addColorStop(.38,'#fff5');
  gradient.addColorStop(1,'#fff0');
  ctx.fillStyle = gradient;
  ctx.fillRect(0,0,64,64);
  return new CanvasTexture(image);
}

function mountOrbit(stage, canvas) {
  const root = document.documentElement;
  const track = stage.parentElement;
  const button = stage.querySelector('.imos-wheel-hub');
  let renderer, drawPending = 0, visible = false, contextLost = false;
  let dimensionsDirty = true, finishDirty = true, lastPaint = -Infinity;
  let frame = {position:0,count:4}, width, height, rx, ry, depth;

  function init() {
    const gpu = new WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'low-power'});
    const world = new Scene();
    world.environment = studioTexture();
    const camera = new OrthographicCamera(-1,1,1,-1,1,1400);
    camera.position.z = 700;
    const orbit = new Group();
    world.add(orbit);
    const metal = new MeshPhysicalMaterial({metalness:.66,roughness:.28,clearcoat:.38,envMapIntensity:1.4});
    const edge = new MeshBasicMaterial({transparent:true,opacity:.38,depthWrite:false});
    const outer = new Mesh(new TorusGeometry(1,.019,12,144),metal);
    const inner = new Mesh(new TorusGeometry(.94,.0036,5,144),edge);
    const under = new Mesh(new TorusGeometry(1.02,.007,7,144),edge);
    under.position.z = -.049;
    const glimmer = new Mesh(new TorusGeometry(1.002,.022,8,32,.70),
      new MeshBasicMaterial({transparent:true,opacity:.48,depthWrite:false}));
    orbit.add(outer,inner,under,glimmer);

    // Short paired engravings in the same orbital plane as the rails.
    const marks = [];
    for (let i=0;i<96;i++) {
      const angle = i * TAU / 96;
      const end = i % 8 ? 1.062 : 1.094;
      const x = Math.cos(angle), y = Math.sin(angle);
      marks.push(1.045*x,1.045*y,-.025,end*x,end*y,-.025);
    }
    const engraving = new LineBasicMaterial({transparent:true,opacity:.39});
    const ticks = new BufferGeometry();
    ticks.setAttribute('position',new BufferAttribute(new Float32Array(marks),3));
    orbit.add(new LineSegments(ticks,engraving));

    const glass = new MeshPhysicalMaterial({
      metalness:.32,roughness:.25,clearcoat:1,clearcoatRoughness:.15,
      iridescence:.26,envMapIntensity:1.25,
    });
    const globe = new Mesh(new SphereGeometry(1,36,24),glass);
    const cradle = new Group();
    for (const tilt of [-.88,.62]) {
      const ring = new Mesh(new TorusGeometry(1.082,.016,8,104),metal);
      ring.rotation.set(.53,tilt,.26);
      cradle.add(ring);
    }
    world.add(globe,cradle);

    const flare = flareTexture();
    const glow = new Sprite(new SpriteMaterial({map:flare,transparent:true,opacity:.38,depthWrite:false,blending:AdditiveBlending}));
    glow.position.z = -24;
    const tip = new Sprite(new SpriteMaterial({map:flare,transparent:true,opacity:.87,depthWrite:false}));
    tip.scale.setScalar(24);
    const tether = new BufferGeometry();
    const line = new BufferAttribute(new Float32Array(6),3);
    tether.setAttribute('position',line);
    const signal = new Line(tether,new LineBasicMaterial({transparent:true,opacity:.7,depthWrite:false}));
    signal.frustumCulled = false;
    world.add(glow,tip,signal);

    const field = [];
    for(let i=0;i<48;i++) {
      const angle = i * 2.39996;
      const radius = .3 + .76 * Math.sqrt((i+.5)/48);
      field.push(radius*Math.cos(angle),.86*radius*Math.sin(angle),-.4+.3*Math.cos(i*1.9));
    }
    const particles = new BufferGeometry();
    particles.setAttribute('position',new BufferAttribute(new Float32Array(field),3));
    const mist = new Points(particles,new PointsMaterial({map:flare,size:4,transparent:true,opacity:.45,depthWrite:false,sizeAttenuation:false}));
    world.add(mist);

    const fill = new HemisphereLight('#fff4e9','#57688a',1.65);
    const key = new DirectionalLight('#fff4de',3.2);
    key.position.set(-4,6,8);
    const rim = new DirectionalLight('#a1cfff',2.3);
    rim.position.set(4,-1,2);
    world.add(fill,key,rim);
    return {gpu,world,camera,orbit,metal,edge,engraving,glass,globe,cradle,glow,tip,signal,line,mist,rim,glimmer};
  }

  let art;
  function paint(now) {
    drawPending = 0;
    if(!canPaint()) return;
    if(now-lastPaint<30) {
      schedule();
      return;
    }
    if(!art) {
      try { art = init(); }
      catch { contextLost = true; return; }
      renderer = art.gpu;
    }
    if(dimensionsDirty) {
      const w = stage.clientWidth, h = stage.clientHeight;
      if(!w || !h) return;
      const rail = getComputedStyle(stage,'::before');
      rx = parseFloat(rail.width)/2;
      ry = parseFloat(rail.height)/2;
      if(!rx || !ry) return;
      const tilt = Math.acos(Math.min(ry/rx,1));
      depth = rx * Math.sin(tilt);
      width = w;
      height = h;
      renderer.setPixelRatio(Math.min(devicePixelRatio || 1,1.5));
      renderer.setSize(width,height,false);
      Object.assign(art.camera,{left:-width/2,right:width/2,top:height/2,bottom:-height/2});
      art.camera.updateProjectionMatrix();
      art.orbit.scale.set(rx,ry/Math.max(.3,Math.cos(tilt)),rx);
      art.orbit.rotation.x = -tilt;
      const radius = button.offsetWidth/2;
      art.globe.scale.setScalar(radius);
      art.cradle.scale.setScalar(radius);
      art.glow.scale.setScalar(radius*4.1);
      art.mist.scale.set(rx,ry*1.24,rx);
      dimensionsDirty = false;
    }
    if(finishDirty) {
      const [glint,body,signal] = palettes[document.body.dataset.guideProvider] || palettes.chatgpt;
      const light = root.dataset.theme === 'light';
      art.metal.color.set(glint).lerp(new Color(body),light?.49:.22);
      art.glass.color.set(body).lerp(new Color(glint),light?.76:.13);
      art.glass.emissive.set(glint);
      art.glass.emissiveIntensity = light?.06:.15;
      art.edge.color.set(body).lerp(new Color(glint),light?.21:.69);
      art.engraving.color.copy(art.edge.color);
      art.signal.material.color.set(light?body:signal);
      art.tip.material.color.set(light?glint:signal);
      art.glimmer.material.color.set(light?glint:signal);
      art.glow.material.color.set(glint);
      art.glow.material.opacity = light?.19:.46;
      art.mist.material.color.copy(art.edge.color);
      art.rim.color.set(signal);
      finishDirty = false;
    }
    const phase = TAU * frame.position / frame.count;
    const angle = TAU * (Math.round(frame.position)-frame.position) / frame.count;
    const x = Math.sin(angle), y = Math.cos(angle);
    art.tip.position.set(rx*x,-ry*y,depth*y+4);
    art.line.setXYZ(0,button.offsetWidth*.19*x,-button.offsetWidth*.19*y,10);
    art.line.setXYZ(1,rx*x,-ry*y,depth*y+2);
    art.line.needsUpdate = true;
    art.cradle.rotation.z = .36*Math.sin(phase);
    art.globe.rotation.y = phase;
    art.glimmer.rotation.z = phase+.18;
    renderer.render(art.world,art.camera);
    stage.dataset.orbitRenderer = 'three';
    lastPaint = now;
  }

  function canPaint() {
    return visible && !contextLost && !document.hidden && document.body.dataset.scene === 'chooser' &&
      !root.hasAttribute('data-portal-transition');
  }
  function schedule() {
    if(!drawPending && canPaint()) {
      drawPending = requestAnimationFrame(paint);
    }
  }
  track.addEventListener('imos:orbit-frame',event => {
    frame = event.detail;
    schedule();
  });
  canvas.addEventListener('webglcontextlost',event => {
    event.preventDefault();
    contextLost = true;
    delete stage.dataset.orbitRenderer;
  });
  canvas.addEventListener('webglcontextrestored',() => {
    contextLost = false;
    dimensionsDirty = finishDirty = true;
    schedule();
  });
  new ResizeObserver(() => { dimensionsDirty = true; schedule(); }).observe(stage);
  new IntersectionObserver(([element]) => {
    visible = element.isIntersecting;
    if(visible) schedule();
  }).observe(stage);
  const themeObserver = new MutationObserver(() => { finishDirty = true; schedule(); });
  themeObserver.observe(document.body,{attributes:true,attributeFilter:['data-scene','data-guide-provider']});
  themeObserver.observe(root,{attributes:true,attributeFilter:['data-theme','data-portal-transition']});
  document.addEventListener('visibilitychange',schedule);
}

const canvas = document.querySelector('#imos-wheel .imos-orbit-canvas');
if(canvas) mountOrbit(canvas.parentElement,canvas);
