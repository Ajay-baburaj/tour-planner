# Kasavu Journeys

Static Astro site for a Kochi-based travel operator. All page generation happens at build time. Interaction code runs in the browser using TypeScript, GSAP, Lenis and a single optional OGL water scene. The homepage films are included in the project and play from the same origin.

## Run locally

Node.js 22 or later and npm are required.

```sh
npm ci
npm run start
npm run build
npm run preview
```

The static build is in `dist/`.

## Project structure

| Path | What to edit |
| --- | --- |
| `src/site.config.ts` | Brand, business phone, WhatsApp, email, address, map query, hours, socials, team, verified business figures and approvals |
| `src/data/packages.json` | Kerala, domestic and international tour packages |
| `src/data/destinations.json` | Destination pages, route identifiers, road distances and editorial content |
| `src/data/vehicles.json` | Fleet, seats, luggage, day/km rates, minimum kilometres and driver bata |
| `src/data/houseboats.json` | Boats, operating locations, capacity, price and cruise types |
| `src/data/campaigns.json` | Three paid campaign landing pages, indicative offers and FAQs |
| `src/data/reviews.json` | Clearly labelled illustrative reviews. Replace with approved traveller reviews and appropriate media before commercial use. |
| `src/content/blog/` | Markdown travel journal, with schema in `src/content.config.ts` |
| `src/pages/` | Static routes and dynamic build-time page templates |
| `src/components/`, `src/layouts/` | Shared layout, cards, navigation and forms |
| `src/styles/site.css`, `src/scripts/` | Design tokens and responsive CSS, motion and browser interactions |
| `public/images/`, `public/films/` | Responsive WebP images and muted, self-hosted films |
| `src/data/credits.json` | Individual media credits shown at `/credits/` |

## Add or edit a package

1. Copy a similar entry in `src/data/packages.json`. Give it a unique lowercase `slug`.
2. Set the `title`, `theme`, `region`, starting `price` in rupees and `days`. Nights are derived as days minus one. Set `maxGuests` for the group-size filter.
3. Enter the route as destination slugs in `route` and matching human-readable names in `places`. The order and length of both arrays must match. For a Kerala stop without its own destination page, use the same readable value in both arrays.
4. Add three meaningful `highlights`, a day entry for every itinerary day, available travel months as numbers and one or more image keys. Add each photo's 480px and 960px WebP variants and credit entry. Use higher resolutions for leading visuals if needed.
5. Run `npm run build`. Astro generates the listing, matching destination links, package detail, print itinerary and sitemap entries. The first three entries in the catalogue are featured on the homepage.

## Configure enquiries

1. Enter confirmed contact details in `src/site.config.ts`. Use a full international phone number, including country code, for WhatsApp. Use your own receiving number and email address.
2. Copy `.env.example` to `.env`. Create a form in [Formspree](https://formspree.io/), verify the receiving address and set `PUBLIC_FORMSPREE_ENDPOINT` to the full form endpoint. Optionally set a separate verified `PUBLIC_NEWSLETTER_ENDPOINT`. These public endpoints identify forms and must contain no secret keys.
3. Rebuild and send a test submission with business-approved test details. Confirm receipt, reply routing, failed-send feedback, WhatsApp prefills and the campaign thank-you route. When a submission succeeds, the thank-you page emits a `kasavu:lead` event without personal information. The examples in its source show where to connect GA4 or Meta Pixel after consent.
4. Empty contact fields suppress the corresponding public contact links. Without a Formspree endpoint, forms validate and prepare a message for copying. They clearly indicate that no online delivery occurred.

Sample prices, availability, reviews, vehicle photos, policies and business claims need confirmation before accepting paid bookings. Replace stock pictures with exact fleet or cabin photos if that distinction matters for quotes. Keep the licensed credits for any stock media you retain.

## Deploy

Set `SITE_URL` to the final domain in the build environment. Canonical links, Open Graph, the sitemap and robots file use it.

- **Firebase Hosting** serves the static build using the included `firebase.json`. See the instructions below.
- **Netlify** uses the included `netlify.toml`. Build with `npm run build` and publish `dist`.
- **Vercel** uses the included `vercel.json`. Select the Astro project, apply environment variables and deploy.
- **S3** can serve the contents of `dist/` as a static website with `index.html` and `404.html`. With CloudFront and a private S3 REST origin, route trailing-slash paths to their corresponding `index.html` objects at the edge. Use correct content types for WebP, MP4, SVG, JavaScript, XML and WOFF2, and support HTTP byte range requests for films.
- **Generic static hosting** must serve directory index pages. No runtime Node.js process is required.

The preview build starts without third-party analytics, published reviews or verified claims. Respecting reduced motion or data-saving mode keeps the still visible until a visitor chooses to play a film. The film pauses when it leaves view and when the tab is hidden.

## Deploy to Firebase Hosting

Use Node.js 22 or later. From the project folder:

```sh
npm ci
npx firebase-tools login
npx firebase-tools projects:list
SITE_URL=https://YOUR_PROJECT_ID.web.app npm run build
npx firebase-tools deploy --only hosting --project YOUR_PROJECT_ID
```

Replace `YOUR_PROJECT_ID` with your Firebase project ID. Use your custom domain for `SITE_URL` once it is the primary address. On Windows PowerShell, set `$env:SITE_URL = "https://YOUR_PROJECT_ID.web.app"` before running `npm run build`.

The included configuration serves `dist/` as a multipage site. It preserves Astro’s directory URLs and custom 404 page. If the Firebase project already hosts another site, choose a separate Firebase Hosting site and configure a Hosting target before deploying, so the existing site stays in place.

## Pre-release verification

Review the static build on the final domain with desktop and mobile browsers. Test the contact channels and submission pipelines using approved values. Run the Lighthouse targets against the release build, including the homepage and a representative catalogue/detail route, under the same mobile throttling profile.
