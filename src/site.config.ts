export const site = {
  name: 'Kasavu Journeys',
  location: 'Kochi, Kerala',
  phone: '',
  whatsapp: '',
  email: '',
  address: '',
  hours: '',
  mapQuery: 'Cochin International Airport, Kerala',
  trust: { years: 0, travellers: 0, googleRating: '', googleUrl: '', approvals: [] as { label: string; url: string }[] },
  staff: [] as { name: string; role: string; bio: string }[],
  socials: [] as { label: string; url: string }[],
  formspree: import.meta.env.PUBLIC_FORMSPREE_ENDPOINT || '',
  newsletter: import.meta.env.PUBLIC_NEWSLETTER_ENDPOINT || '',
};

export const whatsapp = (message: string) =>
  site.whatsapp ? `https://wa.me/${site.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(message)}` : '';

export const currency = (value: number) => `₹${new Intl.NumberFormat('en-IN').format(value)}`;
