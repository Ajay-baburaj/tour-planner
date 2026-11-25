const hero=document.querySelector<HTMLElement>('.hero');
const film=document.querySelector<HTMLVideoElement>('#hero-film');
const controls=document.querySelector<HTMLElement>('[data-hero-controls]');
const toggle=document.querySelector<HTMLButtonElement>('[data-film-toggle]');
const caption=document.querySelector<HTMLElement>('[data-film-caption]');
const coordinates=document.querySelector<HTMLElement>('[data-film-coords]');
const scenes=Array.from(document.querySelectorAll<HTMLButtonElement>('[data-hero-scene]'));
const preference=matchMedia('(prefers-reduced-motion: reduce)');
const mobile=matchMedia('(max-width: 700px)');
const saveData=(navigator as Navigator & {connection?:{saveData?:boolean}}).connection?.saveData;

if(hero && film && controls && toggle && scenes.length){
  let manuallyPaused=false;
  let inView=true;
  let chosen=scenes[0];
  const updateButton=()=>{
    const paused=film.paused || manuallyPaused;
    toggle.classList.toggle('is-paused',paused);
    toggle.setAttribute('aria-label',paused?'Play background film':'Pause background film');
  };
  async function play(){
    if(!inView || manuallyPaused || document.hidden) return;
    if(!film.getAttribute('src') || 'filmError' in hero.dataset) load(chosen);
    try {await film.play();}
    catch {updateButton();}
  }
  function load(choice:HTMLButtonElement){
    const scene=choice.dataset.heroScene;
    if(!scene) return;
    chosen=choice;
    hero.dataset.filmScene=scene;
    hero.classList.remove('film-visible');
    hero.removeAttribute('data-film-error');
    film.poster=`/films/${scene}-poster.webp`;
    film.src=`/films/${scene}${mobile.matches ? '-small' : ''}.mp4`;
    film.muted=true;
    scenes.forEach(button=>button.setAttribute('aria-pressed',String(button===choice)));
    if(caption) caption.textContent=choice.dataset.caption || '';
    if(coordinates) coordinates.textContent=choice.dataset.coords || '';
  }
  film.addEventListener('playing',()=>{hero.classList.add('film-visible');updateButton();});
  film.addEventListener('pause',updateButton);
  film.addEventListener('error',()=>{hero.classList.remove('film-visible');hero.dataset.filmError='';updateButton();});
  for(const scene of scenes) scene.addEventListener('click',()=>{
    manuallyPaused=false;
    if(scene!==chosen || !film.getAttribute('src')) load(scene);
    void play();
  });
  toggle.addEventListener('click',()=>{
    if(film.paused){manuallyPaused=false;void play();}
    else{manuallyPaused=true;film.pause();}
    updateButton();
  });
  preference.addEventListener('change',event=>{
    if(event.matches){manuallyPaused=true;film.pause();hero.classList.remove('film-visible');}
    else{manuallyPaused=Boolean(saveData);void play();}
    updateButton();
  });
  new IntersectionObserver(([entry])=>{
    inView=entry.isIntersecting;
    if(inView) void play(); else if(!film.paused) film.pause();
  },{threshold:.14}).observe(hero);
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden) film.pause(); else void play();
  });
  controls.hidden=false;
  hero.classList.add('film-controls-ready');
  manuallyPaused=preference.matches || Boolean(saveData);
  updateButton();
  if(!manuallyPaused){
    if(document.readyState==='complete') void play();
    else addEventListener('load',()=>void play(),{once:true});
  }
}
