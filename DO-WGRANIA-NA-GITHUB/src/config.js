/* =========================================================================
   XOXO Beauty Lab — JEDYNY plik konfiguracyjny.
   Zmieniasz tu godziny, bufor, ceny i zabiegi — reszta systemu się dostosuje
   (i strona, i kalendarz, i maile). Nie ma tu żadnych haseł ani kluczy.
   ========================================================================= */

export const STUDIO = {
  nazwa: 'XOXO Beauty Lab',
  adres: 'ul. Cmentarna 28, 59-500 Złotoryja',
  telefon: '+48 697 061 471',
  www: 'https://xoxobeautylab.pl',
  instagram: 'https://www.instagram.com/xoxo_beautylab',
  strefa: 'Europe/Warsaw',   // strefa czasowa studia — nie zmieniaj bez potrzeby
};

/* --- GODZINY PRACY ---------------------------------------------------------
   Klucz = dzień tygodnia: 0 = niedziela, 1 = poniedziałek ... 6 = sobota.
   [od, do] w pełnych godzinach.  null = ZAMKNIĘTE.
   Wizyta musi zmieścić się w całości (razem z buforem) przed godziną zamknięcia.
--------------------------------------------------------------------------- */
export const GODZINY_PRACY = {
  0: [10, 15],   // niedziela  10–15
  1: null,       // poniedziałek — zamknięte
  2: null,       // wtorek — zamknięte
  3: null,       // środa — zamknięte
  4: null,       // czwartek — zamknięte
  5: [9, 20],    // piątek     9–20
  6: [9, 20],    // sobota     9–20
};

/* --- ZASADY REZERWACJI --------------------------------------------------- */
export const REZERWACJE = {
  bufor: 10,             // min — przerwa między klientkami, doliczana do długości wizyty
  konsultacja: 10,       // min — pierwsza wizyta, GRATIS
  minGodzin: 12,         // najwcześniej tyle godzin od teraz
  odwolanieGodzin: 12,   // do ilu godzin przed wizytą można odwołać (tylko treść maila)
  krokSlotu: 15,         // co ile minut proponujemy start wizyty
  maxDniNaprzod: 21,     // ile dni do przodu pokazujemy w kalendarzu
  maxZabiegow: 10,       // zabezpieczenie: więcej zabiegów w jednej rezerwacji = błąd
  maxMinutWizyty: 480,   // zabezpieczenie: dłuższa wizyta = błąd
};

/* --- DNI WOLNE / URLOP -----------------------------------------------------
   Szybki sposób na zamknięcie studia w konkretne dni: 'YYYY-MM-DD'.
   (Można też po prostu wstawić całodniowe wydarzenie w Google Calendar —
   ono zablokuje termin tak samo.)
--------------------------------------------------------------------------- */
export const DNI_ZAMKNIETE = [
  // '2026-12-24',
];

/* --- CENNIK / ZABIEGI ------------------------------------------------------
   id  — nie zmieniaj po uruchomieniu (trafia w linki i w wysyłkę formularza)
   czas — minuty samego zabiegu, BEZ bufora
--------------------------------------------------------------------------- */
export const KATEGORIE = [
  {
    id: 'depilacja',
    nazwa: 'Depilacja laserowa',
    technologia: 'SHR + IPL + RF',
    skrotTechnologii: 'SHR',     // krótka wersja — tak zabieg opisujemy w kalendarzu
    otwarta: true,               // ta kategoria jest rozwinięta od razu
    zabiegi: [
      { id: 'dep-wasik',        nazwa: 'Wąsik',                            cena: 119, czas: 15 },
      { id: 'dep-broda',        nazwa: 'Broda',                            cena: 119, czas: 15 },
      { id: 'dep-baczki',       nazwa: 'Baczki',                           cena: 119, czas: 15 },
      { id: 'dep-kark',         nazwa: 'Kark',                             cena: 119, czas: 25 },
      { id: 'dep-pachy',        nazwa: 'Pachy',                            cena: 199, czas: 25 },
      { id: 'dep-bikini',       nazwa: 'Bikini',                           cena: 199, czas: 30 },
      { id: 'dep-bikini-gleb',  nazwa: 'Bikini głębokie',                  cena: 299, czas: 35 },
      { id: 'dep-brzuch',       nazwa: 'Brzuch cały',                      cena: 299, czas: 25 },
      { id: 'dep-klatka',       nazwa: 'Klatka piersiowa',                 cena: 299, czas: 25 },
      { id: 'dep-lydki',        nazwa: 'Łydki',                            cena: 249, czas: 35 },
      { id: 'dep-plecy',        nazwa: 'Plecy (całe)',                     cena: 299, czas: 45 },
      { id: 'dep-posladki',     nazwa: 'Pośladki',                         cena: 199, czas: 20 },
      { id: 'dep-przedramiona', nazwa: 'Przedramiona + łokcie + dłonie',   cena: 249, czas: 45 },
      { id: 'dep-ramiona',      nazwa: 'Ramiona',                          cena: 199, czas: 25 },
      { id: 'dep-uda',          nazwa: 'Uda',                              cena: 299, czas: 25 },
    ],
  },
  {
    id: 'naczynka',
    nazwa: 'Zamykanie naczynek',
    technologia: 'E-Light',
    zabiegi: [
      { id: 'nacz-pojedyncze',  nazwa: 'Pojedyncze naczynko',              cena: 119, czas: 15 },
      { id: 'nacz-nos',         nazwa: 'Nos',                              cena: 169, czas: 30 },
      { id: 'nacz-czolo',       nazwa: 'Czoło',                            cena: 169, czas: 20 },
      { id: 'nacz-broda',       nazwa: 'Broda',                            cena: 169, czas: 15 },
      { id: 'nacz-dlonie',      nazwa: 'Dłonie',                           cena: 199, czas: 20 },
      { id: 'nacz-policzki',    nazwa: 'Policzki + maska',                 cena: 209, czas: 30 },
      { id: 'nacz-szyja',       nazwa: 'Szyja + maska',                    cena: 209, czas: 35 },
      { id: 'nacz-dekolt',      nazwa: 'Dekolt + maska',                   cena: 279, czas: 35 },
      { id: 'nacz-twarz',       nazwa: 'Twarz + maska',                    cena: 309, czas: 60 },
      { id: 'nacz-plecy',       nazwa: 'Plecy',                            cena: 319, czas: 60 },
      { id: 'nacz-tw-dek',      nazwa: 'Twarz + dekolt + maska',           cena: 389, czas: 60 },
      { id: 'nacz-tw-sz-dek',   nazwa: 'Twarz + szyja + dekolt + maska',   cena: 479, czas: 60 },
    ],
  },
  {
    id: 'przebarwienia',
    nazwa: 'Usuwanie przebarwień',
    technologia: 'E-Light',
    zabiegi: [
      { id: 'prz-pojedyncze',   nazwa: 'Pojedyncze przebarwienie',         cena: 89,  czas: 20 },
      { id: 'prz-nos',          nazwa: 'Nos',                              cena: 99,  czas: 20 },
      { id: 'prz-broda',        nazwa: 'Broda',                            cena: 149, czas: 20 },
      { id: 'prz-czolo',        nazwa: 'Czoło',                            cena: 149, czas: 20 },
      { id: 'prz-dlonie',       nazwa: 'Dłonie',                           cena: 169, czas: 30 },
      { id: 'prz-policzki',     nazwa: 'Policzki',                         cena: 169, czas: 45 },
      { id: 'prz-dekolt',       nazwa: 'Dekolt',                           cena: 249, czas: 45 },
      { id: 'prz-twarz',        nazwa: 'Cała twarz',                       cena: 299, czas: 60 },
    ],
  },
  {
    id: 'fotoodmladzanie',
    nazwa: 'Fotoodmładzanie',
    technologia: 'SSR',
    zabiegi: [
      { id: 'foto-dlonie',      nazwa: 'Dłonie',                           cena: 249, czas: 30 },
      { id: 'foto-brzuch',      nazwa: 'Brzuch',                           cena: 329, czas: 30 },
      { id: 'foto-przedramiona',nazwa: 'Przedramiona',                     cena: 329, czas: 35 },
      { id: 'foto-ramiona',     nazwa: 'Ramiona',                          cena: 329, czas: 35 },
      { id: 'foto-twarz',       nazwa: 'Twarz',                            cena: 419, czas: 60 },
      { id: 'foto-szyja-dek',   nazwa: 'Szyja + dekolt',                   cena: 419, czas: 60 },
      { id: 'foto-tw-sz',       nazwa: 'Twarz + szyja lub dekolt',         cena: 499, czas: 90 },
      { id: 'foto-tw-sz-dek',   nazwa: 'Twarz + szyja + dekolt',           cena: 579, czas: 90 },
    ],
  },
];

/* Wyszukiwarka zabiegu po id — używana przez API, żeby ceny i czasy
   zawsze brały się z serwera, a nie z tego, co przyśle przeglądarka. */
const INDEKS = new Map();
for (const kat of KATEGORIE) {
  for (const z of kat.zabiegi) {
    INDEKS.set(z.id, {
      ...z,
      kategoria: kat.nazwa,
      technologia: kat.technologia,
      technologiaKrotka: kat.skrotTechnologii || kat.technologia,
    });
  }
}

export function znajdzZabieg(id) {
  return INDEKS.get(id) || null;
}
