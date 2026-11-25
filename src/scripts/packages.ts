import { currency } from '../site.config';

const filter = document.querySelector<HTMLFormElement>('[data-package-filters]')!;
const list = document.querySelector<HTMLElement>('[data-package-list]')!;
const cards = Array.from(list.querySelectorAll<HTMLElement>('[data-package]'));
const count = document.querySelector<HTMLElement>('[data-results]')!;
const empty = document.querySelector<HTMLElement>('[data-no-results]')!;
const savedOnly = document.querySelector<HTMLInputElement>('[data-saved-only]')!;
const openCompare = document.querySelector<HTMLButtonElement>('[data-open-compare]')!;
const compareCount = document.querySelector<HTMLElement>('[data-compare-count]')!;
const modal = document.querySelector<HTMLDialogElement>('[data-package-dialog]')!;
const modalTitle = modal.querySelector<HTMLElement>('h2')!;
const modalBody = modal.querySelector<HTMLElement>('[data-dialog-body]')!;
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const compare = new Set<string>();
const saveKey='kasavu-wishlist';
const known = new Set(cards.map(card=>card.dataset.package!));
const saved = new Set<string>();
try {
  const values:unknown=JSON.parse(localStorage.getItem(saveKey) || '[]');
  if (Array.isArray(values)) values.forEach(value=>{ if(typeof value==='string' && known.has(value)) saved.add(value); });
} catch { /* The catalogue remains usable without storage. */ }

type Field = HTMLInputElement | HTMLSelectElement;
const fields = Array.from(filter.elements).filter((input): input is Field =>
  (input instanceof HTMLInputElement || input instanceof HTMLSelectElement) && Boolean(input.name));
const get = (name: string) => (filter.elements.namedItem(name) as Field).value;
const matches = (term: string, value:string|undefined) => !term || term===value;

function setFilters() {
  filter.reset();
  const current = new URLSearchParams(location.search);
  for (const field of fields) {
    const value = current.get(field.name);
    if (value===null) continue;
    if(field instanceof HTMLSelectElement && !Array.from(field.options).some(option=>option.value===value)) continue;
    field.value=value;
  }
  savedOnly.checked=current.get('saved')==='1';
}

function apply(animate:boolean, write:boolean, changed?:string) {
  const previous=animate ? new Map(cards.filter(card=>!card.hidden).map(card=>[card,card.getBoundingClientRect()])) : new Map<HTMLElement,DOMRect>();
  let min=Number(get('min'));
  let max=Number(get('max'));
  if(min>max){
    if(changed==='max') (filter.elements.namedItem('min') as Field).value=String(min=max);
    else (filter.elements.namedItem('max') as Field).value=String(max=min);
  }
  const [from,to]=get('duration').split('-').map(Number);
  const sort=get('sort');
  const criteria=get('travellers');
  let visible=0;
  for(const card of cards) {
    const d=card.dataset;
    const price=Number(d.price), days=Number(d.days);
    const show=matches(get('theme'),d.theme) && matches(get('region'),d.region) &&
      (!get('destination') || d.destinations!.split('|').includes(get('destination'))) &&
      (!get('month') || d.months!.split('|').includes(get('month'))) &&
      (!from || (days>=from && days<=to)) && price>=min && price<=max &&
      (!criteria || Number(d.maxGuests)>=parseInt(criteria,10)) &&
      (!savedOnly.checked || saved.has(d.package!));
    card.hidden=!show;
    visible+=Number(show);
    if(criteria) card.dataset.travellers=criteria;
    else delete card.dataset.travellers;
  }
  const order=(card:HTMLElement)=> sort==='price-up' ? Number(card.dataset.price) : sort==='price-down' ? -Number(card.dataset.price) : sort==='length' ? Number(card.dataset.days) : -Number(card.dataset.popularity);
  cards.slice().sort((a,b)=>order(a)-order(b)).forEach(card=>list.append(card));
  document.querySelector<HTMLOutputElement>('[data-min-price]')!.value=currency(min);
  document.querySelector<HTMLOutputElement>('[data-max-price]')!.value=currency(max);
  count.textContent=`${visible} ${visible===1?'itinerary':'itineraries'}${criteria ? ' · Group size carried to itinerary' : ''}`;
  empty.hidden=visible!==0;
  if(write){
    const url=new URL(location.href);
    for(const field of fields) {
      const baseline=field instanceof HTMLInputElement ? field.defaultValue : '';
      if(field.value===baseline) url.searchParams.delete(field.name);
      else url.searchParams.set(field.name,field.value);
    }
    if(savedOnly.checked) url.searchParams.set('saved','1'); else url.searchParams.delete('saved');
    if(url.href!==location.href) history.replaceState(null,'',url);
  }
  if(!animate || reduce.matches) return;
  for(const card of cards) {
    if(card.hidden) continue;
    card.getAnimations().forEach(animation=>animation.cancel());
    const before=previous.get(card), after=card.getBoundingClientRect();
    if(!before) card.animate([{opacity:0,transform:'translateY(12px)'},{opacity:1,transform:'none'}],{duration:220,easing:'ease-out'});
    else if(Math.abs(before.left-after.left)+Math.abs(before.top-after.top)>2)
      card.animate([{transform:`translate(${before.left-after.left}px,${before.top-after.top}px)`},{transform:'none'}],{duration:290,easing:'cubic-bezier(.2,.8,.2,1)'});
  }
}

function compareControls() {
  compareCount.textContent=String(compare.size);
  openCompare.disabled=compare.size<2;
  document.querySelectorAll<HTMLInputElement>('[data-compare]').forEach(input=>{
    const slug=input.dataset.compare!;
    input.checked=compare.has(slug);
    input.disabled=compare.size===3 && !input.checked;
  });
}
function addCell(row:HTMLTableRowElement, value:string, heading=false){
  const cell=document.createElement(heading?'th':'td');
  cell.textContent=value;
  if(heading) cell.scope='col';
  row.append(cell);
  return cell;
}
openCompare.addEventListener('click',()=>{
  modalTitle.textContent='Compare itineraries';
  const wrap=document.createElement('div'); wrap.className='compare-scroll';
  const table=document.createElement('table'); table.className='compare-table';
  const header=table.createTHead().insertRow();
  ['Itinerary','Theme','Length','From / person','Route'].forEach(title=>addCell(header,title,true));
  const body=table.createTBody();
  for(const slug of compare) {
    const card=cards.find(item=>item.dataset.package===slug)!;
    const row=body.insertRow();
    const link=card.querySelector<HTMLAnchorElement>('h3 a')!.cloneNode(true);
    const cell=addCell(row,'');cell.append(link);
    addCell(row,card.dataset.theme!);
    addCell(row,`${card.dataset.days} days`);
    addCell(row,currency(Number(card.dataset.price)));
    addCell(row,card.querySelector('.package-places')?.textContent?.trim() || '');
  }
  wrap.append(table);modalBody.replaceChildren(wrap);modal.showModal();
});
function setSavedState(){
  document.querySelectorAll<HTMLButtonElement>('[data-save]').forEach(btn=>btn.setAttribute('aria-pressed',String(saved.has(btn.dataset.save!))));
}
document.querySelectorAll<HTMLButtonElement>('[data-save]').forEach(btn=>btn.addEventListener('click',()=>{
  const slug=btn.dataset.save!;
  if(saved.has(slug)) saved.delete(slug); else saved.add(slug);
  try {localStorage.setItem(saveKey,JSON.stringify([...saved]));}catch{/* Retain current state for this page. */}
  setSavedState(); if(savedOnly.checked) apply(true,false);
}));
document.querySelectorAll<HTMLInputElement>('[data-compare]').forEach(input=>input.addEventListener('change',()=>{
  const slug=input.dataset.compare!;
  if(input.checked && compare.size<3) compare.add(slug);
  if(!input.checked) compare.delete(slug);
  compareControls();
}));
document.querySelectorAll<HTMLButtonElement>('[data-quick]').forEach(btn=>btn.addEventListener('click',()=>{
  const slug=btn.dataset.quick;
  const template=document.querySelector<HTMLTemplateElement>(`[data-quick-info="${slug}"]`);
  modalTitle.textContent=btn.closest('article')?.querySelector('h3')?.textContent||'Trip details';
  if(template) modalBody.replaceChildren(template.content.cloneNode(true));
  modal.showModal();
}));
modal.querySelector('[data-dialog-dismiss]')?.addEventListener('click',()=>modal.close());
modal.addEventListener('click',e=>{if(e.target===modal) modal.close();});
document.addEventListener('click', event=>{
  if(!(event.target instanceof Element) || !get('travellers')) return;
  const link=event.target.closest<HTMLAnchorElement>('a[href^="/packages/"]');
  if(!link || link.pathname==='/packages/') return;
  const url=new URL(link.href); url.searchParams.set('travellers', get('travellers')); link.href=url.href;
},{capture:true});
filter.addEventListener('submit',event=>event.preventDefault());
filter.addEventListener('input',event=>apply(true,true,(event.target as Field).name));
savedOnly.addEventListener('change',()=>apply(true,true));
document.querySelector('[data-clear-filters]')?.addEventListener('click',()=>{filter.reset();savedOnly.checked=false;apply(true,true);});
addEventListener('popstate',()=>{setFilters();apply(false,false);});
setSavedState();setFilters();apply(false,true);
