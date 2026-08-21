/* Maile przez Resend — w stylu marki: kremowe tło, złote akcenty, Playfair.
   Uwaga: rezerwacja jest już w kalendarzu ZANIM tu wejdziemy. Jeśli mail się
   nie wyśle, nie kasujemy wizyty — zwracamy tylko informację, że poszło źle. */

import { STUDIO, REZERWACJE } from '../config.js';
import { opisCzasu, opisDaty } from './czas.js';
import { opisTerminu } from './wizyta.js';

const KREM = '#FAF3EC';
const KREM_GLEBOKI = '#F1E5D6';
const INK = '#1C1917';
const INK_MIEKKI = '#4A423B';
const ZLOTO = '#A6864E';
const LINIA = 'rgba(166,134,78,.28)';

const SERIF = "'Playfair Display', Georgia, 'Times New Roman', serif";
const SANS = "'Jost', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif";

function bezpieczny(t) {
  return String(t ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function nadawca() {
  return process.env.RESEND_FROM || `${STUDIO.nazwa} <rezerwacje@xoxobeautylab.pl>`;
}

function adresStudia() {
  return process.env.STUDIO_EMAIL || 'xoxo.beautylabb@gmail.com';
}

/* ---------- wspólne klocki szablonu ---------- */

function koperta(tytul, srodek) {
  return `<!doctype html>
<html lang="pl"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${bezpieczny(tytul)}</title>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500&family=Jost:wght@300;400;500&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background:${KREM};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${KREM};padding:28px 12px;">
<tr><td align="center">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid ${LINIA};">
    <tr><td style="padding:34px 34px 26px;font-family:${SANS};font-weight:300;color:${INK};line-height:1.65;font-size:15px;">
${srodek}
    </td></tr>
  </table>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
    <tr><td style="padding:18px 8px;text-align:center;font-family:${SANS};font-size:12px;color:${INK_MIEKKI};line-height:1.7;">
      ${bezpieczny(STUDIO.nazwa)} · ${bezpieczny(STUDIO.adres)}<br>
      <a href="tel:${bezpieczny(STUDIO.telefon.replace(/\s/g, ''))}" style="color:${ZLOTO};text-decoration:none;">${bezpieczny(STUDIO.telefon)}</a>
      &nbsp;·&nbsp;
      <a href="${STUDIO.www}" style="color:${ZLOTO};text-decoration:none;">${bezpieczny(STUDIO.www.replace('https://', ''))}</a>
    </td></tr>
  </table>
</td></tr></table>
</body></html>`;
}

function naglowek(nadtytul, tytul) {
  return `      <p style="margin:0 0 6px;font-family:${SANS};font-size:11px;letter-spacing:.28em;text-transform:uppercase;color:${ZLOTO};">${bezpieczny(nadtytul)}</p>
      <h1 style="margin:0 0 20px;font-family:${SERIF};font-weight:500;font-size:27px;line-height:1.15;color:${INK};">${bezpieczny(tytul)}</h1>`;
}

function tabelkaWizyty(w) {
  const wiersz = (lewo, prawo) => `
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid ${LINIA};font-family:${SANS};font-size:14px;color:${INK};">${lewo}</td>
          <td style="padding:8px 0;border-bottom:1px solid ${LINIA};font-family:${SANS};font-size:14px;color:${INK};text-align:right;white-space:nowrap;">${prawo}</td>
        </tr>`;

  const zabiegi = w.zabiegi.map((z) => wiersz(
    `${bezpieczny(z.nazwa)} <span style="color:${ZLOTO};font-size:12px;">${bezpieczny(z.technologia)}</span>`,
    `${z.czas} min · ${z.cena} zł`
  )).join('');

  const konsultacja = w.pierwszaWizyta
    ? wiersz('Konsultacja (pierwsza wizyta)', `${REZERWACJE.konsultacja} min · <span style="color:${ZLOTO};">gratis</span>`)
    : '';

  return `      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${KREM_GLEBOKI};padding:0;margin:0 0 24px;">
        <tr><td style="padding:22px 22px 20px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td colspan="2" style="padding:0 0 12px;font-family:${SERIF};font-size:19px;color:${INK};">${bezpieczny(opisDaty(w.data))}<br>
                <span style="font-family:${SANS};font-size:15px;color:${INK_MIEKKI};">godz. ${bezpieczny(w.godzina)} – ${bezpieczny(w.koniec)}</span>
              </td>
            </tr>
            ${zabiegi}
            ${konsultacja}
            <tr>
              <td style="padding:14px 0 0;font-family:${SERIF};font-size:19px;color:${INK};">${bezpieczny(opisCzasu(w.czas))}</td>
              <td style="padding:14px 0 0;font-family:${SERIF};font-size:19px;color:${INK};text-align:right;">${w.cena} zł</td>
            </tr>
          </table>
        </td></tr>
      </table>`;
}

/* ---------- mail do klientki ---------- */

function mailKlientka(w) {
  const mapy = `https://maps.google.com/?q=${encodeURIComponent(STUDIO.adres)}`;
  const srodek = `${naglowek(STUDIO.nazwa, 'Termin zarezerwowany')}
      <p style="margin:0 0 22px;font-family:${SANS};font-size:15px;color:${INK_MIEKKI};">
        ${bezpieczny(w.imie.split(' ')[0])}, dziękujemy! Twoja wizyta jest zapisana — poniżej wszystkie szczegóły.
      </p>
${tabelkaWizyty(w)}
      <p style="margin:0 0 6px;font-family:${SANS};font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:${ZLOTO};">Gdzie</p>
      <p style="margin:0 0 22px;font-family:${SANS};font-size:15px;color:${INK};">
        <a href="${mapy}" style="color:${INK};text-decoration:none;border-bottom:1px solid ${LINIA};">${bezpieczny(STUDIO.adres)}</a>
      </p>
      <p style="margin:0 0 6px;font-family:${SANS};font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:${ZLOTO};">Dobrze wiedzieć</p>
      <p style="margin:0 0 8px;font-family:${SANS};font-size:14px;color:${INK_MIEKKI};">
        Płatność na miejscu. Termin możesz odwołać lub przełożyć do ${REZERWACJE.odwolanieGodzin} h przed wizytą —
        wystarczy telefon na <a href="tel:${bezpieczny(STUDIO.telefon.replace(/\s/g, ''))}" style="color:${ZLOTO};text-decoration:none;">${bezpieczny(STUDIO.telefon)}</a>.
      </p>
      <p style="margin:0;font-family:${SANS};font-size:14px;color:${INK_MIEKKI};">
        Na 2 tygodnie przed zabiegiem nie opalaj okolicy i nie usuwaj włosków z cebulką (wosk, pęseta) — golenie jest w porządku.
      </p>`;

  const tekst = [
    `${STUDIO.nazwa} — termin zarezerwowany`,
    '',
    opisTerminu(w),
    ...w.zabiegi.map((z) => `- ${z.nazwa} (${z.czas} min) — ${z.cena} zł`),
    ...(w.pierwszaWizyta ? [`- konsultacja ${REZERWACJE.konsultacja} min — gratis`] : []),
    `Razem: ${opisCzasu(w.czas)} · ${w.cena} zł`,
    '',
    STUDIO.adres,
    `Płatność na miejscu. Odwołanie do ${REZERWACJE.odwolanieGodzin} h przed wizytą, tel. ${STUDIO.telefon}.`,
  ].join('\n');

  return {
    temat: `Rezerwacja potwierdzona — ${opisDaty(w.data)}, godz. ${w.godzina}`,
    html: koperta('Rezerwacja potwierdzona', srodek),
    tekst,
  };
}

/* ---------- mail do studia ---------- */

function mailStudio(w) {
  const srodek = `${naglowek('Nowa rezerwacja', w.imie)}
${tabelkaWizyty(w)}
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 18px;">
        <tr><td style="padding:0 0 6px;font-family:${SANS};font-size:14px;color:${INK};">
          tel. <a href="tel:${bezpieczny(w.telefon.replace(/\s/g, ''))}" style="color:${ZLOTO};text-decoration:none;">${bezpieczny(w.telefon)}</a>
        </td></tr>
        <tr><td style="padding:0 0 6px;font-family:${SANS};font-size:14px;color:${INK};">
          mail: <a href="mailto:${bezpieczny(w.email)}" style="color:${ZLOTO};text-decoration:none;">${bezpieczny(w.email)}</a>
        </td></tr>
        ${w.pierwszaWizyta ? `<tr><td style="padding:0 0 6px;font-family:${SANS};font-size:14px;color:${ZLOTO};">Pierwsza wizyta — doliczone ${REZERWACJE.konsultacja} min konsultacji.</td></tr>` : ''}
        ${w.uwagi ? `<tr><td style="padding:8px 0 0;font-family:${SANS};font-size:14px;color:${INK_MIEKKI};">Uwagi: ${bezpieczny(w.uwagi)}</td></tr>` : ''}
      </table>
      <p style="margin:0;font-family:${SANS};font-size:13px;color:${INK_MIEKKI};">
        Wizyta jest już wpisana do kalendarza (z ${REZERWACJE.bufor} min przerwy po zabiegu).
      </p>`;

  const tekst = [
    `NOWA REZERWACJA — ${w.imie}`,
    opisTerminu(w),
    ...w.zabiegi.map((z) => `- ${z.nazwa} (${z.czas} min) — ${z.cena} zł`),
    ...(w.pierwszaWizyta ? [`- konsultacja ${REZERWACJE.konsultacja} min (pierwsza wizyta)`] : []),
    `Razem: ${opisCzasu(w.czas)} · ${w.cena} zł`,
    `tel. ${w.telefon}`,
    `mail: ${w.email}`,
    ...(w.uwagi ? [`uwagi: ${w.uwagi}`] : []),
  ].join('\n');

  return {
    temat: `Nowa rezerwacja: ${w.imie} — ${opisDaty(w.data)}, ${w.godzina}`,
    html: koperta('Nowa rezerwacja', srodek),
    tekst,
  };
}

/* ---------- wysyłka ---------- */

async function wyslij({ do: odbiorca, temat, html, tekst, odpowiedzDo }) {
  const klucz = process.env.RESEND_API_KEY;
  if (!klucz) throw new Error('Brak zmiennej RESEND_API_KEY.');

  const odp = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${klucz}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: nadawca(),
      to: [odbiorca],
      subject: temat,
      html,
      text: tekst,
      ...(odpowiedzDo ? { reply_to: odpowiedzDo } : {}),
    }),
  });

  if (!odp.ok) {
    const dane = await odp.json().catch(() => ({}));
    throw new Error(dane?.message || `Resend HTTP ${odp.status}`);
  }
  return true;
}

/**
 * Wysyła oba maile. Nigdy nie rzuca wyjątkiem — zwraca, co się udało.
 */
export async function wyslijMaile(w) {
  const klientka = mailKlientka(w);
  const studio = mailStudio(w);

  const [doKlientki, doStudia] = await Promise.allSettled([
    wyslij({ do: w.email, ...klientka, odpowiedzDo: adresStudia() }),
    wyslij({ do: adresStudia(), ...studio, odpowiedzDo: w.email }),
  ]);

  for (const [kto, wynik] of [['klientki', doKlientki], ['studia', doStudia]]) {
    if (wynik.status === 'rejected') {
      console.error(`[maile] Nie wysłano maila do ${kto}:`, wynik.reason?.message || wynik.reason);
    }
  }

  return {
    klientka: doKlientki.status === 'fulfilled',
    studio: doStudia.status === 'fulfilled',
  };
}
