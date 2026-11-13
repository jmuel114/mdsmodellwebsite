# MDS-Modell – neue Website mit Shop (ohne Online-Zahlung)

## Zwei Betriebsarten (`versandModus` in `daten/shop.json`)
- **`formsubmit`** (aktuell, für GitHub Pages): Bestellungen werden über den kostenlosen Dienst formsubmit.co per E-Mail an `bestell_email` geschickt, der Kunde bekommt automatisch eine Bestätigung. **Beim allerersten Absenden** schickt FormSubmit eine Aktivierungs-Mail an `bestell_email` – dort einmal auf „Activate Form“ klicken. Danach kann man in `formsubmit_ziel` den zufälligen Alias aus der Aktivierungs-Mail eintragen.
- **`php`**: auf eigenem Webspace mit PHP – dann übernimmt `bestellung.php` den Versand (Preise werden serverseitig geprüft, Sicherungskopie jeder Bestellung). Empfohlen für den dauerhaften Betrieb unter mds-modell.eu.

## So funktioniert die Bestellung
1. Kunde legt Artikel in den Warenkorb (wird im Browser gespeichert).
2. Kasse: Adresse, Versand/Abholung, Vorauskasse/Rechnung/Barzahlung → Button **„Zahlungspflichtig bestellen“**.
3. `bestellung.php` prüft alles, rechnet die Preise **auf dem Server neu** und schickt
   - eine E-Mail an den Händler (`bestell_email`), Antworten gehen direkt an den Kunden,
   - eine automatische Eingangsbestätigung an den Kunden.
4. Jede Bestellung wird zusätzlich als Sicherung in `bestellungen/` gespeichert (per `.htaccess` gesperrt).
5. Der Händler schickt die (Voraus-)Rechnung mit Versandkosten wie bisher.

Werkstatt-Anfragen (Seite „Leistungen“) laufen über dasselbe Skript.

## Hochladen
Voraussetzung: normaler Webspace mit **PHP 7.4 oder neuer** und funktionierender `mail()`-Funktion (bei Strato, IONOS, All-Inkl, Hetzner usw. Standard).

1. Den kompletten Ordnerinhalt per FTP ins Hauptverzeichnis laden.
2. Der Ordner `bestellungen/` muss für PHP beschreibbar sein (meist automatisch, sonst Rechte 750/755).
3. Testbestellung durchführen – Mail kommt an `office@mds-modell.eu`.

## Einstellungen – `daten/shop.json`
| Feld | Bedeutung |
|---|---|
| `bestell_email` | Empfänger der Bestellungen |
| `absender_email` | Absender der Mails – **muss eine Adresse der eigenen Domain sein** (z. B. shop@mds-modell.eu), sonst landen Mails im Spam |
| `aufpreis` | Aufpreis für „digital“ und „digital+Sound“ in Euro. `null` = „Aufpreis auf Anfrage“ |
| `versand` | Versandkosten je Land. `null` = „wird mitgeteilt“ |
| `mindestbestellwert` | aktuell 10,00 € |
| `bildBasis` | woher die Produktfotos geladen werden (siehe unten) |

## Artikel pflegen – `daten/produkte.json`
Jeder Artikel: `id` (= Artikelnummer), `name`, `kat`, `preis`, `ab`, `info`, `varianten`, `bild`, `archiv`.
Neuer Artikel = Eintrag kopieren und anpassen. `"archiv": true` → wird als ausverkauft angezeigt und kann nicht bestellt werden.

## Fachhändler & Downloads
- Fachhändler: `daten/haendler.json` (Land, Name, Kontakt, Adresse, E-Mail, Website, Telefon)
- Downloads: `daten/downloads.json`. Die PDFs liegen noch auf der alten Seite – vor dem Abschalten in einen Ordner `downloads/` kopieren und die Links anpassen.

## Produktfotos
Die Fotos werden aktuell noch von der alten Seite geladen (`bildBasis`). **Bevor die alte Seite abgeschaltet wird:**
Ordner `assets/images/` vom alten Contao-Webspace herunterladen, in den neuen Ordner `assets/images/` legen und
`bildBasis` auf `""` setzen. Fehlt ein Foto, erscheint automatisch eine Zeichnung.

## Noch zu erledigen
- [ ] Aufpreise Digital / Digital+Sound in `shop.json` eintragen
- [ ] Versandkosten je Land eintragen (Preisangabenverordnung: sollten vor der Bestellung sichtbar sein)
- [ ] AGB von der alten Seite übernehmen (in `assets/app.js`, Funktion `seiteText`, gelb markiert)
- [ ] Datenschutzerklärung: Abschnitt „Hosting“ (gelb markiert) mit dem tatsächlichen Hoster ergänzen; Datenschutz- und Widerrufstext rechtlich prüfen lassen
- [ ] AGB-Abschnitt „Vertragsschluss“ an Online-Bestellung anpassen (rechtlich prüfen lassen)
- [ ] USt-IdNr. im Impressum ergänzen
