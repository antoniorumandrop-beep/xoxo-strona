# XOXO Beauty Lab — strona + rezerwacje online

Astro (strona statyczna) + dwie funkcje serverless na Vercelu.
**Bez bazy danych — źródłem prawdy jest Google Calendar.**

```
src/config.js              ← TU zmieniasz godziny, bufor, ceny i zabiegi
src/pages/index.astro      ← strona główna (/)
src/pages/rezerwacja.astro ← formularz rezerwacji (/rezerwacja)
src/pages/api/
  wolne-terminy.js         ← GET  /api/wolne-terminy?data=…&minuty=…
  rezerwuj.js              ← POST /api/rezerwuj
src/lib/
  czas.js                  ← strefa Europe/Warsaw, zmiana czasu, formaty dat
  kalendarz.js             ← Google Calendar (Service Account)
  terminy.js               ← liczenie wolnych slotów i kolizji
  wizyta.js                ← walidacja formularza, tytuł i opis wydarzenia
  maile.js                 ← Resend + szablony w stylu marki
```

Pliki `index.html` i `rezerwacja-prototyp.html` w katalogu głównym to oryginały.
Nic ich już nie używa — zostawione dla porównania, można je usunąć.

## Uruchomienie lokalne

```bash
npm install
npm run dev
```

Uwaga: `npm run dev` serwuje samą stronę. Żeby działały też `/api/*`, użyj:

```bash
npx vercel dev
```

## Zmienne środowiskowe

| Nazwa | Wymagana | Co to |
|---|---|---|
| `GOOGLE_SERVICE_ACCOUNT_JSON` | tak | cała zawartość pliku JSON z kluczem Service Account |
| `GOOGLE_CALENDAR_ID` | tak | adres kalendarza, np. `xoxo.beautylabb@gmail.com` |
| `RESEND_API_KEY` | tak | klucz z resend.com |
| `RESEND_FROM` | nie | nadawca maili, domyślnie `XOXO Beauty Lab <rezerwacje@xoxobeautylab.pl>` |
| `STUDIO_EMAIL` | nie | odbiorca powiadomień, domyślnie `xoxo.beautylabb@gmail.com` |

Wzór: `.env.example`. Plik `.env` jest w `.gitignore` — **nigdy nie trafia do repozytorium.**

## Jak liczone są terminy

1. Bierzemy godziny pracy z `src/config.js` (pt i sob 9–20, nd 10–15, pn–czw zamknięte).
2. Proponujemy starty co 15 min.
3. Każdy termin musi pomieścić **całą wizytę + 10 min bufora** przed zamknięciem.
4. Odrzucamy terminy bliższe niż 12 h od teraz.
5. Odrzucamy terminy kolidujące z **jakimkolwiek** wydarzeniem w kalendarzu —
   również dopisanym ręcznie (rezerwacja telefoniczna, „urlop”, „zajęte”).
   Wydarzenia całodniowe blokują cały dzień.
   Jedyny wyjątek: wydarzenie oznaczone w Google jako „Dostępny/Wolny”.
6. Przy zapisie sprawdzamy dostępność **jeszcze raz**, tuż przed utworzeniem
   wydarzenia — dwie osoby nie zajmą tej samej godziny.

**Wydarzenie w kalendarzu trwa dłużej niż sam zabieg** — o 10 min bufora.
Wizyta 9:00 na 60 min to blok 9:00–10:10. Dzięki temu kolejna klientka
nie może zapisać się „na styk”. W opisie wydarzenia widać prawdziwą długość zabiegów.

## Ceny są liczone na serwerze

Formularz wysyła tylko **id zabiegów**. Ceny i czasy API bierze z `src/config.js`,
więc nikt nie „przeceni” sobie wizyty, grzebiąc w przeglądarce.

## Co zmienić w `src/config.js`

- `GODZINY_PRACY` — `[9, 20]` albo `null` gdy zamknięte
- `DNI_ZAMKNIETE` — pojedyncze dni wolne (`'2026-12-24'`).
  Alternatywnie: całodniowe wydarzenie w Google Calendar działa tak samo.
- `REZERWACJE.bufor / konsultacja / minGodzin / krokSlotu / maxDniNaprzod`
- `KATEGORIE` — cennik. **Nie zmieniaj `id` istniejących zabiegów** po uruchomieniu.

Po zmianie: `git push` → Vercel przebuduje stronę sam.

## Znane ograniczenie

Sprawdzenie dostępności i zapis do kalendarza to dwa osobne żądania do Google
(dzieli je ułamek sekundy). Gdyby dwie osoby kliknęły „Rezerwuję” dokładnie
w tej samej chwili na ten sam slot, teoretycznie obie mogą przejść.
Przy skali jednego studia to sytuacja skrajnie mało prawdopodobna, a Oliwia
zobaczy nakładające się wydarzenia w kalendarzu.
