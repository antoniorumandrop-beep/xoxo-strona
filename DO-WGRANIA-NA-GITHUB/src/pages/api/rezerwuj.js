/* POST /api/rezerwuj
   1. sprawdza dane z formularza,
   2. JESZCZE RAZ sprawdza dostępność (ochrona przed podwójną rezerwacją),
   3. tworzy wydarzenie w Google Calendar,
   4. wysyła maile przez Resend. */

import { czasLokalnyNaDate } from '../../lib/czas.js';
import { przygotujWizyte, tytulWydarzenia, opisWydarzenia } from '../../lib/wizyta.js';
import { sprawdzTermin, blokWizyty } from '../../lib/terminy.js';
import { dodajWydarzenie, BladKalendarza } from '../../lib/kalendarz.js';
import { wyslijMaile } from '../../lib/maile.js';

export const prerender = false;

const json = (dane, status = 200) =>
  new Response(JSON.stringify(dane), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });

export async function POST({ request }) {
  let dane;
  try {
    dane = await request.json();
  } catch {
    return json({ blad: 'DANE', komunikat: 'Nie udało się odczytać formularza.' }, 400);
  }

  // 1. Dane klientki i zabiegi (ceny i czasy z konfiguracji, nie z przeglądarki).
  const sprawdzenie = przygotujWizyte(dane);
  if (!sprawdzenie.ok) {
    return json({
      blad: 'DANE',
      komunikat: 'Uzupełnij zaznaczone pola.',
      pola: sprawdzenie.bledy,
    }, 400);
  }
  const w = sprawdzenie.wizyta;

  try {
    // 2. Ostatnie sprawdzenie tuż przed zapisem.
    const stan = await sprawdzTermin(w.data, w.startMin, w.czas);
    if (!stan.wolny) {
      return json({
        blad: 'ZAJETY',
        komunikat: `${stan.powod} Wybierz inną godzinę — lista właśnie się odświeżyła.`,
      }, 409);
    }

    // 3. Wydarzenie w kalendarzu. Blok obejmuje wizytę + przerwę na sprzątanie.
    const od = czasLokalnyNaDate(w.data, w.startMin);
    const doKiedy = czasLokalnyNaDate(w.data, w.startMin + blokWizyty(w.czas));

    const wydarzenie = await dodajWydarzenie({
      tytul: tytulWydarzenia(w),
      opis: opisWydarzenia(w),
      od,
      doKiedy,
    });

    // 4. Maile. Rezerwacja jest już zapisana — nawet gdy poczta zawiedzie,
    //    potwierdzamy klientce termin i mówimy, co się stało.
    const maile = await wyslijMaile(w);

    return json({
      ok: true,
      rezerwacja: {
        data: w.data,
        godzina: w.godzina,
        koniec: w.koniec,
        czas: w.czas,
        cena: w.cena,
        pierwszaWizyta: w.pierwszaWizyta,
        zabiegi: w.zabiegi.map((z) => ({
          nazwa: z.nazwa, technologia: z.technologia, czas: z.czas, cena: z.cena,
        })),
      },
      mailWyslany: maile.klientka,
      idWydarzenia: wydarzenie.id,
    });
  } catch (e) {
    if (e instanceof BladKalendarza) {
      console.error('[rezerwuj] Kalendarz:', e.message, e.szczegoly || '');
      return json({
        blad: 'KALENDARZ',
        komunikat: 'Nie udało się zapisać wizyty w kalendarzu. Zadzwoń do nas, zrobimy to ręcznie.',
      }, 502);
    }
    console.error('[rezerwuj] Nieoczekiwany błąd:', e);
    return json({
      blad: 'SERWER',
      komunikat: 'Coś poszło nie tak po naszej stronie. Spróbuj jeszcze raz albo zadzwoń do studia.',
    }, 500);
  }
}
