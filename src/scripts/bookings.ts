import {currency} from '../site.config';
const reduce=matchMedia('(prefers-reduced-motion: reduce)');
const taxiForm=document.querySelector<HTMLFormElement>('#taxi-booking form');
const boatForm=document.querySelector<HTMLFormElement>('#boat-booking form');

function choose(form:HTMLFormElement|null, field:string, value:string) {
  const select=form?.elements.namedItem(field);
  if(!(select instanceof HTMLSelectElement)) return;
  select.value=value;
  select.dispatchEvent(new Event('change',{bubbles:true}));
}
function bringIntoView(form:HTMLFormElement|null){
  form?.closest('section')?.scrollIntoView({behavior:reduce.matches?'auto':'smooth',block:'start'});
  form?.querySelector<HTMLInputElement>('[name=Name]')?.focus({preventScroll:true});
}
const vehicleSelect=document.querySelector<HTMLSelectElement>('[data-estimate-vehicle]');
const distance=document.querySelector<HTMLInputElement>('[data-distance]');
const fare=document.querySelector<HTMLOutputElement>('[data-fare]');
const fareNote=document.querySelector<HTMLElement>('[data-fare-note]');
function calculate(){
  if(!vehicleSelect || !distance || !fare || !fareNote) return;
  const {rate,bata,minimum}=vehicleSelect.selectedOptions[0]?.dataset || {};
  const km=distance.valueAsNumber;
  if(!Number.isFinite(km) || !distance.validity.valid){
    fare.value='—';fareNote.textContent='Enter a distance between 1 and 9,999 km.';
    return;
  }
  const estimated=(km*Number(rate))+Number(bata);
  fare.value=currency(estimated);
  fareNote.textContent=`${km} km × ${currency(Number(rate))} + ${currency(Number(bata))} driver bata. Vehicle rate is based on a minimum of ${minimum} km per day.`;
}
distance?.addEventListener('input',calculate);
vehicleSelect?.addEventListener('change',calculate);
calculate();

const serviceButtons=Array.from(document.querySelectorAll<HTMLButtonElement>('[data-service]'));
for(const button of serviceButtons) button.addEventListener('click',()=>{
  for(const other of serviceButtons) other.setAttribute('aria-pressed',String(other===button));
  document.querySelectorAll<HTMLElement>('[data-service-note]').forEach(note=>{note.hidden=note.dataset.serviceNote!==button.dataset.service;});
  choose(taxiForm,'Trip type',button.dataset.service!);
});
const filterButtons=Array.from(document.querySelectorAll<HTMLButtonElement>('[data-fleet]'));
const fleet=Array.from(document.querySelectorAll<HTMLElement>('[data-vehicle-category]'));
const fleetTotal=document.querySelector<HTMLElement>('[data-fleet-total]');
for(const button of filterButtons) button.addEventListener('click',()=>{
  const category=button.dataset.fleet;
  let shown=0;
  filterButtons.forEach(other=>other.setAttribute('aria-pressed',String(other===button)));
  for(const vehicle of fleet){
    vehicle.hidden=Boolean(category && vehicle.dataset.vehicleCategory!==category);
    if(vehicle.hidden) continue;
    shown++;
    if(!reduce.matches) vehicle.animate([{transform:'translateX(-15px)',opacity:.2},{transform:'none',opacity:1}],{duration:225+shown*23,easing:'ease-out'});
  }
  if(fleetTotal) fleetTotal.textContent=`${shown} ${shown===1?'vehicle':'vehicles'} · Representative vehicle photographs`;
});
document.querySelectorAll<HTMLButtonElement>('[data-book-vehicle]').forEach(button=>button.addEventListener('click',()=>{
  const name=button.dataset.bookVehicle!;
  choose(taxiForm,'Vehicle',name);
  if(vehicleSelect){vehicleSelect.value=name;calculate();}
  bringIntoView(taxiForm);
}));

const boatFilters=Array.from(document.querySelectorAll<HTMLSelectElement>('[data-boat-filter]'));
const boatCards=Array.from(document.querySelectorAll<HTMLElement>('[data-boat-type]'));
const boatTotal=document.querySelector<HTMLElement>('[data-boat-total]');
const noBoats=document.querySelector<HTMLElement>('[data-no-boats]');
boatFilters.forEach(filter=>filter.addEventListener('change',()=>{
  let shown=0;
  for(const boat of boatCards){
    const options:Record<string,string[]>={type:[boat.dataset.boatType!],base:[boat.dataset.boatBase!],cruises:boat.dataset.boatCruises!.split('|')};
    boat.hidden=!boatFilters.every(control=>!control.value || options[control.dataset.boatFilter!].includes(control.value));
    if(!boat.hidden) shown++;
  }
  if(boatTotal) boatTotal.textContent=`${shown} ${shown===1?'houseboat':'houseboats'} · Representative backwater photographs`;
  if(noBoats) noBoats.hidden=shown!==0;
}));
const boatOptions=document.getElementById('boat-options');
if(boatForm && boatOptions){
  const configs=JSON.parse(boatOptions.textContent || '[]') as {name:string;cruises:string[];guests:number}[];
  const boat=boatForm.elements.namedItem('Houseboat') as HTMLSelectElement;
  const cruise=boatForm.elements.namedItem('Cruise') as HTMLSelectElement;
  const guests=boatForm.elements.namedItem('Guests') as HTMLInputElement;
  function syncBoat(){
    const options=configs.find(entry=>entry.name===boat.value);
    if(!options) return;
    const selected=cruise.value;
    Array.from(cruise.options).forEach(option=>{option.disabled=!options.cruises.includes(option.value);});
    if(!options.cruises.includes(selected)) cruise.value=options.cruises[0];
    guests.max=String(options.guests);
  }
  boat.addEventListener('change',syncBoat);syncBoat();
}
document.querySelectorAll<HTMLButtonElement>('[data-book-boat]').forEach(button=>button.addEventListener('click',()=>{
  choose(boatForm,'Houseboat',button.dataset.bookBoat!);
  const desired=boatFilters.find(control=>control.dataset.boatFilter==='cruises')?.value;
  if(desired) choose(boatForm,'Cruise',desired);
  bringIntoView(boatForm);
}));
