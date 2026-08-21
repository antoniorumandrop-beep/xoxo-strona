/* Liczenie wolnych terminów.
   Jedyne źródło prawdy o zajętości to Google Calendar — każde wydarzenie
   blokuje termin, nieważne czy powstało przez stronę, czy zostało dopisane
   ręcznie ("urlop", "zajęte", rezerwacja z telefonu). */

import { GODZINY_PRACY, REZERWACJE, DNI_ZAMKNIETE } from '../config.js';
import { czasLokalnyNaDate, dzienTygodnia, minutyNaGodzine } from './czas.js';
import { pobierzZajetosc } from './kalendarz.js';

/** Ile czasu realnie zajmuje wizyta w kalendarzu: zabiegi + przerwa na sprzątanie. */
export function blokWizyty(minutyWizyty) {
  return minutyWizyty + REZERWACJE.bufor;
}

/** Godziny otwarcia dla danej daty albo null, gdy zamknięte. */
export function godzinyOtwarcia(dataISO) {
  if (DNI_ZAMKNIETE.includes(dataISO)) return null;
  return GODZINY_PRACY[dzienTygodnia(dataISO)] || null;
}

/** Najwcześniejszy moment, na który wolno się zapisać (minimalne wyprzedzenie). */
export function granicaWyprzedzenia() {
  return new Date(Date.now() + REZERWACJE.minGodzin * 3600 * 1000);
}

function kolizja(startMin, blok, dataISO, zajetosc) {
  const od = czasLokalnyNaDate(dataISO, startMin);
  const doKiedy = czasLokalnyNaDate(dataISO, startMin + blok);
  return zajetosc.some((w) => od < w.do && doKiedy > w.od);
}

/**
 * Wszystkie sloty dnia z informacją, które są wolne.
 * minutyWizyty = same zabiegi (+ konsultacja przy pierwszej wizycie), bez bufora.
 */
export async function wolneTerminy(dataISO, minutyWizyty) {
  const otwarcie = godzinyOtwarcia(dataISO);
  if (!otwarcie) {
    return { otwarte: false, godziny: null, sloty: [] };
  }

  const [od, doKiedy] = otwarcie;
  const blok = blokWizyty(minutyWizyty);
  const granica = granicaWyprzedzenia();

  const zajetosc = await pobierzZajetosc(
    czasLokalnyNaDate(dataISO, 0),
    czasLokalnyNaDate(dataISO, 24 * 60)
  );

  const sloty = [];
  for (let m = od * 60; m + blok <= doKiedy * 60; m += REZERWACJE.krokSlotu) {
    const start = czasLokalnyNaDate(dataISO, m);
    const zaPozno = start < granica;
    sloty.push({
      godzina: minutyNaGodzine(m),
      wolny: !zaPozno && !kolizja(m, blok, dataISO, zajetosc),
    });
  }

  return { otwarte: true, godziny: [od, doKiedy], sloty };
}

/**
 * Sprawdzenie jednego terminu — wołane jeszcze raz tuż przed zapisem,
 * żeby dwie osoby nie zajęły tej samej godziny.
 * Zwraca { wolny: true } albo { wolny: false, powod: '...' }.
 */
export async function sprawdzTermin(dataISO, startMin, minutyWizyty) {
  const otwarcie = godzinyOtwarcia(dataISO);
  if (!otwarcie) {
    return { wolny: false, powod: 'Tego dnia studio jest zamknięte.' };
  }

  const [od, doKiedy] = otwarcie;
  const blok = blokWizyty(minutyWizyty);

  if (startMin < od * 60 || startMin + blok > doKiedy * 60) {
    return { wolny: false, powod: 'Ta wizyta nie zmieści się w godzinach pracy studia.' };
  }
  if (startMin % REZERWACJE.krokSlotu !== 0) {
    return { wolny: false, powod: 'Wizyty zaczynamy o pełnych kwadransach.' };
  }

  const start = czasLokalnyNaDate(dataISO, startMin);
  if (start < granicaWyprzedzenia()) {
    return {
      wolny: false,
      powod: `Na wizytę trzeba zapisać się co najmniej ${REZERWACJE.minGodzin} h wcześniej.`,
    };
  }

  const zajetosc = await pobierzZajetosc(
    czasLokalnyNaDate(dataISO, 0),
    czasLokalnyNaDate(dataISO, 24 * 60)
  );

  if (kolizja(startMin, blok, dataISO, zajetosc)) {
    return { wolny: false, powod: 'Ten termin jest już zajęty.' };
  }

  return { wolny: true };
}
