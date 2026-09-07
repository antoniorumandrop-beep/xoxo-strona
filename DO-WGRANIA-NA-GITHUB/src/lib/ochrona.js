/* Ochrona przed botami zapychającymi kalendarz.
   Zasada: żadne z tych zabezpieczeń nie może zatrzymać prawdziwej klientki.
   Wszystkie progi siedzą w src/config.js. */

import { OCHRONA } from '../config.js';

/* Licznik trzymany w pamięci funkcji. Vercel uruchamia kilka instancji,
   więc to nie jest szczelna bariera — ale skutecznie ucina serie żądań
   lecące jedna za drugą, a nie wymaga bazy danych. */
const licznik = new Map();

function ktoPyta(request) {
  const naglowek = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '';
  return naglowek.split(',')[0].trim() || 'nieznane';
}

function posprzataj(teraz, okno) {
  for (const [klucz, czasy] of licznik) {
    const swieze = czasy.filter((t) => teraz - t < okno);
    if (swieze.length) licznik.set(klucz, swieze);
    else licznik.delete(klucz);
  }
}

/**
 * Sprawdza, czy żądanie wygląda na wysłane przez człowieka.
 * Zwraca { ok: true } albo { ok: false, komunikat, status }.
 */
export function sprawdzZadanie(request, dane) {
  if (!OCHRONA.wlaczona) return { ok: true };

  /* 1. Pułapka na boty — pole ukryte przed ludźmi. Człowiek go nie widzi
        i nie wypełni; automat wypełnia wszystko, co znajdzie. */
  if (typeof dane.adresKorespondencyjny === 'string' && dane.adresKorespondencyjny.trim() !== '') {
    return { ok: false, status: 400, komunikat: 'Nie udało się wysłać formularza. Odśwież stronę i spróbuj ponownie.' };
  }

  /* 2. Czas wypełniania. Formularz przechodzi się w kilku krokach,
        więc poniżej kilku sekund to na pewno nie człowiek. */
  const sekundy = Number(dane.wypelnianieSekund);
  if (Number.isFinite(sekundy) && sekundy >= 0 && sekundy < OCHRONA.minSekundNaFormularz) {
    return { ok: false, status: 400, komunikat: 'Formularz został wysłany za szybko. Sprawdź dane i kliknij jeszcze raz.' };
  }

  /* 3. Liczba rezerwacji z jednego łącza w krótkim czasie. */
  const teraz = Date.now();
  const okno = OCHRONA.oknoMinut * 60 * 1000;
  posprzataj(teraz, okno);

  const kto = ktoPyta(request);
  const czasy = (licznik.get(kto) || []).filter((t) => teraz - t < okno);
  if (czasy.length >= OCHRONA.maxRezerwacjiZLacza) {
    return {
      ok: false,
      status: 429,
      komunikat: 'Z tego urządzenia zrobiono już kilka rezerwacji pod rząd. '
        + 'Jeśli chcesz zapisać kolejną osobę, zadzwoń do nas — chętnie pomożemy.',
    };
  }

  return { ok: true, zapiszUdana: () => licznik.set(kto, [...czasy, Date.now()]) };
}
