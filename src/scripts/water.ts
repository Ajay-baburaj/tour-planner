import {Renderer, Camera, Mesh, Program, Triangle, Transform, Texture} from 'ogl';

export function attachWater(){
  const container=document.querySelector<HTMLElement>('[data-water-hero]');
  const canvas=container?.querySelector('canvas');
  const image=container?.querySelector('img');
  const video=container?.querySelector('video');
  if(!container || !canvas || !image) return;
  const launch=()=>{
    const renderer=new Renderer({canvas,dpr:Math.min(devicePixelRatio,1.15),antialias:false,alpha:false});
    const gl=renderer.gl;
    const scene=new Transform();
    const camera=new Camera(gl);
    const photo=new Texture(gl,{image,generateMipmaps:false,flipY:true});
    const uniforms={
      photograph:{value:photo}, time:{value:0}, ratio:{value:1}, photoRatio:{value:image.naturalWidth/image.naturalHeight}, pointer:{value:[.7,.32]}, ripple:{value:0},
    };
    const program=new Program(gl,{uniforms,depthTest:false,depthWrite:false,vertex:`
      attribute vec2 uv;
      attribute vec2 position;
      varying vec2 surface;
      void main(){surface=uv;gl_Position=vec4(position,0.,1.);}
    `,fragment:`
      precision mediump float;
      uniform sampler2D photograph;
      uniform float time,ratio,photoRatio,ripple;
      uniform vec2 pointer;
      varying vec2 surface;
      void main(){
        vec2 uv=surface;
        vec2 cover=ratio>photoRatio?vec2(1.,photoRatio/ratio):vec2(ratio/photoRatio,1.);
        vec2 original=(uv-vec2(.5,.42))*cover+vec2(.5,.42);
        float depth=1.-smoothstep(.32,.48,original.y);
        float distanceToCursor=length((uv-pointer)*vec2(ratio,1.));
        float movingRing=sin(distanceToCursor*87.-time*7.)*exp(-distanceToCursor*10.)*ripple;
        float wave=(sin(uv.y*155.+time*1.3)+sin(uv.y*94.-time*.92))*.00155;
        vec2 warped=original+vec2(depth*(wave+movingRing*.018),depth*movingRing*.004);
        vec3 color=texture2D(photograph,warped).rgb;
        float haze=sin(uv.x*5.+time*.18)*sin(uv.y*38.+uv.x*5.-time*.12);
        float mist=exp(-abs(uv.y-.55)*15.)*max(0.,haze)*.075;
        float mote=pow(max(0.,sin(uv.x*179.+time*.28)*sin(uv.y*189.-time*.34)),32.)*.06;
        gl_FragColor=vec4(mix(color,vec3(.87,.89,.77),mist+mote),1.);
      }
    `});
    new Mesh(gl,{geometry:new Triangle(gl),program}).setParent(scene);
    let source: HTMLImageElement | HTMLVideoElement=image;
    const showVideo=()=> Boolean(video && !video.paused && video.readyState>=2 && container.closest('.hero')?.getAttribute('data-film-scene')==='backwaters');
    let frame=0;
    let energy=0;
    let last=0;
    const draw=(time:number)=>{
      const filmVisible=container.closest('.hero')?.classList.contains('film-visible');
      if(filmVisible && (!showVideo() || energy<.018)){
        canvas.classList.remove('active');
        frame=requestAnimationFrame(draw);
        return;
      }
      if (time-last>15){
        const next=showVideo() ? video! : image;
        if(next!==source){
          source=next;photo.image=source;
          uniforms.photoRatio.value=source instanceof HTMLVideoElement ? source.videoWidth/source.videoHeight : source.naturalWidth/source.naturalHeight;
        }
        if(source instanceof HTMLVideoElement) photo.needsUpdate=true;
        canvas.classList.add('active');
        uniforms.time.value=time*.001;
        energy*=.978;
        uniforms.ripple.value=energy;
        renderer.render({scene,camera});
        last=time;
      }
      frame=requestAnimationFrame(draw);
    };
    const resize=()=>{
      const {width,height}=container.getBoundingClientRect();
      if(width && height){renderer.setSize(width,height);uniforms.ratio.value=width/height;}
    };
    new ResizeObserver(resize).observe(container);
    new IntersectionObserver(([entry])=>{
      if(entry.isIntersecting && !frame){resize();frame=requestAnimationFrame(draw);canvas.classList.add('active');}
      if(!entry.isIntersecting){cancelAnimationFrame(frame);frame=0;}
    }).observe(container);
    container.closest('.hero')?.addEventListener('pointermove',event=>{
      const point=event as PointerEvent;
      const box=container.getBoundingClientRect();
      uniforms.pointer.value=[(point.clientX-box.left)/box.width,1-(point.clientY-box.top)/box.height];
      energy=.8;
    },{passive:true});
    canvas.addEventListener('webglcontextlost',()=>{cancelAnimationFrame(frame);canvas.classList.remove('active');},{once:true});
  };
  if(image.complete && image.naturalWidth) launch();
  else image.addEventListener('load',()=>{try{launch();}catch{/* The photo remains visible. */}},{once:true});
}
