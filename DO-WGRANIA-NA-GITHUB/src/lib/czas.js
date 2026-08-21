/* Czas i strefy.
   Serwer Vercela chodzi w UTC, studio żyje w czasie polskim (raz +1, raz +2 h).
   Wszystko poniżej tłumaczy "9:00 w Złotoryi" na konkretny moment na świecie
   i z powrotem — z uwzględnieniem zmiany czasu. */

import { STUDIO } from '../config.js';

const TZ = STUDIO.strefa;

const FORMATER = new Intl.DateTimeFormat('en-US', {
  timeZone: TZ, hour12: false,
  year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', second: '2-digit',
});

function czesci(date) {
  const p = {};
  for (const { type, value } of FORMATER.formatToParts(date)) p[type] = value;
  return {
    rok: +p.year, miesiac: +p.month, dzien: +p.day,
    godzina: +p.hour % 24, minuta: +p.minute, sekunda: +p.second,
  };
}

/** Przesunięcie strefy (w minutach) obowiązujące w danym momencie. */
function przesuniecie(date) {
  const c = czesci(date);
  const jakoUtc = Date.UTC(c.rok, c.miesiac - 1, c.dzien, c.godzina, c.minuta, c.sekunda);
  return (jakoUtc - Math.floor(date.getTime() / 1000) * 1000) / 60000;
}

/**
 * "2026-08-22" + 585 minut od północy  ->  prawdziwy moment (Date w UTC).
 * Dwa przebiegi, żeby poprawnie trafić w dni zmiany czasu.
 */
export function czasLokalnyNaDate(dataISO, minutyOdPolnocy) {
  const [r, m, d] = dataISO.split('-').map(Number);
  const wstepnie = Date.UTC(r, m - 1, d, 0, minutyOdPolnocy);
  let off = przesuniecie(new Date(wstepnie));
  let wynik = wstepnie - off * 60000;
  off = przesuniecie(new Date(wynik));
  return new Date(wstepnie - off * 60000);
}

/** Dzień tygodnia (0 = niedziela) dla daty 'YYYY-MM-DD' — bez pułapek strefowych. */
export function dzienTygodnia(dataISO) {
  const [r, m, d] = dataISO.split('-').map(Number);
  return new Date(Date.UTC(r, m - 1, d)).getUTCDay();
}

/** Dzisiejsza data 'YYYY-MM-DD' widziana z Polski. */
export function dzisISO() {
  const c = czesci(new Date());
  return `${c.rok}-${String(c.miesiac).padStart(2, '0')}-${String(c.dzien).padStart(2, '0')}`;
}

/** 'YYYY-MM-DD' + n dni. */
export function dodajDni(dataISO, n) {
  const [r, m, d] = dataISO.split('-').map(Number);
  const t = new Date(Date.UTC(r, m - 1, d + n));
  return `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, '0')}-${String(t.getUTCDate()).padStart(2, '0')}`;
}

/** 585 -> "09:45" */
export function minutyNaGodzine(minuty) {
  const h = Math.floor(minuty / 60), m = minuty % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** "09:45" -> 585 (albo null, gdy format jest zły) */
export function godzinaNaMinuty(tekst) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(tekst || '').trim());
  if (!m) return null;
  const h = +m[1], mi = +m[2];
  if (h > 23 || mi > 59) return null;
  return h * 60 + mi;
}

/** 70 -> "1 h 10 min" */
export function opisCzasu(minuty) {
  const h = Math.floor(minuty / 60), r = minuty % 60;
  if (!h) return `${minuty} min`;
  return r ? `${h} h ${r} min` : `${h} h`;
}

const DNI = ['niedziela', 'poniedziałek', 'wtorek', 'środa', 'czwartek', 'piątek', 'sobota'];
const MIESIACE = ['stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca',
  'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia'];

/** "2026-08-22" -> "sobota, 22 sierpnia 2026" */
export function opisDaty(dataISO) {
  const [r, m, d] = dataISO.split('-').map(Number);
  return `${DNI[dzienTygodnia(dataISO)]}, ${d} ${MIESIACE[m - 1]} ${r}`;
}

/** Czy tekst wygląda jak poprawna data 'YYYY-MM-DD' i taka data istnieje. */
export function poprawnaData(tekst) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(tekst || ''))) return false;
  const [r, m, d] = tekst.split('-').map(Number);
  if (m < 1 || m > 12 || d < 1 || d > 31) return false;
  const t = new Date(Date.UTC(r, m - 1, d));
  return t.getUTCFullYear() === r && t.getUTCMonth() === m - 1 && t.getUTCDate() === d;
}

/** Format wymagany przez Google Calendar: 2026-08-22T09:00:00+02:00 */
export function naRFC3339(date) {
  const off = przesuniecie(date);
  const znak = off >= 0 ? '+' : '-';
  const abs = Math.abs(off);
  const c = czesci(date);
  const dwa = (n) => String(n).padStart(2, '0');
  return `${c.rok}-${dwa(c.miesiac)}-${dwa(c.dzien)}T${dwa(c.godzina)}:${dwa(c.minuta)}:${dwa(c.sekunda)}`
    + `${znak}${dwa(Math.floor(abs / 60))}:${dwa(abs % 60)}`;
}
