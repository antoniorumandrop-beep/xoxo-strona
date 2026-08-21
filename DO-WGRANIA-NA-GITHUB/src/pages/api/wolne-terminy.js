/* GET /api/wolne-terminy?data=YYYY-MM-DD&minuty=60
   Zwraca sloty danego dnia z informacją, które są wolne.
   `minuty` = długość samej wizyty (zabiegi + ewentualna konsultacja),
   bufor doliczamy po stronie serwera. */

import { REZERWACJE } from '../../config.js';
import { poprawnaData, dzisISO, dodajDni } from '../../lib/czas.js';
import { wolneTerminy, blokWizyty } from '../../lib/terminy.js';
import { BladKalendarza } from '../../lib/kalendarz.js';

export const prerender = false;

const json = (dane, status = 200) =>
  new Response(JSON.stringify(dane), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });

export async function GET({ url }) {
  const data = url.searchParams.get('data');
  const minuty = Number(url.searchParams.get('minuty'));

  if (!poprawnaData(data)) {
    return json({ blad: 'DANE', komunikat: 'Nieprawidłowa data.' }, 400);
  }
  if (data < dzisISO()) {
    return json({ blad: 'DANE', komunikat: 'Ta data już minęła.' }, 400);
  }
  if (data > dodajDni(dzisISO(), REZERWACJE.maxDniNaprzod)) {
    return json({
      blad: 'DANE',
      komunikat: `Zapisy prowadzimy na ${REZERWACJE.maxDniNaprzod} dni do przodu.`,
    }, 400);
  }
  if (!Number.isInteger(minuty) || minuty < 5 || minuty > REZERWACJE.maxMinutWizyty) {
    return json({ blad: 'DANE', komunikat: 'Nieprawidłowa długość wizyty.' }, 400);
  }

  try {
    const wynik = await wolneTerminy(data, minuty);
    return json({
      data,
      minuty,
      blok: blokWizyty(minuty),
      otwarte: wynik.otwarte,
      godziny: wynik.godziny,
      sloty: wynik.sloty,
    });
  } catch (e) {
    if (e instanceof BladKalendarza) {
      console.error('[wolne-terminy] Kalendarz:', e.message, e.szczegoly || '');
      return json({
        blad: 'KALENDARZ',
        komunikat: 'Nie udało się sprawdzić kalendarza. Spróbuj za chwilę albo zadzwoń do studia.',
      }, 502);
    }
    console.error('[wolne-terminy] Nieoczekiwany błąd:', e);
    return json({
      blad: 'SERWER',
      komunikat: 'Coś poszło nie tak po naszej stronie. Spróbuj za chwilę.',
    }, 500);
  }
}
