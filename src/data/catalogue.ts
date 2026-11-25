import destinations from './destinations.json';
import packages from './packages.json';

export const places = destinations;
export const trips = packages;
export type Trip = typeof packages[number];

export const tiers = [
  {name:'Standard', multiplier:1, notes:'Clean, comfortable hotels and homestays, with breakfast on hotel mornings.'},
  {name:'Deluxe', multiplier:1.22, notes:'Upgraded room categories in boutique hotels or bigger estate properties when available.'},
  {name:'Luxury', multiplier:1.56, notes:'Premium boutique stays or full-service resorts, subject to availability on the route.'},
];

export const priceFor = (price: number, tier: number) => Math.round(price * tiers[tier].multiplier / 100) * 100;
export const packageFaqs = [
  {title:'What does the starting price cover?', text:'Sample rates are per person on a twin-sharing basis using the Standard hotel tier. Travel date, group size, room type and availability affect the written quote.'},
  {title:'Can we change the route or the hotels?', text:'Yes. Add your preferred stops, dates and requests to the enquiry so they can be priced together.'},
  {title:'Are attractions, flights and meals included?', text:'See the inclusions for the sample plan. International and domestic flights, attraction tickets and meals outside the stated plan are priced separately.'},
  {title:'How does cancellation work?', text:'The written quote specifies deposit, supplier deadlines and cancellation charges before booking. Hotel, boat and ticket suppliers can have different terms.'},
];
export const destinationOptions = [...places.map(({slug,name})=>[slug,name] as const),...['Kozhikode','Goa','Hyderabad','North India','Andaman','Malaysia','Dubai','Thailand','Singapore'].map(p=>[p,p] as const)];
export const themes = [...new Set(trips.map(trip=>trip.theme))].sort();
export const months = Array.from({length:12}, (_, index) => new Intl.DateTimeFormat('en-IN',{month:'long',timeZone:'UTC'}).format(new Date(Date.UTC(2026,index,10))));
export const openMap = (location:string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;

export function routeMap(trip: Trip) {
  const route = trip.places.map(place => trip.region === 'Kerala' ? `${place}, Kerala, India` : place);
  if (route.length === 1) return openMap(route[0]);
  const params = new URLSearchParams({api:'1',origin:route[0],destination:route[route.length-1],travelmode:'driving'});
  if (route.length>2) params.set('waypoints',route.slice(1,-1).join('|'));
  return `https://www.google.com/maps/dir/?${params}`;
}

export function breadcrumbSchema(site: URL | undefined, crumbs:{name:string;path:string}[]) {
  return {"@context":"https://schema.org","@type":"BreadcrumbList",itemListElement:[{name:'Home',path:'/'},...crumbs].map((item,index)=>({"@type":"ListItem",position:index+1,name:item.name,item:new URL(item.path,site).href}))};
}
