<?php
/**
 * MDS-Modell – Bestell- und Anfrage-Mailer
 * ----------------------------------------
 * Nimmt Bestellungen (und Werkstatt-Anfragen) aus dem Shop entgegen,
 * prüft sie, berechnet die Preise serverseitig neu und verschickt:
 *   1. eine E-Mail an den Händler (bestell_email aus daten/shop.json)
 *   2. eine Eingangsbestätigung an den Kunden
 * Zusätzlich wird jede Bestellung als Sicherung in /bestellungen abgelegt.
 *
 * Keine Datenbank, kein Zahlungsanbieter – läuft auf jedem PHP-Webspace (ab PHP 7.4).
 */

declare(strict_types=1);
date_default_timezone_set('Europe/Berlin');
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

function antwort(array $daten, int $status = 200): void {
    http_response_code($status);
    echo json_encode($daten, JSON_UNESCAPED_UNICODE);
    exit;
}
function fehler(string $text, int $status = 400): void {
    antwort(['ok' => false, 'fehler' => $text], $status);
}
/** Text für E-Mail säubern (keine Steuerzeichen, Länge begrenzen) */
function sauber($wert, int $max = 200): string {
    $s = trim((string)($wert ?? ''));
    $s = preg_replace('/[\x00-\x09\x0B-\x1F\x7F]/u', '', $s) ?? '';
    return mb_substr($s, 0, $max);
}
/** Für Header: zusätzlich Zeilenumbrüche entfernen (Header-Injection) */
function einzeilig($wert, int $max = 200): string {
    return str_replace(["\r", "\n"], ' ', sauber($wert, $max));
}
function euro(float $n): string {
    return number_format($n, 2, ',', '.') . ' €';
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    fehler('Nur POST erlaubt.', 405);
}

$basis = __DIR__;
$shop = json_decode((string)@file_get_contents($basis . '/daten/shop.json'), true);
$katalog = json_decode((string)@file_get_contents($basis . '/daten/produkte.json'), true);
if (!$shop || !$katalog) {
    fehler('Konfiguration nicht lesbar.', 500);
}

$roh = file_get_contents('php://input');
if (strlen((string)$roh) > 50000) fehler('Anfrage zu groß.');
$in = json_decode((string)$roh, true);
if (!is_array($in)) fehler('Ungültige Daten.');

// Spam-Schutz 1: Honeypot-Feld muss leer sein
if (!empty($in['webseite'])) {
    antwort(['ok' => true, 'bestellnummer' => 'MDS-0']); // Bots nichts verraten
}

// Spam-Schutz 2: max. 5 Sendungen je IP in 10 Minuten
$ablage = $basis . '/bestellungen';
if (!is_dir($ablage)) @mkdir($ablage, 0750, true);
$ipDatei = $ablage . '/.limit-' . hash('sha256', ($_SERVER['REMOTE_ADDR'] ?? '') . 'mds');
$zeiten = array_filter(
    (array)json_decode((string)@file_get_contents($ipDatei), true),
    fn($t) => is_int($t) && $t > time() - 600
);
if (count($zeiten) >= 5) fehler('Zu viele Anfragen. Bitte versuchen Sie es in einigen Minuten erneut oder rufen Sie uns an.', 429);
$zeiten[] = time();
@file_put_contents($ipDatei, json_encode(array_values($zeiten)));

$haendler = $shop['bestell_email'];
$absender = $shop['absender_email'] ?? $haendler;
$firma = $shop['firma'];

/** E-Mail verschicken (Text, UTF-8) */
function mailSenden(string $an, string $betreff, string $text, string $absender, string $absName, string $antwortAn): bool {
    $kopf = [
        'From: ' . mb_encode_mimeheader($absName, 'UTF-8') . ' <' . $absender . '>',
        'Reply-To: ' . $antwortAn,
        'MIME-Version: 1.0',
        'Content-Type: text/plain; charset=UTF-8',
        'Content-Transfer-Encoding: 8bit',
        'X-Mailer: MDS-Shop',
    ];
    return mail($an, mb_encode_mimeheader($betreff, 'UTF-8'), $text, implode("\r\n", $kopf), '-f' . $absender);
}

$typ = $in['typ'] ?? '';

/* =================== Werkstatt-Anfrage =================== */
if ($typ === 'anfrage') {
    $name = einzeilig($in['name'] ?? '', 100);
    $email = einzeilig($in['email'] ?? '', 150);
    $nachricht = sauber($in['nachricht'] ?? '', 5000);
    if ($name === '' || $nachricht === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        fehler('Bitte Name, gültige E-Mail und Nachricht angeben.');
    }
    $text = "Neue Werkstatt-Anfrage über die Website\n"
        . str_repeat('=', 44) . "\n\n"
        . "Leistung: " . sauber($in['leistung'] ?? '', 80) . "\n"
        . "Name:     $name\n"
        . "E-Mail:   $email\n"
        . "Telefon:  " . sauber($in['telefon'] ?? '', 50) . "\n\n"
        . "Nachricht:\n$nachricht\n";
    if (!mailSenden($haendler, "Anfrage: " . einzeilig($in['leistung'] ?? '', 80) . " – $name", $text, $absender, "$firma Website", $email)) {
        fehler('E-Mail konnte nicht versendet werden.', 500);
    }
    antwort(['ok' => true]);
}

/* =================== Widerruf =================== */
if ($typ === 'widerruf') {
    $f = [];
    foreach (['bestellnr', 'bestellt', 'name', 'anschrift', 'email', 'telefon'] as $n) $f[$n] = einzeilig($in[$n] ?? '', 200);
    $f['waren'] = sauber($in['waren'] ?? '', 3000);
    $f['bemerkung'] = sauber($in['bemerkung'] ?? '', 3000);
    if ($f['waren'] === '' || $f['name'] === '' || $f['anschrift'] === '' || $f['bestellt'] === '' || !filter_var($f['email'], FILTER_VALIDATE_EMAIL)) {
        fehler('Bitte alle Pflichtfelder ausfüllen.');
    }
    $zeit = date('d.m.Y, H:i') . ' Uhr';
    $text = "WIDERRUF über das Online-Formular\n" . str_repeat('=', 44) . "\nEingang: $zeit\n\n"
        . "Waren:\n{$f['waren']}\n\nBestell-/Rechnungsnr.: {$f['bestellnr']}\nBestellt/erhalten am: {$f['bestellt']}\n\n"
        . "Name:      {$f['name']}\nAnschrift: {$f['anschrift']}\nE-Mail:    {$f['email']}\nTelefon:   {$f['telefon']}\n\n"
        . ($f['bemerkung'] !== '' ? "Bemerkung:\n{$f['bemerkung']}\n" : '');
    @file_put_contents($ablage . '/widerruf-' . date('Ymd-His') . '-' . random_int(100, 999) . '.json', json_encode($f + ['eingang' => date('c')], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    if (!mailSenden($haendler, "WIDERRUF – {$f['name']}" . ($f['bestellnr'] ? " – {$f['bestellnr']}" : ''), $text, $absender, "$firma Website", $f['email'])) {
        fehler('E-Mail konnte nicht versendet werden.', 500);
    }
    mailSenden($f['email'], "Eingangsbestätigung Ihres Widerrufs – $firma",
        "Guten Tag {$f['name']},\n\nwir bestätigen den Eingang Ihres Widerrufs am $zeit.\n\nWiderrufene Waren:\n{$f['waren']}\n\n"
        . "Bitte senden Sie die Ware an: $firma, {$shop['strasse']}, {$shop['ort']}.\n\nMit freundlichen Grüßen\n$firma · Tel. {$shop['telefon']}\n",
        $absender, $firma, $shop['email']);
    antwort(['ok' => true]);
}

/* =================== Bestellung =================== */
if ($typ !== 'bestellung') fehler('Unbekannter Typ.');

$k = $in['kunde'] ?? [];
$kunde = [];
foreach (['vorname', 'nachname', 'firma', 'strasse', 'plz', 'ort', 'land', 'email', 'telefon', 'kundennr', 'lieferung', 'zahlung'] as $f) {
    $kunde[$f] = einzeilig($k[$f] ?? '', 150);
}
$kunde['bemerkung'] = sauber($k['bemerkung'] ?? '', 3000);

foreach (['vorname', 'nachname', 'strasse', 'plz', 'ort'] as $f) {
    if ($kunde[$f] === '') fehler('Bitte alle Pflichtfelder ausfüllen.');
}
if (!filter_var($kunde['email'], FILTER_VALIDATE_EMAIL)) fehler('Bitte eine gültige E-Mail-Adresse angeben.');
$laender = array_filter(array_keys($shop['versand'] ?? []), fn($l) => $l[0] !== '_');
if (!in_array($kunde['land'], $laender, true)) $kunde['land'] = 'Anderes Land';
if (!in_array($kunde['lieferung'], ['Versand', 'Abholung'], true)) $kunde['lieferung'] = 'Versand';
$zahlarten = ['Vorauskasse', 'Rechnung (Bestandskunde)', 'Barzahlung bei Abholung'];
if (!in_array($kunde['zahlung'], $zahlarten, true)) $kunde['zahlung'] = 'Vorauskasse';
if ($kunde['zahlung'] === 'Barzahlung bei Abholung' && $kunde['lieferung'] !== 'Abholung') $kunde['zahlung'] = 'Vorauskasse';

// Artikel nachschlagen und Preise SERVERSEITIG berechnen (Browser-Preise werden ignoriert)
$produkte = [];
foreach ($katalog['produkte'] as $p) $produkte[$p['id']] = $p;

$positionen = [];
$summe = 0.0;
$summeMin = 0.0; // für Mindestbestellwert: unbekannte Aufpreise mit Grundpreis
$offen = false;
foreach ((array)($in['positionen'] ?? []) as $pos) {
    $id = (string)($pos['id'] ?? '');
    if (!isset($produkte[$id])) continue;
    $p = $produkte[$id];
    if (!empty($p['archiv'])) continue;
    $menge = max(1, min(99, (int)($pos['menge'] ?? 1)));
    $variante = (string)($pos['variante'] ?? '');
    $ep = (float)$p['preis'];
    if (count($p['varianten']) > 0) {
        if (!in_array($variante, $p['varianten'], true)) $variante = $p['varianten'][0];
        $auf = $shop['aufpreis'][$variante] ?? null;
        if ($variante !== $p['varianten'][0]) {
            if ($auf === null) { $ep = null; $offen = true; }
            else $ep += (float)$auf;
        }
    } else {
        $variante = '';
    }
    $positionen[] = [
        'id' => $id, 'name' => $p['name'], 'variante' => $variante, 'menge' => $menge,
        'einzel' => $ep, 'gesamt' => $ep === null ? null : $ep * $menge,
    ];
    if ($ep !== null) $summe += $ep * $menge;
    $summeMin += ($ep ?? (float)$p['preis']) * $menge;
}
if (!$positionen) fehler('Der Warenkorb ist leer.');
if ($summeMin < (float)($shop['mindestbestellwert'] ?? 0)) fehler('Der Mindestbestellwert wurde nicht erreicht.');

$versandkosten = null;
if ($kunde['lieferung'] === 'Abholung') $versandkosten = 0.0;
elseif (isset($shop['versand'][$kunde['land']]) && is_numeric($shop['versand'][$kunde['land']])) $versandkosten = (float)$shop['versand'][$kunde['land']];

$nr = 'MDS-' . date('Ymd') . '-' . random_int(1000, 9999);
$datum = date('d.m.Y, H:i') . ' Uhr';

// ---- Positionstabelle (Text) ----
$tab = '';
foreach ($positionen as $i => $p) {
    $tab .= sprintf("%d) %s\n   Art.-Nr. %s%s\n   %d × %s = %s\n\n",
        $i + 1, $p['name'], strtoupper($p['id']),
        $p['variante'] ? ' · Ausführung: ' . $p['variante'] : '',
        $p['menge'],
        $p['einzel'] === null ? 'Preis auf Anfrage' : euro($p['einzel']),
        $p['gesamt'] === null ? 'wird bestätigt' : euro($p['gesamt'])
    );
}
$tab .= str_repeat('-', 44) . "\n";
$tab .= 'Warensumme:    ' . euro($summe) . ($offen ? ' (zzgl. Aufpreis Digital/Sound, wird bestätigt)' : '') . "\n";
$tab .= 'Versand:       ' . ($versandkosten === null ? 'wird gesondert berechnet' : euro($versandkosten)) . "\n";
if ($versandkosten !== null && !$offen) $tab .= 'Gesamt:        ' . euro($summe + $versandkosten) . "\n";
$tab .= "Alle Preise inkl. gesetzl. MwSt.\n";

$adresse = trim($kunde['vorname'] . ' ' . $kunde['nachname']) . "\n"
    . ($kunde['firma'] ? $kunde['firma'] . "\n" : '')
    . $kunde['strasse'] . "\n" . $kunde['plz'] . ' ' . $kunde['ort'] . "\n" . $kunde['land'];

// ---- Mail an Händler ----
$textH = "NEUE BESTELLUNG $nr\n" . str_repeat('=', 44) . "\nEingegangen: $datum\n\n"
    . "KUNDE\n$adresse\n\nE-Mail:   {$kunde['email']}\nTelefon:  {$kunde['telefon']}\n"
    . 'Kd.-Nr.:  ' . ($kunde['kundennr'] ?: '– (Neukunde?)') . "\n\n"
    . "Lieferung: {$kunde['lieferung']}\nZahlung:   {$kunde['zahlung']}\n\n"
    . "ARTIKEL\n" . str_repeat('-', 44) . "\n$tab\n"
    . ($kunde['bemerkung'] !== '' ? "ANMERKUNG DES KUNDEN\n{$kunde['bemerkung']}\n\n" : '')
    . "→ Bitte Vorausrechnung bzw. Rechnung an den Kunden senden.\n"
    . "   Auf diese E-Mail antworten = Antwort geht direkt an den Kunden.\n";

$okH = mailSenden($haendler, "Bestellung $nr – {$kunde['vorname']} {$kunde['nachname']}", $textH, $absender, "$firma Shop", $kunde['email']);

// ---- Sicherungskopie ----
@file_put_contents($ablage . "/$nr.json", json_encode([
    'nr' => $nr, 'datum' => date('c'), 'kunde' => $kunde, 'positionen' => $positionen,
    'summe' => $summe, 'versand' => $versandkosten, 'mail_haendler_ok' => $okH,
], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

if (!$okH) {
    fehler('Die Bestellung konnte nicht per E-Mail übermittelt werden.', 500);
}

// ---- Eingangsbestätigung an Kunden (§ 312i BGB) ----
$textK = "Guten Tag " . trim($kunde['vorname'] . ' ' . $kunde['nachname']) . ",\n\n"
    . "vielen Dank für Ihre Bestellung bei $firma. Hiermit bestätigen wir den Eingang.\n\n"
    . "Bestellnummer: $nr\nDatum: $datum\n\n"
    . "IHRE ARTIKEL\n" . str_repeat('-', 44) . "\n$tab\n"
    . "Lieferadresse:\n$adresse\n\nLieferung: {$kunde['lieferung']}\nZahlung:   {$kunde['zahlung']}\n\n"
    . "WIE GEHT ES WEITER?\n"
    . ($kunde['zahlung'] === 'Vorauskasse'
        ? "Sie erhalten in Kürze eine Vorausrechnung inkl. Versandkosten und unserer Bankverbindung. Sobald die Zahlung eingegangen ist, versenden wir Ihre Ware.\n"
        : "Wir melden uns in Kürze bei Ihnen und stellen die Ware zusammen.\n")
    . "\nDiese E-Mail ist eine automatische Eingangsbestätigung. Bitte prüfen Sie Ihre Angaben – bei Fehlern antworten Sie einfach auf diese Mail.\n\n"
    . "Unsere AGB und die Widerrufsbelehrung finden Sie unter https://www.mds-modell.eu/#agb und https://www.mds-modell.eu/#widerruf\n\n"
    . "Mit freundlichen Grüßen\n$firma\n{$shop['strasse']}, {$shop['ort']}\nTel. {$shop['telefon']} · {$shop['email']}\n";

mailSenden($kunde['email'], "Ihre Bestellung $nr bei $firma", $textK, $absender, $firma, $shop['email']);

antwort(['ok' => true, 'bestellnummer' => $nr]);
