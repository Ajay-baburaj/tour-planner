import {currency} from '../site.config';
const buttons=Array.from(document.querySelectorAll<HTMLButtonElement>('[data-tier]'));
const select=document.querySelector<HTMLSelectElement>('#enquiry [data-choice]');
const price=document.querySelector<HTMLOutputElement>('[data-tier-price]');
function setTier(name:string){
  for(const button of buttons){
    const chosen=button.dataset.tier===name;
    button.setAttribute('aria-pressed',String(chosen));
    if(chosen && price) price.value=currency(Number(button.dataset.price));
  }
  if(select && select.value!==name){select.value=name;select.dispatchEvent(new Event('input',{bubbles:true}));}
}
for(const button of buttons) button.addEventListener('click',()=>setTier(button.dataset.tier!));
select?.addEventListener('change',()=>setTier(select.value));
const guests=new URLSearchParams(location.search).get('travellers');
const adults=document.querySelector<HTMLInputElement>('#enquiry [name=Adults]');
if(adults && guests && ['1','2','3-5','6+'].includes(guests)) adults.value=String(parseInt(guests,10));
const modal=document.querySelector<HTMLDialogElement>('[data-lightbox]');
const openers=Array.from(document.querySelectorAll<HTMLButtonElement>('[data-lightbox-src]'));
if(modal && openers.length){
  const image=modal.querySelector('img')!;
  const caption=modal.querySelector('figcaption')!;
  let current=0;
  const show=(index:number)=>{
    current=(index+openers.length)%openers.length;
    const opener=openers[current];
    image.src=opener.dataset.lightboxSrc!;
    image.alt=opener.dataset.lightboxAlt!;
    caption.textContent=image.alt;
  };
  openers.forEach((button,index)=>button.addEventListener('click',()=>{show(index);modal.showModal();}));
  modal.querySelector('[data-lightbox-close]')?.addEventListener('click',()=>modal.close());
  modal.addEventListener('click',event=>{if(event.target===modal) modal.close();});
  modal.querySelectorAll<HTMLButtonElement>('[data-lightbox-step]').forEach(button=>{
    button.hidden=openers.length<2;
    button.addEventListener('click',()=>show(current+Number(button.dataset.lightboxStep)));
  });
  modal.addEventListener('keydown',event=>{
    if(event.key==='ArrowLeft') show(current-1);
    if(event.key==='ArrowRight') show(current+1);
  });
}
