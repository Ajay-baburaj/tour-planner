import {getCollection} from 'astro:content';
import {places,trips} from '../data/catalogue';
import campaigns from '../data/campaigns.json';
import type {APIRoute} from 'astro';
export const GET:APIRoute=async({site})=>{
  const journal=await getCollection('blog');
  const routes=['/','/packages/','/destinations/','/kerala/','/taxi/','/houseboats/','/blog/','/about/','/services/','/testimonials/','/contact/','/credits/',
    ...places.map(place=>`/destinations/${place.slug}/`),
    ...trips.map(trip=>`/packages/${trip.slug}/`),
    ...journal.map(post=>`/blog/${post.id}/`),
    ...campaigns.map(campaign=>`/lp/${campaign.slug}/`)];
  const urls=routes.map(path=>`<url><loc>${new URL(path,site).href}</loc></url>`).join('');
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`,{headers:{'Content-Type':'application/xml; charset=utf-8'}});
};
