/* Sprawdzanie danych z formularza i budowanie wizyty.
   Ceny i czasy ZAWSZE bierzemy z src/config.js po id zabiegu — nigdy z tego,
   co przyszło z przeglądarki. Dzięki temu nikt nie "przeceni" sobie wizyty. */

import { REZERWACJE, STUDIO, znajdzZabieg } from '../config.js';
import {
  poprawnaData, godzinaNaMinuty, minutyNaGodzine,
  opisCzasu, opisDaty, dzisISO, dodajDni,
} from './czas.js';

const EMAIL = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

function tekst(w, max) {
  return String(w ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
}

/**
 * Sprawdza dane rezerwacji i składa z nich komplet informacji o wizycie.
 * Zwraca { ok: true, wizyta } albo { ok: false, bledy: { pole: 'komunikat' } }.
 */
export function przygotujWizyte(dane = {}) {
  const bledy = {};

  const imie = tekst(dane.imie, 80);
  if (imie.length < 3 || !imie.includes(' ')) {
    bledy.imie = 'Podaj imię i nazwisko.';
  }

  const telefonSurowy = tekst(dane.telefon, 24);
  const cyfry = telefonSurowy.replace(/[^\d]/g, '');
  if (cyfry.length < 9 || cyfry.length > 15) {
    bledy.telefon = 'Podaj numer telefonu (np. 600 100 200).';
  }

  const email = tekst(dane.email, 120).toLowerCase();
  if (!EMAIL.test(email)) {
    bledy.email = 'Podaj adres e-mail, na który wyślemy potwierdzenie.';
  }

  const uwagi = tekst(dane.uwagi, 500);
  const pierwszaWizyta = dane.pierwszaWizyta === true;

  const dataISO = tekst(dane.data, 10);
  if (!poprawnaData(dataISO)) {
    bledy.data = 'Nieprawidłowa data.';
  } else if (dataISO < dzisISO()) {
    bledy.data = 'Ta data już minęła.';
  } else if (dataISO > dodajDni(dzisISO(), REZERWACJE.maxDniNaprzod)) {
    bledy.data = `Zapisy prowadzimy na ${REZERWACJE.maxDniNaprzod} dni do przodu.`;
  }

  const startMin = godzinaNaMinuty(dane.godzina);
  if (startMin === null) {
    bledy.godzina = 'Wybierz godzinę wizyty.';
  }

  const idki = Array.isArray(dane.zabiegi) ? dane.zabiegi.map((x) => tekst(x, 40)) : [];
  const unikalne = [...new Set(idki)];
  const zabiegi = [];
  if (unikalne.length === 0) {
    bledy.zabiegi = 'Wybierz przynajmniej jeden zabieg.';
  } else if (unikalne.length > REZERWACJE.maxZabiegow) {
    bledy.zabiegi = `Maksymalnie ${REZERWACJE.maxZabiegow} zabiegów w jednej rezerwacji.`;
  } else {
    for (const id of unikalne) {
      const z = znajdzZabieg(id);
      if (!z) {
        bledy.zabiegi = 'Któryś z wybranych zabiegów nie istnieje. Odśwież stronę i spróbuj ponownie.';
        break;
      }
      zabiegi.push(z);
    }
  }

  if (Object.keys(bledy).length) return { ok: false, bledy };

  const czasZabiegow = zabiegi.reduce((s, z) => s + z.czas, 0);
  const czas = czasZabiegow + (pierwszaWizyta ? REZERWACJE.konsultacja : 0);
  const cena = zabiegi.reduce((s, z) => s + z.cena, 0);

  if (czas > REZERWACJE.maxMinutWizyty) {
    return { ok: false, bledy: { zabiegi: 'Ta wizyta jest za długa — podzielmy ją na dwa terminy.' } };
  }

  return {
    ok: true,
    wizyta: {
      imie,
      telefon: telefonSurowy,
      email,
      uwagi,
      pierwszaWizyta,
      data: dataISO,
      startMin,
      godzina: minutyNaGodzine(startMin),
      koniec: minutyNaGodzine(startMin + czas),
      zabiegi,
      czas,
      cena,
    },
  };
}

/** "Anna Kowalska — Pachy + Bikini głębokie (498 zł)" */
export function tytulWydarzenia(w) {
  return `${w.imie} — ${w.zabiegi.map((z) => z.nazwa).join(' + ')} (${w.cena} zł)`;
}

/** Opis wydarzenia — właścicielka widzi wszystko bez klikania. */
export function opisWydarzenia(w) {
  const linie = w.zabiegi.map((z) => `${z.nazwa} (${z.czas} min) — ${z.technologiaKrotka}`);
  if (w.pierwszaWizyta) {
    linie.push(`+ konsultacja ${REZERWACJE.konsultacja} min (pierwsza wizyta)`);
  }
  linie.push(`Razem: ${opisCzasu(w.czas)} · ${w.cena} zł`);
  linie.push(`tel. ${w.telefon}`);
  linie.push(`mail: ${w.email}`);
  if (w.uwagi) linie.push(`uwagi: ${w.uwagi}`);
  linie.push('');
  linie.push(`Rezerwacja ze strony ${STUDIO.www.replace('https://', '')} · po wizycie doliczone ${REZERWACJE.bufor} min przerwy.`);
  return linie.join('\n');
}

/** Ładny opis terminu do maili: "sobota, 22 sierpnia 2026, 10:00–11:00" */
export function opisTerminu(w) {
  return `${opisDaty(w.data)}, ${w.godzina}–${w.koniec}`;
}
