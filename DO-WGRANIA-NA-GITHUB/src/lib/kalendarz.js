/* Google Calendar — logowanie kluczem Service Account i dwie operacje:
   pobierz wydarzenia z dnia / dodaj wydarzenie.
   Bez zewnętrznych bibliotek: podpisujemy JWT wbudowanym node:crypto. */

import { createSign } from 'node:crypto';
import { naRFC3339, czasLokalnyNaDate } from './czas.js';
import { STUDIO } from '../config.js';

const ZAKRES = 'https://www.googleapis.com/auth/calendar';
const API = 'https://www.googleapis.com/calendar/v3';

/** Błąd, który umiemy pokazać człowiekowi. */
export class BladKalendarza extends Error {
  constructor(komunikat, szczegoly) {
    super(komunikat);
    this.name = 'BladKalendarza';
    this.szczegoly = szczegoly;
  }
}

function konto() {
  const surowy = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!surowy) {
    throw new BladKalendarza('Brak zmiennej GOOGLE_SERVICE_ACCOUNT_JSON.');
  }
  let dane;
  try {
    dane = JSON.parse(surowy);
  } catch {
    throw new BladKalendarza('GOOGLE_SERVICE_ACCOUNT_JSON nie jest poprawnym JSON-em.');
  }
  if (!dane.client_email || !dane.private_key) {
    throw new BladKalendarza('W kluczu Service Account brakuje client_email albo private_key.');
  }
  // Vercel potrafi zapisać \n dosłownie — przywracamy prawdziwe końce linii.
  dane.private_key = dane.private_key.replace(/\\n/g, '\n');
  return dane;
}

export function idKalendarza() {
  const id = process.env.GOOGLE_CALENDAR_ID;
  if (!id) throw new BladKalendarza('Brak zmiennej GOOGLE_CALENDAR_ID.');
  return id;
}

const base64url = (buf) =>
  Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

/* Token żyje godzinę; trzymamy go w pamięci funkcji, żeby nie logować się
   przy każdym kliknięciu (ciepłe wywołania są dzięki temu szybsze). */
let tokenWPamieci = { wartosc: null, wazneDo: 0 };

async function token() {
  if (tokenWPamieci.wartosc && Date.now() < tokenWPamieci.wazneDo - 60_000) {
    return tokenWPamieci.wartosc;
  }
  const sa = konto();
  const teraz = Math.floor(Date.now() / 1000);
  const naglowek = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const tresc = base64url(JSON.stringify({
    iss: sa.client_email,
    scope: ZAKRES,
    aud: 'https://oauth2.googleapis.com/token',
    iat: teraz,
    exp: teraz + 3600,
  }));

  let podpis;
  try {
    const sign = createSign('RSA-SHA256');
    sign.update(`${naglowek}.${tresc}`);
    sign.end();
    podpis = base64url(sign.sign(sa.private_key));
  } catch (e) {
    throw new BladKalendarza('Nie udało się podpisać klucza Service Account.', e.message);
  }

  const odp = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${naglowek}.${tresc}.${podpis}`,
    }),
  });

  const dane = await odp.json().catch(() => ({}));
  if (!odp.ok || !dane.access_token) {
    throw new BladKalendarza(
      'Google odrzucił logowanie Service Account.',
      dane.error_description || dane.error || `HTTP ${odp.status}`
    );
  }

  tokenWPamieci = {
    wartosc: dane.access_token,
    wazneDo: Date.now() + (dane.expires_in || 3600) * 1000,
  };
  return tokenWPamieci.wartosc;
}

async function zapytaj(sciezka, opcje = {}) {
  const dostep = await token();
  const odp = await fetch(`${API}${sciezka}`, {
    ...opcje,
    headers: {
      Authorization: `Bearer ${dostep}`,
      'Content-Type': 'application/json',
      ...(opcje.headers || {}),
    },
  });
  const dane = await odp.json().catch(() => ({}));
  if (!odp.ok) {
    const powod = dane?.error?.message || `HTTP ${odp.status}`;
    if (odp.status === 404) {
      throw new BladKalendarza(
        'Nie widzę tego kalendarza. Sprawdź GOOGLE_CALENDAR_ID i czy kalendarz jest udostępniony koncie Service Account.',
        powod
      );
    }
    if (odp.status === 403) {
      throw new BladKalendarza(
        'Brak uprawnień do kalendarza. Udostępnij go Service Account z prawem "Wprowadzanie zmian w wydarzeniach".',
        powod
      );
    }
    throw new BladKalendarza('Google Calendar zwrócił błąd.', powod);
  }
  return dane;
}

/**
 * Zajętość między dwoma momentami.
 * Bierzemy KAŻDE wydarzenie z kalendarza — także dopisane ręcznie przez
 * właścicielkę (telefoniczna rezerwacja, urlop, "zajęte").
 * Pomijamy tylko odwołane i te oznaczone jako "wolny/dostępny".
 * Zwraca [{ od: Date, do: Date, tytul }] posortowane rosnąco.
 */
export async function pobierzZajetosc(od, doKiedy) {
  const parametry = new URLSearchParams({
    timeMin: od.toISOString(),
    timeMax: doKiedy.toISOString(),
    singleEvents: 'true',        // rozwija cykliczne na pojedyncze wystąpienia
    orderBy: 'startTime',
    maxResults: '250',
    timeZone: STUDIO.strefa,
  });

  const dane = await zapytaj(`/calendars/${encodeURIComponent(idKalendarza())}/events?${parametry}`);

  return (dane.items || [])
    .filter((w) => w.status !== 'cancelled' && w.transparency !== 'transparent')
    .map((w) => {
      // Wydarzenie całodniowe ma date zamiast dateTime — blokuje cały dzień.
      const start = w.start?.dateTime
        ? new Date(w.start.dateTime)
        : czasLokalnyNaDate(w.start?.date, 0);      // północ czasu polskiego
      const koniec = w.end?.dateTime
        ? new Date(w.end.dateTime)
        : czasLokalnyNaDate(w.end?.date, 0);
      return { od: start, do: koniec, tytul: w.summary || '(bez tytułu)' };
    })
    .filter((w) => !Number.isNaN(+w.od) && !Number.isNaN(+w.do) && w.do > w.od)
    .sort((a, b) => a.od - b.od);
}

/** Dodaje wydarzenie. Zwraca { id, link }. */
export async function dodajWydarzenie({ tytul, opis, od, doKiedy }) {
  const dane = await zapytaj(`/calendars/${encodeURIComponent(idKalendarza())}/events`, {
    method: 'POST',
    body: JSON.stringify({
      summary: tytul,
      description: opis,
      start: { dateTime: naRFC3339(od), timeZone: STUDIO.strefa },
      end: { dateTime: naRFC3339(doKiedy), timeZone: STUDIO.strefa },
      reminders: { useDefault: true },
    }),
  });
  return { id: dane.id, link: dane.htmlLink };
}
