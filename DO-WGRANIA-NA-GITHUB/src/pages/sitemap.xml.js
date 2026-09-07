/* Mapa witryny generowana przy każdym budowaniu.
   Dzięki temu `lastmod` zawsze odpowiada dacie ostatniego wdrożenia,
   a lista adresów jest w jednym miejscu — nie trzeba pamiętać
   o ręcznej aktualizacji pliku po dodaniu podstrony. */

import { STUDIO } from '../config.js';

const STRONY = [
  { sciezka: '/',                  priorytet: '1.0', czestotliwosc: 'monthly' },
  { sciezka: '/rezerwacja',        priorytet: '0.9', czestotliwosc: 'weekly'  },
  { sciezka: '/polityka-prywatnosci', priorytet: '0.2', czestotliwosc: 'yearly' },
];

export async function GET() {
  const dzis = new Date().toISOString().slice(0, 10);
  const baza = STUDIO.www.replace(/\/$/, '');

  const wpisy = STRONY.map(({ sciezka, priorytet, czestotliwosc }) => `  <url>
    <loc>${baza}${sciezka}</loc>
    <lastmod>${dzis}</lastmod>
    <changefreq>${czestotliwosc}</changefreq>
    <priority>${priorytet}</priority>
  </url>`).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${wpisy}
</urlset>
`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
}
