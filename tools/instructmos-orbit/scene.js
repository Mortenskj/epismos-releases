import {
  BufferAttribute, BufferGeometry, Color, OrthographicCamera,
  Points, Scene, ShaderMaterial, WebGLRenderer,
} from 'three';

const TAU = 2 * Math.PI;
const tints = {
  chatgpt: ['#78ebd8','#387264'],
  claude: ['#ffbf99','#89505d'],
  gemini: ['#c8d5ff','#5f65a3'],
};

function sample(x,y,seed) {
  let n=Math.imul(x+seed,374761393)+Math.imul(y,668265263);
  n=Math.imul(n^(n>>>13),1274126177);
  return ((n^(n>>>16))>>>0)/4294967295;
}

function starLayer(count,seed,strength) {
  const positions=[], brightness=[];
  for(let i=0;i<count;i++) {
    const angle=sample(i,1,seed)*TAU;
    const radius=.24+.76*Math.sqrt(sample(i,7,seed));
    positions.push(Math.cos(angle)*radius,Math.sin(angle)*radius,sample(i,13,seed)-.5);
    brightness.push(sample(i,17,seed)*Math.min(1,(1-radius)*4));
  }
  const geometry=new BufferGeometry();
  geometry.setAttribute('position',new BufferAttribute(new Float32Array(positions),3));
  geometry.setAttribute('brightness',new BufferAttribute(new Float32Array(brightness),1));
  const material=new ShaderMaterial({
    uniforms:{tint:{value:new Color('#fff')},density:{value:1},strength:{value:strength}},
    vertexShader:`
      attribute float brightness;
      uniform float density;
      varying float power;
      void main() {
        power=brightness;
        gl_PointSize=(1.1+pow(brightness,5.)*6.)*density;
        gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);
      }
    `,
    fragmentShader:`
      varying float power;
      uniform vec3 tint;
      uniform float strength;
      void main() {
        vec2 p=abs(gl_PointCoord-.5);
        float core=exp(-68.*dot(p,p));
        float ray=(exp(-80.*p.x)*exp(-10.*p.y)+exp(-80.*p.y)*exp(-10.*p.x))*.20;
        gl_FragColor=vec4(tint,(core+ray*pow(power,7.))*power*strength);
      }
    `,
    transparent:true,depthWrite:false
  });
  const stars=new Points(geometry,material);
  stars.userData.strength=strength;
  return stars;
}

function mountStars(stage,canvas) {
  const root=document.documentElement;
  const track=stage.closest('.imos-wheel-track');
  let frame={position:0,count:4};
  let art,pending=0,lastPaint=-Infinity,contextLost=false;
  let dimensionsDirty=true,paletteDirty=true;

  function canPaint() {
    return !contextLost&&!document.hidden&&document.body.dataset.scene==='chooser'&&
      !root.hasAttribute('data-portal-transition');
  }
  function schedule() {
    if(!pending&&canPaint()) pending=requestAnimationFrame(paint);
  }
  function paint(now) {
    pending=0;
    if(!canPaint()) return;
    if(now-lastPaint<32) {
      schedule();
      return;
    }
    if(!art) {
      try {
        const renderer=new WebGLRenderer({canvas,alpha:true,antialias:false,powerPreference:'low-power'});
        const world=new Scene();
        const camera=new OrthographicCamera(-1,1,1,-1,1,30);
        camera.position.z=12;
        const far=starLayer(122,19,.32);
        const near=starLayer(37,47,.43);
        near.position.z=2;
        world.add(far,near);
        art={renderer,world,camera,far,near};
      } catch {
        contextLost=true;
        return;
      }
    }
    if(dimensionsDirty) {
      const width=stage.clientWidth,height=stage.clientHeight;
      if(!width||!height) return;
      const dpr=Math.min(devicePixelRatio||1,1.5);
      art.renderer.setPixelRatio(dpr);
      art.renderer.setSize(width,height,false);
      Object.assign(art.camera,{left:-width/2,right:width/2,top:height/2,bottom:-height/2});
      art.camera.updateProjectionMatrix();
      art.far.scale.set(width*.47,height*.46,1);
      art.near.scale.set(width*.46,height*.44,1);
      art.far.material.uniforms.density.value=dpr*.78;
      art.near.material.uniforms.density.value=dpr;
      dimensionsDirty=false;
    }
    if(paletteDirty) {
      const light=root.dataset.theme==='light';
      const tint=tints[document.body.dataset.guideProvider]||tints.chatgpt;
      for(const stars of [art.far,art.near]) {
        stars.material.uniforms.tint.value.set(tint[light?1:0]).lerp(new Color(light?'#555888':'#ffffff'),.37);
        stars.material.uniforms.strength.value=stars.userData.strength*(light?.83:1);
      }
      paletteDirty=false;
    }
    const phase=TAU*frame.position/frame.count;
    art.far.position.set(2*Math.sin(phase),Math.cos(phase),0);
    art.near.position.set(8*Math.sin(phase+.35),4*Math.cos(phase),2);
    art.renderer.render(art.world,art.camera);
    if(!stage.dataset.orbitRenderer) stage.dataset.orbitRenderer='three';
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
  const themeChanged=()=>{paletteDirty=true;schedule();};
  new MutationObserver(themeChanged).observe(document.body,{
    attributes:true,attributeFilter:['data-scene','data-guide-provider'],
  });
  new MutationObserver(themeChanged).observe(root,{attributes:true,attributeFilter:['data-theme','data-portal-transition']});
  document.addEventListener('visibilitychange',schedule);
  schedule();
}

const canvas=document.querySelector('#imos-wheel .imos-orbit-canvas');
if(canvas) mountStars(canvas.parentElement,canvas);
