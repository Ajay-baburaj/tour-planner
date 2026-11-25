import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import './hero-film';

gsap.registerPlugin(ScrollTrigger);
const natural = matchMedia('(prefers-reduced-motion: reduce)');
const fancy = matchMedia('(min-width: 900px) and (pointer: fine)');
const limited = (navigator as Navigator & {connection?: {saveData?: boolean}; deviceMemory?: number});
const limitedDevice = limited.connection?.saveData || (limited.deviceMemory && limited.deviceMemory < 4);

if (!natural.matches) {
  const first = !sessionStorage.getItem('kasavu-intro');
  const prelude = document.querySelector('.prelude');
  if (first && prelude && !limitedDevice && matchMedia('(min-width: 700px)').matches) {
    sessionStorage.setItem('kasavu-intro','1');
    gsap.set(prelude,{display:'grid'});
    gsap.set('.prelude path',{strokeDasharray:1,strokeDashoffset:1});
    gsap.timeline()
      .to('.prelude path',{strokeDashoffset:0,duration:.54,ease:'power2.inOut'})
      .fromTo('.prelude span',{opacity:0,y:8},{opacity:1,y:0,duration:.25},'-=.15')
      .to(prelude,{yPercent:-105,duration:.43,ease:'power3.inOut',onComplete:()=>prelude.remove()},'+=.07');
  }

  document.querySelectorAll<HTMLElement>('.line-mask > span').forEach(line => {
    const italic = line.querySelector('em');
    const title = line.textContent || '';
    line.setAttribute('aria-label',title);
    (italic || line).replaceChildren(...title.split(' ').flatMap((word,index)=>{
      const piece = document.createElement('span');
      piece.className = 'hero-word';
      piece.textContent = word;
      piece.setAttribute('aria-hidden','true');
      return index ? [document.createTextNode(' '),piece] : [piece];
    }));
  });
  gsap.from('.hero-word',{yPercent:70,opacity:0,duration:.85,stagger:.075,ease:'power3.out',delay:first && fancy.matches ? .56 : .1,clearProps:'all'});
  gsap.from('.hero-label,.hero-summary,.hero-actions',{y:14,opacity:0,stagger:.09,duration:.55,ease:'power2.out',delay:first && fancy.matches ? .66 : .15,clearProps:'all'});
  document.querySelectorAll<HTMLElement>('.destination-card, .journal-grid img, .gallery-grid img').forEach(card=>{
    gsap.from(card,{opacity:.65,y:17,clipPath:'inset(0 0 9% 0)',duration:.58,clearProps:'all',scrollTrigger:{trigger:card,start:'top 95%',once:true}});
  });
  document.querySelectorAll<HTMLElement>('[data-count]').forEach(el=>{
    const final = Number(el.dataset.count);
    const counter={value:0};
    gsap.to(counter,{value:final,duration:.75,ease:'power3.out',scrollTrigger:{trigger:el,start:'top 95%',once:true},onUpdate:()=>{el.textContent=String(Math.round(counter.value));}});
  });
  gsap.from('.map-pin',{opacity:0,stagger:.035,duration:.35,scrollTrigger:{trigger:'.kerala-map',start:'top 85%',once:true}});
  const scene = document.querySelector('.hill-scene');
  if (scene) {
    document.querySelectorAll<HTMLElement>('.hill-layer').forEach(layer=>{
      gsap.fromTo(layer,{y:Number(layer.dataset.depth)*10},{y:0,scrollTrigger:{trigger:scene,start:'top bottom',end:'bottom top',scrub:true}});
    });
    gsap.to('.hill-mist',{xPercent:33,opacity:.3,scrollTrigger:{trigger:scene,start:'top bottom',end:'bottom top',scrub:true}});
    gsap.to('.hill-sun',{fill:'#dc8854',scrollTrigger:{trigger:scene,start:'top bottom',end:'bottom top',scrub:true}});
  }
  gsap.matchMedia().add('(min-width: 900px) and (pointer: fine)',()=>{
    const lenis = new Lenis({duration:1.06, smoothWheel:true});
    lenis.on('scroll',ScrollTrigger.update);
    const tick = (time:number)=>lenis.raf(time*1000);
    gsap.ticker.add(tick);
    const viewport = document.querySelector<HTMLElement>('.experience-viewport');
    const rail = document.querySelector<HTMLElement>('.experience-rail');
    if (viewport && rail) {
      const overflow = ()=>Math.max(0, rail.offsetWidth - innerWidth + (viewport.offsetWidth - viewport.clientWidth) + parseFloat(getComputedStyle(viewport).paddingLeft)*2);
      if (overflow()>0) {
        viewport.classList.add('pinned');
        gsap.to(rail,{x:()=>-overflow(),ease:'none',scrollTrigger:{trigger:'.experience-section',start:'center center',end:()=>'+='+overflow(),pin:true,scrub:.35,invalidateOnRefresh:true}});
        rail.addEventListener('focusin',event=>{
          const article=(event.target as HTMLElement).closest('article');
          const trigger=ScrollTrigger.getAll().find(t=>t.trigger===document.querySelector('.experience-section'));
          if (article && trigger && (article.getBoundingClientRect().right>innerWidth || article.getBoundingClientRect().left<0)) {
            const ratio=Math.min(1,Math.max(0,(article.offsetLeft - rail.firstElementChild!.getBoundingClientRect().width*.22)/Math.max(1,overflow())));
            lenis.scrollTo(trigger.start+(trigger.end-trigger.start)*ratio,{immediate:true});
          }
        });
      }
    }
    const boatSection = document.querySelector('.water-journey');
    if (boatSection) ScrollTrigger.create({trigger:boatSection,start:'center center',end:'+=640',pin:true,scrub:true,onUpdate:self=>setBoat(self.progress)});
    const magnets = Array.from(document.querySelectorAll<HTMLElement>('.magnetic'));
    const controller = new AbortController();
    magnets.forEach(el=>{
      el.addEventListener('pointermove',event=>{
        const box=el.getBoundingClientRect();
        gsap.to(el,{x:(event.clientX-box.left-box.width/2)*.11,y:(event.clientY-box.top-box.height/2)*.18,duration:.25,overwrite:true});
      },{signal:controller.signal});
      el.addEventListener('pointerleave',()=>gsap.to(el,{x:0,y:0,duration:.25,overwrite:true}),{signal:controller.signal});
    });
    const follower=document.createElement('div');
    follower.className='cursor-ring';
    follower.setAttribute('aria-hidden','true');
    document.body.append(follower);
    const moveX=gsap.quickTo(follower,'x',{duration:.24,ease:'power2'});
    const moveY=gsap.quickTo(follower,'y',{duration:.24,ease:'power2'});
    window.addEventListener('pointermove',event=>{
      const hover=(event.target as Element)?.closest('a,button');
      moveX(event.clientX);moveY(event.clientY);
      follower.classList.toggle('visible',Boolean(hover));
      follower.classList.toggle('image',Boolean(hover?.querySelector('img')));
    },{passive:true,signal:controller.signal});
    return ()=>{
      gsap.ticker.remove(tick); lenis.destroy();
      viewport?.classList.remove('pinned');
      controller.abort(); follower.remove();
    };
  });
  if (fancy.matches && !limitedDevice) {
    const initWater=()=>{
      const probe=document.createElement('canvas');
      const context=probe.getContext('webgl2') || probe.getContext('webgl');
      if (!context) return;
      context.getExtension('WEBGL_lose_context')?.loseContext();
      void import('./water').then(mod=>mod.attachWater()).catch(()=>{});
    };
    if ('requestIdleCallback' in window) window.requestIdleCallback(initWater,{timeout:2400});
    else setTimeout(initWater,1250);
  }
}

const river=document.querySelector<SVGPathElement>('#river-line');
const boat=document.getElementById('moving-boat');
const stops=Array.from(document.querySelectorAll<HTMLButtonElement>('[data-stop]'));
function setBoat(progress:number) {
  if (!river || !boat) return;
  const point=river.getPointAtLength(river.getTotalLength()*progress);
  boat.setAttribute('transform',`translate(${point.x} ${point.y})`);
  const index=progress<.28?0:progress<.72?1:2;
  stops.forEach((item,i)=>item.setAttribute('aria-pressed',String(i===index)));
}
stops.forEach((item,i)=>item.addEventListener('click',()=>setBoat([0,.53,1][i])));
if (stops.length && !natural.matches) document.querySelector('.water-journey')?.classList.add('journey-animated');

document.querySelectorAll<HTMLElement>('[data-map]').forEach(link=>{
  const highlight=(on:boolean)=>document.querySelectorAll(`[data-map="${link.dataset.map}"]`).forEach(item=>item.classList.toggle('active',on));
  for(const event of ['mouseenter','focus']) link.addEventListener(event,()=>highlight(true));
  for(const event of ['mouseleave','blur']) link.addEventListener(event,()=>highlight(false));
});

const monthButtons=Array.from(document.querySelectorAll<HTMLButtonElement>('[data-month]'));
let rainPreset=0;
monthButtons.forEach(btn=>btn.addEventListener('click',()=>{
  monthButtons.forEach(other=>other.setAttribute('aria-pressed',String(btn===other)));
  document.querySelectorAll<HTMLElement>('[data-climate]').forEach(panel=>{panel.hidden=panel.dataset.climate!==btn.dataset.month;});
  rainPreset=Number(btn.dataset.rainLevel);
}));
const rain=document.querySelector<HTMLCanvasElement>('[data-rain]');
const ctx=rain?.getContext('2d');
if (rain && ctx && !natural.matches && !limitedDevice) {
  let frame=0;
  let width=0,height=0;
  const drops=Array.from({length:115},()=>({x:Math.random(),y:Math.random(),speed:.004+Math.random()*.012}));
  const resize=()=>{
    width=rain.width=rain.clientWidth;
    height=rain.height=rain.clientHeight;
  };
  const draw=()=>{
    ctx.clearRect(0,0,width,height);
    const visible=Math.min(Math.max(0,(innerHeight-rain.getBoundingClientRect().top)/innerHeight),1);
    const count=Math.min(drops.length,Math.round(14+visible*41+rainPreset*12));
    ctx.strokeStyle='rgba(211,231,209,.34)';
    ctx.beginPath();
    for(let i=0;i<count;i++){
      const drop=drops[i];
      drop.y+=drop.speed;
      drop.x-=.0017;
      if(drop.y>1.03){drop.y=-.03;drop.x=Math.random();}
      const x=drop.x*width, y=drop.y*height;
      ctx.moveTo(x,y);ctx.lineTo(x-5,y+7+i%8);
    }
    ctx.stroke();
    frame=requestAnimationFrame(draw);
  };
  new ResizeObserver(resize).observe(rain);
  new IntersectionObserver(entries=>{
    if(entries[0].isIntersecting && !frame){resize();frame=requestAnimationFrame(draw);}
    if(!entries[0].isIntersecting){cancelAnimationFrame(frame);frame=0;}
  }).observe(rain);
}

const quoteTrack=document.querySelector<HTMLElement>('.quote-track');
document.querySelectorAll<HTMLButtonElement>('[data-quote]').forEach(btn=>btn.addEventListener('click',()=>{
  if (!quoteTrack) return;
  const item=quoteTrack.firstElementChild?.getBoundingClientRect().width || 300;
  const next=Number(btn.dataset.quote);
  const edge=next>0 ? quoteTrack.scrollLeft+quoteTrack.clientWidth>=quoteTrack.scrollWidth-4 : quoteTrack.scrollLeft<4;
  quoteTrack.scrollTo({left:edge ? (next>0 ? 0 : quoteTrack.scrollWidth) : quoteTrack.scrollLeft+next*(item+16),behavior:natural.matches?'auto':'smooth'});
}));
