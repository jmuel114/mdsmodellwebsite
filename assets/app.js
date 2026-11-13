/* MDS-Modell – Shop-Logik (Bestellung wird per E-Mail an den Händler gesendet) */
(function () {
  "use strict";

  var SHOP = null, KAT = [], PROD = [], HAENDLER = [], DOWNLOADS = [], DEMO = false;
  var main = document.getElementById("inhalt");

  /* ---------- Hilfsfunktionen ---------- */
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function euro(n) {
    return n.toLocaleString("de-DE", { style: "currency", currency: "EUR" });
  }
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function speicher(k, v) {
    try {
      if (v === undefined) return JSON.parse(localStorage.getItem(k) || "null");
      localStorage.setItem(k, JSON.stringify(v));
    } catch (e) { return v === undefined ? null : undefined; }
  }
  var toastTimer;
  function toast(html) {
    var t = $("#toast");
    t.innerHTML = html;
    t.classList.add("an");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove("an"); }, 3200);
  }

  /* ---------- Grafiken (Platzhalter, wenn kein Foto lädt) ---------- */
  var SVG_LOK = (function () {
    var D = '<defs>' +
      '<linearGradient id="lkK" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d0151f"/><stop offset=".55" stop-color="#b3101a"/><stop offset="1" stop-color="#930b13"/></linearGradient>' +
      '<linearGradient id="lkD" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9a9a9a"/><stop offset="1" stop-color="#6a6a6a"/></linearGradient>' +
      '<linearGradient id="lkG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4c5a68"/><stop offset=".5" stop-color="#26303a"/><stop offset="1" stop-color="#1a2028"/></linearGradient>' +
      '<linearGradient id="lkF" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#454545"/><stop offset="1" stop-color="#232323"/></linearGradient>' +
      '<radialGradient id="lkL"><stop offset="0" stop-color="#fffbe0"/><stop offset=".5" stop-color="#ffe98a" stop-opacity=".9"/><stop offset="1" stop-color="#ffe98a" stop-opacity="0"/></radialGradient>' +
      "</defs>";
    function stromabnehmer(x, s) { // Einholm-Stromabnehmer, s = 1 oder -1 (Richtung)
      return '<g stroke="#4a4a4a" stroke-width="3.2" fill="none" stroke-linecap="round" stroke-linejoin="round">' +
        '<path d="M' + x + ' 56 L' + (x + 30 * s) + ' 36 L' + (x + 4 * s) + ' 19"/>' +
        '<path d="M' + (x + 8 * s) + ' 56 L' + (x + 30 * s) + ' 40" stroke-width="2"/></g>' +
        '<rect x="' + (x + 4 * s - 22) + '" y="15" width="44" height="4" rx="2" fill="#3a3a3a"/>' +
        '<rect x="' + (x - 10) + '" y="55" width="20" height="5" rx="1.5" fill="#5a5a5a"/>';
    }
    function lueftung(x) {
      var o = '<rect x="' + x + '" y="90" width="44" height="40" rx="2" fill="#8a0b12"/>';
      for (var y = 94; y < 128; y += 4.2) o += '<rect x="' + (x + 3) + '" y="' + y.toFixed(1) + '" width="38" height="2" fill="#6d080e"/>';
      return o;
    }
    function rad(x) {
      return '<g class="rad"><circle cx="' + x + '" cy="216" r="17" fill="#1b1b1b" stroke="#8a8a8a" stroke-width="2.5"/>' +
        '<circle cx="' + x + '" cy="216" r="12" fill="none" stroke="#3a3a3a" stroke-width="1.5"/>' +
        '<line x1="' + (x - 11) + '" y1="216" x2="' + (x + 11) + '" y2="216" stroke="#7a7a7a" stroke-width="2.4"/>' +
        '<line x1="' + x + '" y1="205" x2="' + x + '" y2="227" stroke="#7a7a7a" stroke-width="2.4"/>' +
        '<circle cx="' + x + '" cy="216" r="4" fill="#a8a8a8"/></g>';
    }
    function drehgestell(x) {
      return '<rect x="' + x + '" y="192" width="150" height="20" rx="5" fill="url(#lkF)"/>' +
        '<rect x="' + (x + 60) + '" y="188" width="30" height="10" rx="2" fill="#2f2f2f"/>' +
        '<g fill="#555">' + [x + 22, x + 102].map(function (sx) {
          return '<rect x="' + sx + '" y="194" width="26" height="4" rx="1"/><rect x="' + sx + '" y="200" width="26" height="4" rx="1"/>';
        }).join("") + "</g>";
    }
    return '<svg viewBox="0 0 640 250" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="RhB-Elektrolokomotive Ge 4/4 II">' + D +
      '<line class="draht" x1="0" y1="14" x2="640" y2="14" stroke="#8a8a8a" stroke-width="2"/>' +
      stromabnehmer(190, 1) + stromabnehmer(450, -1) +
      // Dach mit Aufbauten
      '<rect x="66" y="58" width="508" height="17" rx="7" fill="url(#lkD)"/>' +
      '<rect x="240" y="48" width="160" height="12" rx="3" fill="#7d7d7d"/><rect x="250" y="44" width="40" height="6" rx="2" fill="#8c8c8c"/><rect x="350" y="44" width="40" height="6" rx="2" fill="#8c8c8c"/>' +
      '<g fill="#bdbdbd">' + [300, 320, 340].map(function (x) { return '<rect x="' + x + '" y="40" width="6" height="9" rx="2"/>'; }).join("") + "</g>" +
      // Kasten
      '<path d="M42 188 L42 100 Q44 76 72 74 L568 74 Q596 76 598 100 L598 188 Z" fill="url(#lkK)"/>' +
      '<path d="M42 100 Q44 76 72 74 L568 74 Q596 76 598 100" fill="none" stroke="#e8414a" stroke-width="1.5" opacity=".6"/>' +
      // Führerstände: Fenster + Türen
      '<path d="M52 88 L96 88 L96 122 L52 122 Q50 105 52 88 Z" fill="url(#lkG)"/>' +
      '<path d="M588 88 L544 88 L544 122 L588 122 Q590 105 588 88 Z" fill="url(#lkG)"/>' +
      '<rect x="104" y="84" width="30" height="78" rx="3" fill="none" stroke="#7d0a10" stroke-width="2"/><rect x="110" y="90" width="18" height="26" rx="2" fill="url(#lkG)"/>' +
      '<rect x="506" y="84" width="30" height="78" rx="3" fill="none" stroke="#7d0a10" stroke-width="2"/><rect x="512" y="90" width="18" height="26" rx="2" fill="url(#lkG)"/>' +
      '<rect x="116" y="128" width="6" height="2" fill="#ddd"/><rect x="518" y="128" width="6" height="2" fill="#ddd"/>' +
      // Lüftungsgitter
      [150, 204, 258, 338, 392, 446].map(lueftung).join("") +
      '<rect x="306" y="96" width="28" height="18" rx="2" fill="#e9e4d8"/><rect x="309" y="99" width="22" height="12" rx="1" fill="#c8c1b1"/>' +
      // Zierlinie & Schürze
      '<rect x="42" y="148" width="556" height="3" fill="#f3f0ea" opacity=".9"/>' +
      '<rect x="42" y="172" width="556" height="16" fill="#7e0a11"/>' +
      // Lampen
      '<g class="licht"><circle cx="592" cy="162" r="10" fill="url(#lkL)"/><circle cx="592" cy="162" r="3.8" fill="#fffbe6"/>' +
      '<circle cx="48" cy="162" r="3.6" fill="#ff4b3e"/></g>' +
      // Rahmen, Puffer, Kupplung
      '<rect x="46" y="188" width="548" height="9" fill="#262626"/>' +
      '<rect x="30" y="180" width="14" height="10" rx="2" fill="#3a3a3a"/><rect x="596" y="180" width="14" height="10" rx="2" fill="#3a3a3a"/>' +
      '<rect x="24" y="178" width="6" height="14" rx="1.5" fill="#555"/><rect x="610" y="178" width="6" height="14" rx="1.5" fill="#555"/>' +
      drehgestell(98) + drehgestell(392) +
      [135, 215, 429, 509].map(rad).join("") +
      '<g class="gleis"><rect x="0" y="233" width="640" height="4" fill="#c9cdd2"/><rect x="0" y="237" width="640" height="2" fill="#8d9298"/>' +
      '<g fill="#5b4535">' + Array.apply(null, Array(20)).map(function (_, i) { return '<rect x="' + (i * 33 + 4) + '" y="239" width="20" height="7"/>'; }).join("") + "</g></g>" +
      "</svg>";
  })();

  var SVG_WAGEN =
    '<svg viewBox="0 0 640 250" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Güterwagen">' +
    '<rect x="50" y="62" width="540" height="12" rx="5" fill="#8a8378"/>' +
    '<rect x="44" y="72" width="552" height="112" rx="4" fill="#7d1d1f"/>' +
    '<g stroke="#5e1517" stroke-width="3">' + [112, 184, 256, 320, 384, 456, 528].map(function (x) { return '<line x1="' + x + '" y1="76" x2="' + x + '" y2="180"/>'; }).join("") + "</g>" +
    '<rect x="44" y="184" width="552" height="12" fill="#2a2622"/>' +
    '<g fill="#3a3631"><rect x="100" y="192" width="120" height="20" rx="4"/><rect x="420" y="192" width="120" height="20" rx="4"/></g>' +
    '<g fill="#1c1a17" stroke="#7a736a" stroke-width="3">' + [128, 192, 448, 512].map(function (x) { return '<circle cx="' + x + '" cy="214" r="16"/>'; }).join("") + "</g>" +
    '<rect x="0" y="233" width="640" height="5" fill="#cfc8bb"/></svg>';

  var SVG_TEIL =
    '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Zubehör">' +
    '<g fill="none" stroke="#2f6b3f" stroke-width="10" stroke-linejoin="round">' +
    '<circle cx="100" cy="100" r="44"/><circle cx="100" cy="100" r="16" fill="#2f6b3f"/></g>' +
    '<g fill="#2f6b3f">' + [0, 45, 90, 135, 180, 225, 270, 315].map(function (a) {
      return '<rect x="92" y="34" width="16" height="22" rx="3" transform="rotate(' + a + ' 100 100)"/>';
    }).join("") + "</g></svg>";

  var SVG_LATERNE =
    '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Weichenlaterne">' +
    '<rect x="94" y="120" width="12" height="60" fill="#3a3631"/><rect x="70" y="176" width="60" height="10" rx="2" fill="#3a3631"/>' +
    '<rect x="62" y="44" width="76" height="80" rx="8" fill="#2a2622"/><rect x="88" y="26" width="24" height="20" rx="3" fill="#2a2622"/>' +
    '<circle cx="100" cy="84" r="26" fill="#f6f1e6"/><path d="M84 84 h26 m-10 -10 l12 10 -12 10" stroke="#1c1a17" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  function ersatzSvg(p) {
    if (p.kat === "n-loks" || (p.kat === "archiv" && /Elok/.test(p.name))) return SVG_LOK;
    if (p.kat === "n-wagen" || /wagen/i.test(p.name)) return SVG_WAGEN;
    if (p.kat === "g-laternen") return SVG_LATERNE;
    return SVG_TEIL;
  }
  function bildHtml(p) {
    var ersatz = '<div class="ersatz">' + ersatzSvg(p) + "</div>";
    if (DEMO || !p.bild) return ersatz;
    var src = /^https?:/.test(p.bild) ? p.bild : (SHOP.bildBasis || "") + p.bild;
    return '<img src="' + esc(src) + '" alt="' + esc(p.name) + '" loading="lazy" data-ersatz="' + p.id + '">';
  }
  document.addEventListener("error", function (e) {
    var img = e.target;
    if (img.tagName === "IMG" && img.dataset.ersatz) {
      var p = finde(img.dataset.ersatz);
      var d = document.createElement("div");
      d.className = "ersatz";
      d.innerHTML = ersatzSvg(p);
      img.replaceWith(d);
    }
  }, true);

  /* ---------- Katalog ---------- */
  function finde(id) { for (var i = 0; i < PROD.length; i++) if (PROD[i].id === id) return PROD[i]; return null; }
  function kat(id) { for (var i = 0; i < KAT.length; i++) if (KAT[i].id === id) return KAT[i]; return null; }
  function spurVon(p) { var k = kat(p.kat); return k ? k.spur : ""; }
  function artNr(p) { return p.id.toUpperCase(); }

  /** Preis für Variante; null = Aufpreis auf Anfrage */
  function preisFuer(p, variante) {
    if (!variante || !p.varianten.length) return p.preis;
    var auf = SHOP.aufpreis ? SHOP.aufpreis[variante] : 0;
    if (auf === null || auf === undefined) return variante === p.varianten[0] ? p.preis : null;
    return p.preis + Number(auf);
  }
  function preisAnzeige(p) {
    var ab = p.ab || p.varianten.length > 1;
    return (ab ? "<small>ab</small>" : "") + euro(p.preis);
  }

  function marke(p) {
    if (p.archiv) return '<span class="marke a">Archiv</span>';
    var s = spurVon(p);
    return s ? '<span class="marke ' + s.toLowerCase() + '">Spur ' + s + "</span>" : "";
  }

  function karte(p) {
    var unten = p.archiv
      ? '<span class="ausverkauft">Ausverkauft</span><span class="preis" style="color:var(--grau-h);font-size:1.1rem">' + euro(p.preis) + "</span>"
      : '<span class="preis">' + preisAnzeige(p) + '</span><span class="mwst-k">inkl. MwSt., zzgl. Versand</span>';
    return '<a class="karte" href="#p-' + p.id + '">' +
      '<div class="bild">' + marke(p) + bildHtml(p) + "</div>" +
      '<div class="karte-text"><span class="artnr">Art.-Nr. ' + esc(artNr(p)) + "</span>" +
      "<h3>" + esc(p.name) + "</h3>" +
      (p.info ? '<p class="info">' + esc(p.info) + "</p>" : "") +
      (p.varianten.length > 1 && !p.archiv ? '<span class="chips-var"><span>analog</span><span>digital</span><span>digital + Sound</span></span>' : "") +
      '<div class="preiszeile">' + unten + '</div><span class="details">Details</span></div></a>';
  }

  /* ---------- Warenkorb ---------- */
  var KORB = speicher("mds-korb") || [];
  function korbSpeichern() { speicher("mds-korb", KORB); korbZaehler(); }
  function korbAnzahl() { return KORB.reduce(function (s, z) { return s + z.menge; }, 0); }
  function korbZaehler(puls) {
    var el = $("#korbZahl"), n = korbAnzahl();
    el.textContent = n;
    var kt = $("#korbText");
    if (kt && PROD.length) { var ks = korbSumme(); kt.textContent = n + " Artikel | " + euro(ks.summe); }
    el.classList.toggle("null", n === 0);
    if (puls) { el.classList.remove("puls"); void el.offsetWidth; el.classList.add("puls"); }
  }
  function inKorb(id, variante, menge) {
    var key = id + "|" + (variante || "");
    var z = KORB.filter(function (x) { return x.id + "|" + (x.variante || "") === key; })[0];
    if (z) z.menge = Math.min(99, z.menge + menge);
    else KORB.push({ id: id, variante: variante || "", menge: menge });
    korbSpeichern();
    korbZaehler(true);
    var p = finde(id);
    toast("✓ " + esc(p.name.length > 40 ? p.name.slice(0, 38) + "…" : p.name) + ' im Warenkorb <a href="#warenkorb">Ansehen</a>');
  }
  function korbPositionen() {
    return KORB.map(function (z) {
      var p = finde(z.id);
      if (!p || p.archiv) return null;
      var ep = preisFuer(p, z.variante);
      // Aufpreis unbekannt: Grundpreis anzeigen und rechnen, Vermerk „zzgl. Aufpreis auf Anfrage“
      var auf = ep === null;
      var e = auf ? p.preis : ep;
      return { z: z, p: p, ep: e, aufpreis: auf, summe: e * z.menge };
    }).filter(Boolean);
  }
  function korbSumme() {
    var pos = korbPositionen(), s = 0, smin = 0, offen = false;
    pos.forEach(function (x) {
      if (x.aufpreis) offen = true;
      s += x.summe; smin += x.summe;
    });
    return { pos: pos, summe: s, summeMin: smin, offen: offen };
  }

  /* ---------- Seiten ---------- */
  function vorteile() { return (
    '<div class="vorteile wrap" style="padding:0;max-width:none">' +
    '<div><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 7h16v12H4zM8 7V5h8v2"/></svg><span><b>Eigene Sonderserien</b>RhB-Modelle aus Auenwald</span></div>' +
    '<div><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 8h16v8H4zM8 8V5M12 8V5M16 8V5M8 16v3M12 16v3M16 16v3"/></svg><span><b>Service</b>Digitalumbau &amp; Decoder</span></div>' +
    '<div><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 7h11v9H3zM14 10h4l3 3v3h-7"/><circle cx="7" cy="18" r="1.6"/><circle cx="17" cy="18" r="1.6"/></svg><span><b>Versand mit DHL</b>Oder Abholung in Auenwald</span></div>' +
    '<div><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/></svg><span><b>Persönliche Beratung</b>' + esc(SHOP.ansprechpartner || SHOP.inhaber) + " · " + esc(SHOP.telefon) + "</span></div>" +
    "</div>"); }

  function seiteStart() {
    var neu = PROD.filter(function (p) { return !p.archiv; });
    var auswahl = ["mds-60015", "mds-60014", "id-21006", "avm-1655-100"].map(finde).filter(Boolean);
    var nAnz = neu.filter(function (p) { return spurVon(p) === "N"; }).length;
    var gAnz = neu.filter(function (p) { return spurVon(p) === "G"; }).length;
    return '<section class="hero"><div class="hero-schleier"></div><div class="wrap hero-in"><div>' +
      '<span class="ueber"><span class="etikett">Herzlich Willkommen bei mds-modell.eu</span></span>' +
      '<h1><span class="etikett">Die Rhätische Bahn in Spur N</span></h1>' +
      '<p><span class="etikett">Eigene Sonderserien der Ge 4/4 II – analog, digital oder mit Sound. Dazu Kupplungen, Weichenlaternen und Ersatzteile für die Gartenbahn.</span></p>' +
      '<div class="knoepfe"><a class="btn" href="#spur-n">Spur N entdecken</a><a class="btn btn-2" href="#spur-g">Zubehör Spur G</a></div>' +
      "</div></div>" +
      '<div class="hero-strecke" aria-hidden="true"><div class="hero-masten"></div><div class="hero-draht"></div><div class="hero-gleis"></div><div class="hero-zug">' + SVG_LOK + "</div></div></section>" +
      vorteile() +
      '<section class="band"><div class="wrap">' +
      '<div class="kopfzeile"><div><span class="ueberzeile">Sortiment</span><h2>Zwei Spurweiten, eine Leidenschaft</h2></div></div>' +
      '<div class="spuren">' +
      '<a class="spur" href="#spur-n"><div class="spur-schild">N</div><div><h3>Spur N · 1:160</h3><p>RhB-Elloks Ge 4/4 II in limitierten Sonderserien und SBB-Getreidewagen.</p><ul><li>' + nAnz + " Artikel</li><li>analog / digital / Sound</li></ul></div></a>" +
      '<a class="spur" href="#spur-g"><div class="spur-schild">G</div><div><h3>Spur G · Gartenbahn</h3><p>S-KuPLiX – die smarte Kupplung, Weichenlaternen und Zahnradsätze für LGB.</p><ul><li>' + gAnz + " Artikel</li><li>Eigenproduktion</li></ul></div></a>" +
      "</div></div></section>" +
      '<section class="band band-weiss"><div class="wrap">' +
      '<div class="kopfzeile"><div><span class="ueberzeile">Aktuell lieferbar</span><h2>Aus unserem Programm</h2></div><a class="btn btn-2" href="#shop">Alle Artikel</a></div>' +
      '<div class="raster">' + auswahl.map(karte).join("") + "</div></div></section>" +
      '<section class="band"><div class="wrap">' +
      '<div class="kopfzeile"><div><span class="ueberzeile">Werkstatt</span><h2>Wir bauen um, lackieren und programmieren</h2></div>' +
      "<p>Digitalumbauten in allen Spurweiten und Baugrößen, individuelle Beschriftungen und Decoderprogrammierung für Zimo und ESU.</p></div>" +
      leistungenKarten() +
      '<p style="margin-top:24px"><a class="btn" href="#leistungen">Umbau anfragen</a></p>' +
      "</div></section>";
  }

  var LEIST = [
    ["Digitalumbauten", "In allen Spurweiten und Baugrößen – vom einfachen Decoder-Einbau bis zum kompletten Sound-Umbau.", '<path d="M4 8h16v8H4zM8 8V5M12 8V5M16 8V5M8 16v3M12 16v3M16 16v3"/>', ""],
    ["Decoderprogrammierung", "Individuelle Programmierung von Zimo- und ESU-Decodern: Fahrverhalten, Funktionen, Sound.", '<path d="M4 6h16M4 12h10M4 18h7"/><circle cx="18" cy="15" r="3"/>', ""],
    ["Umlackierung & Beschriftung", "Umlackierungen und individuelle Beschriftungen in allen Baugrößen – Ihr Wunschmodell als Einzelstück.", '<path d="M14 4l6 6-9 9H5v-6z"/><path d="M12 6l6 6"/>', ""],
    ["Servo-Entkupplung", "Servogesteuerte Entkupplung für die Gartenbahn, passend zu unseren S-KuPLiX-Kupplungen.", '<circle cx="12" cy="12" r="7"/><path d="M12 5v7l4 2"/>', "Neu"]
  ];
  function leistungenKarten() {
    return '<div class="leist">' + LEIST.map(function (l) {
      return '<div class="leist-k">' + (l[3] ? '<span class="neu">' + l[3] + "</span>" : "") +
        '<div class="ic"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + l[2] + "</svg></div>" +
        "<h3>" + l[0] + "</h3><p>" + l[1] + "</p></div>";
    }).join("") + "</div>";
  }

  var shopZustand = { q: "", sort: "standard" };
  function seiteShop(filter) {
    // filter: {typ:'alle'|'spur'|'kat', wert}
    var titel = "Alle Artikel", text = "Unser komplettes lieferbares Programm.", liste;
    if (filter.typ === "spur") {
      titel = "Spur " + filter.wert;
      text = filter.wert === "N" ? "Maßstab 1:160 – RhB-Lokomotiven und Güterwagen." : "Gartenbahn – Kupplungen, Laternen, Ersatzteile.";
      liste = PROD.filter(function (p) { return !p.archiv && spurVon(p) === filter.wert; });
    } else if (filter.typ === "kat") {
      var k = kat(filter.wert);
      titel = (k.spur ? "Spur " + k.spur + " · " : "") + k.name;
      text = k.text;
      liste = PROD.filter(function (p) { return p.kat === filter.wert; });
    } else {
      liste = PROD.filter(function (p) { return !p.archiv; });
    }

    var seiten = '<aside class="seitenleiste">' +
      '<h4>Übersicht</h4><a href="#shop" class="' + (filter.typ === "alle" ? "aktiv" : "") + '">Alle Artikel <span>' + PROD.filter(function (p) { return !p.archiv; }).length + "</span></a>" +
      ["N", "G"].map(function (s) {
        return "<h4>Spur " + s + "</h4>" +
          '<a href="#spur-' + s.toLowerCase() + '" class="' + (filter.typ === "spur" && filter.wert === s ? "aktiv" : "") + '">Alles in Spur ' + s + "</a>" +
          KAT.filter(function (k) { return k.spur === s; }).map(function (k) {
            var n = PROD.filter(function (p) { return p.kat === k.id; }).length;
            return '<a href="#kat-' + k.id + '" class="' + (filter.wert === k.id ? "aktiv" : "") + '">' + esc(k.name) + " <span>" + n + "</span></a>";
          }).join("");
      }).join("") +
      '<h4>Weiteres</h4><a href="#kat-archiv" class="' + (filter.wert === "archiv" ? "aktiv" : "") + '">Archiv <span>' + PROD.filter(function (p) { return p.archiv; }).length + "</span></a>" +
      "</aside>";

    return '<div class="wrap shop">' + seiten + "<section>" +
      '<div class="brot"><a href="#start">Start</a> › <a href="#shop">Shop</a>' + (filter.typ !== "alle" ? " › " + esc(titel) : "") + "</div>" +
      "<h1>" + esc(titel) + '</h1><p style="color:var(--grau);margin-top:-6px">' + esc(text) + "</p>" +
      (filter.wert === "archiv" ? '<div class="hinweisbox grau">Diese Sonderserien sind ausverkauft und können nicht mehr bestellt werden. Fragen Sie gern nach Restbeständen.</div>' : "") +
      '<div class="werkzeug"><div class="suche"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>' +
      '<input type="text" id="suche" placeholder="Suchen: Name, Nummer, „Ilanz“…" value="' + esc(shopZustand.q) + '" aria-label="Artikel suchen"></div>' +
      '<select id="sort" aria-label="Sortierung"><option value="standard">Sortierung: Empfohlen</option><option value="auf">Preis aufsteigend</option><option value="ab">Preis absteigend</option><option value="name">Name A–Z</option></select></div>' +
      '<div class="raster" id="raster"></div></section></div>' +
      "<!--LISTE:" + encodeURIComponent(JSON.stringify(liste.map(function (p) { return p.id; }))) + "-->";
  }
  function shopListeZeichnen(ids) {
    var q = shopZustand.q.trim().toLowerCase();
    var liste = ids.map(finde).filter(function (p) {
      return !q || (p.name + " " + p.id + " " + (p.info || "")).toLowerCase().indexOf(q) >= 0;
    });
    if (shopZustand.sort === "auf") liste.sort(function (a, b) { return a.preis - b.preis; });
    if (shopZustand.sort === "ab") liste.sort(function (a, b) { return b.preis - a.preis; });
    if (shopZustand.sort === "name") liste.sort(function (a, b) { return a.name.localeCompare(b.name, "de"); });
    $("#raster").innerHTML = liste.length ? liste.map(karte).join("") :
      '<div class="leer" style="grid-column:1/-1">Keine Artikel gefunden. <button class="link-btn" id="sucheLeeren">Suche zurücksetzen</button></div>';
    var l = $("#sucheLeeren");
    if (l) l.onclick = function () { shopZustand.q = ""; $("#suche").value = ""; shopListeZeichnen(ids); };
  }

  function seiteProdukt(p) {
    if (!p) return seite404();
    var k = kat(p.kat);
    var hatVar = p.varianten.length > 1;
    var varHtml = "";
    if (hatVar && !p.archiv) {
      varHtml = '<div class="variante"><label>Ausführung</label><div class="wahl" role="radiogroup">' +
        p.varianten.map(function (v, i) {
          var pr = preisFuer(p, v);
          return '<label><input type="radio" name="var" value="' + esc(v) + '"' + (i === 0 ? " checked" : "") + '><b>' + esc(v) + "</b><span>" +
            (pr === null ? euro(p.preis) + "<br><small>zzgl. Aufpreis auf Anfrage</small>" : euro(pr)) + "</span></label>";
        }).join("") + "</div></div>";
    }
    var kauf = p.archiv
      ? '<div class="hinweisbox grau"><b>Ausverkauft.</b> Diese Sonderserie ist nicht mehr lieferbar. Fragen Sie gern nach Restbeständen: <a href="#kontakt">Kontakt</a></div>'
      : varHtml + '<div class="kauf"><div class="menge"><button type="button" data-m="-1" aria-label="weniger">−</button><input id="menge" type="number" min="1" max="99" value="1" aria-label="Menge"><button type="button" data-m="1" aria-label="mehr">+</button></div>' +
        '<button class="btn" id="inKorb">In den Warenkorb</button></div>' +
        '<div class="hinweisbox gelb" id="aufpreisHinweis" style="display:none">Für diese Ausführung bestätigen wir Ihnen den genauen Preis mit der Vorausrechnung. Sie können die Bestellung dann noch ablehnen.</div>';
    return '<div class="wrap"><div class="brot" style="margin-top:24px"><a href="#start">Start</a> › <a href="#shop">Shop</a> › <a href="#kat-' + k.id + '">' + esc((k.spur ? "Spur " + k.spur + " · " : "") + k.name) + "</a></div>" +
      '<div class="detail" style="padding-top:8px"><div><div class="bild zoombild" id="zoombild" title="Zum Vergrößern klicken">' + marke(p) + bildHtml(p) +
      '<button type="button" class="lupe-btn" id="lupeBtn" aria-label="Bild groß anzeigen"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4M11 8v6M8 11h6"/></svg></button></div>' +
      '<p class="zoom-hinweis">Mit der Maus über das Bild fahren für die Lupe – klicken für die Großansicht.</p></div>' +
      '<div><span class="artnr">Art.-Nr. ' + esc(artNr(p)) + "</span><h1>" + esc(p.name) + "</h1>" +
      '<div class="preis" id="dPreis">' + preisAnzeige(p) + '</div><p class="mwst">inkl. MwSt., zzgl. <a href="#versand">Versandkosten</a></p>' +
      kauf +
      '<dl class="fakten">' +
      "<div><dt>Spurweite</dt><dd>" + (k.spur === "N" || /^N-/.test(p.name) ? "N (1:160)" : k.spur === "G" ? "G (Gartenbahn)" : "N (1:160)") + "</dd></div>" +
      "<div><dt>Kategorie</dt><dd>" + esc(k.name) + "</dd></div>" +
      (p.info ? "<div><dt>Ausführung</dt><dd>" + esc(p.info) + "</dd></div>" : "") +
      (hatVar ? "<div><dt>Varianten</dt><dd>" + esc(p.varianten.join(" · ")) + "</dd></div>" : "") +
      (!p.archiv ? "<div><dt>Lieferzeit</dt><dd>" + esc(SHOP.lieferzeit) + "</dd></div>" : "") +
      "</dl>" +
      '<div style="margin-top:24px"><p style="margin-bottom:8px"><b>Fragen zu diesem Artikel?</b> Wir beraten Sie gern.</p>' + ansprechHtml(true) + "</div>" +
      "</div></div>" +
      aehnliche(p) + "</div>";
  }
  function aehnliche(p) {
    var l = PROD.filter(function (x) { return x.kat === p.kat && x.id !== p.id && !x.archiv; }).slice(0, 4);
    if (!l.length) return "";
    return '<section style="padding-bottom:60px"><h2>Passend dazu</h2><div class="raster">' + l.map(karte).join("") + "</div></section>";
  }

  function seiteKorb() {
    var r = korbSumme();
    if (!r.pos.length) {
      return '<div class="wrap seite"><h1>Warenkorb</h1><div class="leer"><p>Ihr Warenkorb ist leer.</p><a class="btn" href="#shop">Zum Shop</a></div></div>';
    }
    var min = SHOP.mindestbestellwert || 0;
    return '<div class="wrap seite"><h1>Warenkorb</h1><div class="korb"><div class="zeilen">' +
      r.pos.map(function (x, i) {
        return '<div class="zeile"><div class="bild">' + bildHtml(x.p) + '</div><div class="zt"><h3><a href="#p-' + x.p.id + '">' + esc(x.p.name) + "</a></h3>" +
          '<span class="artnr">Art.-Nr. ' + esc(artNr(x.p)) + (x.z.variante ? " · " + esc(x.z.variante) : "") + "</span><br>" +
          '<span class="artnr">Einzelpreis: ' + euro(x.ep) + "</span>" + (x.aufpreis ? '<span class="aufpreis-hinweis">zzgl. Aufpreis auf Anfrage</span>' : "") + "<br>" +
          '<button class="link-btn" data-weg="' + i + '">Entfernen</button></div>' +
          '<div class="menge"><button type="button" data-z="' + i + '" data-m="-1" aria-label="weniger">−</button><input type="number" min="1" max="99" value="' + x.z.menge + '" data-zi="' + i + '" aria-label="Menge"><button type="button" data-z="' + i + '" data-m="1" aria-label="mehr">+</button></div>' +
          '<div class="sum">' + euro(x.summe) + (x.aufpreis ? "*" : "") + "</div></div>";
      }).join("") +
      "</div>" + summenBox(r, true) + "</div></div>";
  }
  function summenBox(r, mitKnopf) {
    var min = SHOP.mindestbestellwert || 0;
    var unterMin = r.summeMin < min;
    return '<aside class="summe"><h3>Übersicht</h3>' +
      '<div class="z"><span>Zwischensumme</span><span>' + euro(r.summe) + (r.offen ? "*" : "") + "</span></div>" +
      '<div class="z"><span>Versand</span><span>' + versandText() + "</span></div>" +
      '<div class="z gesamt"><span>Summe</span><span>' + euro(r.summe) + (r.offen ? "*" : "") + "</span></div>" +
      '<p class="klein">Alle Preise inkl. gesetzl. MwSt.' + (r.offen ? "<br>* zzgl. Aufpreis auf Anfrage für die Digital-/Sound-Ausführung – wir nennen Ihnen den genauen Preis mit der Rechnung." : "") + "</p>" +
      (unterMin ? '<div class="hinweisbox">Mindestbestellwert: ' + euro(min) + "</div>" : "") +
      (mitKnopf ? '<a class="btn btn-gross" href="#kasse"' + (unterMin ? ' aria-disabled="true" style="pointer-events:none;opacity:.45"' : "") + ">Zur Kasse</a>" +
        "" : "") +
      "</aside>";
  }
  function versandText(land) {
    var v = SHOP.versand || {};
    if (land && typeof v[land] === "number") return euro(v[land]);
    return "wird mitgeteilt";
  }

  function seiteKasse() {
    var r = korbSumme();
    if (!r.pos.length) { location.hash = "#warenkorb"; return ""; }
    if (r.summeMin < (SHOP.mindestbestellwert || 0)) { location.hash = "#warenkorb"; return ""; }
    var d = speicher("mds-kunde") || {};
    function f(name, label, typ, pflicht, extra) {
      return '<div class="feld" data-f="' + name + '"><label for="f-' + name + '">' + label + (pflicht ? " *" : "") + "</label>" +
        '<input id="f-' + name + '" name="' + name + '" type="' + (typ || "text") + '"' + (pflicht ? " required" : "") + ' value="' + esc(d[name] || "") + '" ' + (extra || "") + ">" +
        '<div class="fehltext">Bitte ausfüllen.</div></div>';
    }
    var laender = Object.keys(SHOP.versand || {}).filter(function (k) { return k.charAt(0) !== "_"; });
    return '<div class="wrap seite"><div class="brot"><a href="#warenkorb">Warenkorb</a> › Bestellung</div><h1>Bestellung abschließen</h1>' +
      '<form class="kasse" id="kasseForm" novalidate><div>' +
      '<div class="block"><h2><i>1</i>Ihre Adresse</h2>' +
      '<div class="zwei">' + f("vorname", "Vorname", "text", true, 'autocomplete="given-name"') + f("nachname", "Nachname", "text", true, 'autocomplete="family-name"') + "</div>" +
      f("firma", "Firma (optional)", "text", false, 'autocomplete="organization"') +
      f("strasse", "Straße und Hausnummer", "text", true, 'autocomplete="street-address"') +
      '<div class="drei">' + f("plz", "PLZ", "text", true, 'autocomplete="postal-code" inputmode="numeric"') + f("ort", "Ort", "text", true, 'autocomplete="address-level2"') + "</div>" +
      '<div class="feld" data-f="land"><label for="f-land">Land *</label><select id="f-land" name="land">' +
      laender.map(function (l) { return "<option" + (d.land === l ? " selected" : "") + ">" + esc(l) + "</option>"; }).join("") + "</select></div>" +
      '<div class="zwei">' + f("email", "E-Mail", "email", true, 'autocomplete="email"') + f("telefon", "Telefon (für Rückfragen)", "tel", false, 'autocomplete="tel"') + "</div>" +
      f("kundennr", "Kundennummer (falls vorhanden)", "text", false) +
      "</div>" +
      '<div class="block"><h2><i>2</i>Lieferung &amp; Zahlung</h2>' +
      '<label>Lieferung</label><div class="wahl" style="margin-bottom:18px">' +
      '<label><input type="radio" name="lieferung" value="Versand" checked><div><b>Versand mit DHL</b><span>Versandkosten werden gesondert berechnet und mit der Rechnung mitgeteilt.</span></div></label>' +
      '<label><input type="radio" name="lieferung" value="Abholung"><div><b>Abholung in Auenwald</b><span>' + esc(SHOP.strasse) + ", " + esc(SHOP.ort) + " – nach Terminabsprache, keine Versandkosten.</span></div></label></div>" +
      '<label>Zahlung</label><div class="wahl">' +
      '<label><input type="radio" name="zahlung" value="Vorauskasse" checked><div><b>Vorauskasse per Überweisung</b><span>Sie erhalten eine Vorausrechnung per E-Mail. Versand nach Zahlungseingang.</span></div></label>' +
      '<label><input type="radio" name="zahlung" value="Rechnung (Bestandskunde)"><div><b>Rechnung – nur Bestandskunden</b><span>Zahlung innerhalb von 8 Tagen nach Lieferung. Nicht beim Erstauftrag und nicht ins Ausland.</span></div></label>' +
      '<label id="barOpt" style="display:none"><input type="radio" name="zahlung" value="Barzahlung bei Abholung"><div><b>Barzahlung bei Abholung</b><span>Sie zahlen vor Ort.</span></div></label>' +
      "</div></div>" +
      '<div class="block"><h2><i>3</i>Anmerkungen</h2><div class="feld"><label for="f-bemerkung">Nachricht an uns (optional)</label><textarea id="f-bemerkung" name="bemerkung" placeholder="z. B. Wunschtermin für Abholung, Fragen zur Ausführung …">' + esc(d.bemerkung || "") + "</textarea></div>" +
      '<input class="hp" type="text" name="webseite" tabindex="-1" autocomplete="off" aria-hidden="true">' +
      "</div></div>" +
      "<div>" + summenBox(r, false).replace("<h3>Übersicht</h3>", "<h3>Ihre Bestellung</h3>" + r.pos.map(function (x) {
        return '<div class="mini"><span>' + x.z.menge + "× " + esc(x.p.name) + (x.z.variante ? " (" + esc(x.z.variante) + ")" : "") + (x.aufpreis ? '<br><small class="aufpreis-hinweis">zzgl. Aufpreis auf Anfrage</small>' : "") + "</span><span>" + euro(x.summe) + (x.aufpreis ? "*" : "") + "</span></div>";
      }).join("")).replace("</aside>",
        '<div class="feld" data-f="agb" style="margin-top:6px"><label class="check"><input type="checkbox" name="agb" id="f-agb"><span>Ich habe die <a href="#agb" target="_blank">AGB</a> und die <a href="#widerruf" target="_blank">Widerrufsbelehrung</a> gelesen. Hinweise zum Datenschutz finden Sie in der <a href="#datenschutz" target="_blank">Datenschutzerklärung</a>.</span></label><div class="fehltext">Bitte bestätigen.</div></div>' +
        '<button class="btn btn-gross" type="submit" id="absenden">Zahlungspflichtig bestellen</button>' +
        '<p class="klein" style="text-align:center;margin-top:10px">Sie erhalten sofort eine Eingangsbestätigung per E-Mail. Wir melden uns mit der Rechnung.</p>' +
        '<div class="hinweisbox" id="sendFehler" style="display:none"></div></aside>') +
      "</div></form></div>";
  }

  function seiteDanke() {
    var b = speicher("mds-letzte") || {};
    return '<div class="danke"><div class="haken"><svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5 9-10"/></svg></div>' +
      "<h1>Vielen Dank für Ihre Bestellung!</h1>" +
      (b.nr ? '<div>Ihre Bestellnummer</div><div class="nr">' + esc(b.nr) + "</div>" : "") +
      (b.demo ? '<div class="hinweisbox gelb" style="text-align:left"><b>Vorschau-Modus:</b> In dieser Vorschau wird keine E-Mail verschickt. Auf dem echten Webserver geht die Bestellung an <b>' + esc(SHOP.bestell_email) + "</b> und der Kunde erhält eine Eingangsbestätigung.</div>" : "") +
      "<p>Wir haben Ihre Bestellung erhalten" + (b.email ? " und eine Bestätigung an <b>" + esc(b.email) + "</b> gesendet" : "") + ". " +
      "Sie bekommen in Kürze eine Rechnung mit Versandkosten und unserer Bankverbindung. Nach Zahlungseingang versenden wir die Ware.</p>" +
      '<div style="max-width:420px;margin:0 auto 10px;text-align:left">' + ansprechHtml(true) + "</div>" +
      '<a class="btn btn-2" href="#shop" style="margin-top:12px">Weiter einkaufen</a></div>';
  }

  var LEIST_DETAIL = [
    { titel: "Digitalumbauten", unter: "In allen Spurweiten und Baugrößen", foto: "assets/images/0/mm-mds-60015-001-ad5f4fab.jpg", produkt: "mds-60015",
      text: "Ihre analoge Lok fährt bald digital: Wir bauen Decoder fachgerecht ein – von Spur N bis zur Gartenbahn, mit oder ohne Sound.",
      punkte: ["Decoder-Einbau mit passender Schnittstelle oder verdrahtet", "Sound-Umbau inklusive Lautsprecher", "Licht- und Funktionserweiterungen", "Probefahrt und Funktionstest vor der Rückgabe"] },
    { titel: "Decoderprogrammierung", unter: "Zimo und ESU", foto: "assets/images/1/mm-mds-60014-001-3e06e136.jpg", produkt: "mds-60014",
      text: "Wir stimmen Ihren Decoder genau auf Ihre Lok und Ihre Anlage ab – damit sie so fährt und klingt, wie Sie es sich vorstellen.",
      punkte: ["Fahrverhalten: Anfahren, Bremsen, Höchstgeschwindigkeit", "Funktionstasten und Lichtfunktionen nach Wunsch", "Sound-Einstellungen und Lautstärke", "Auch für bereits eingebaute Decoder"] },
    { titel: "Umlackierung & Beschriftung", unter: "Ihr Modell als Einzelstück", foto: "assets/images/d/id-60012-hakone-b253d22c.jpg", produkt: "mds-60012",
      text: "Eine Lok in Ihrer Wunschlackierung oder mit individueller Beschriftung – sauber ausgeführt, in allen Baugrößen.",
      punkte: ["Umlackierung nach Vorbild oder eigenem Entwurf", "Individuelle Beschriftungen und Anschriften", "Sonderserien für Vereine und Firmen", "Beratung zur Machbarkeit vorab"] },
    { titel: "Servo-Entkupplung", unter: "Neu für die Gartenbahn", neu: true, foto: "assets/images/a/id-21006-1-52215a84.jpg", produkt: "id-21006",
      text: "Seit Jahren produzieren wir die S-KuPLiX-Kupplung für Spur G. Jetzt gibt es dazu passend eine servogesteuerte Entkupplung.",
      punkte: ["Ferngesteuertes Entkuppeln auf der Anlage", "Passend zu S-KuPLiX-Kupplungen", "Als Einzelstück oder im 2er-Set erhältlich", "Einbau auf Wunsch durch uns"] }
  ];
  var LEIST_ICONS = LEIST.map(function (l) { return l[2]; });

  function seiteLeistungen() {
    var abschnitte = LEIST_DETAIL.map(function (l, i) {
      var bildSrc = (SHOP.bildBasis || "") + l.foto;
      var p = finde(l.produkt);
      var bild = DEMO ? '<div class="ersatz">' + (p ? ersatzSvg(p) : SVG_LOK) + "</div>"
        : '<img src="' + esc(bildSrc) + '" alt="' + esc(l.titel) + '" loading="lazy" data-ersatz="' + esc(l.produkt) + '">';
      return '<section class="leist-ab' + (i % 2 ? " umgekehrt" : "") + '">' +
        '<div class="leist-foto">' + bild + (l.neu ? '<span class="neu-band">Neu</span>' : "") + "</div>" +
        '<div class="leist-text"><div class="leist-kopf"><span class="leist-ic"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + LEIST_ICONS[i] + "</svg></span>" +
        '<div><span class="ueberzeile" style="margin:0">' + esc(l.unter) + "</span><h2>" + esc(l.titel) + "</h2></div></div>" +
        "<p>" + esc(l.text) + "</p>" +
        '<ul class="haken-liste">' + l.punkte.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul>" +
        '<button type="button" class="btn btn-2 leist-anfragen" data-leistung="' + esc(l.titel) + '">' + esc(l.titel) + " anfragen</button></div></section>";
    }).join("");
    var schritte = [
      ["Anfrage senden", "Beschreiben Sie Ihr Modell und Ihren Wunsch – per Formular oder Telefon."],
      ["Angebot erhalten", "Wir prüfen die Machbarkeit und nennen Ihnen Preis und Dauer."],
      ["Modell zusenden", "Gut verpackt per Post schicken oder in Auenwald vorbeibringen."],
      ["Fertig zurück", "Nach Umbau und Probefahrt geht Ihr Modell sicher zu Ihnen zurück."]
    ];
    return '<section class="leist-hero" data-titel="Leistungen"><div class="hero-schleier"></div><div class="wrap">' +
      '<span class="ueber"><span class="etikett">Werkstatt &amp; Service</span></span>' +
      '<h1><span class="etikett">Wir bauen Ihre Modelle um</span></h1>' +
      '<p><span class="etikett">Digitalumbau, Decoderprogrammierung, Lackierung und Beschriftung – sorgfältig ausgeführt in unserer Werkstatt in Auenwald.</span></p>' +
      '<a class="btn" href="#anfrage">Jetzt anfragen</a></div></section>' +
      '<div class="wrap seite">' + abschnitte +
      '<section class="ablauf"><span class="ueberzeile">So einfach geht’s</span><h2>In vier Schritten zum Wunschmodell</h2><ol class="schritte"><span class="schritt-lok" aria-hidden="true">' + SVG_LOK + "</span>" +
      schritte.map(function (s, i) { return '<li><span class="nr">' + (i + 1) + "</span><b>" + s[0] + "</b><p>" + s[1] + "</p></li>"; }).join("") + "</ol></section>" +
      '<div class="kasse" style="margin-top:40px" id="anfrage"><form class="block" id="anfrageForm" novalidate><h2>Anfrage senden</h2>' +
      '<div class="zwei"><div class="feld" data-f="name"><label for="a-name">Name *</label><input id="a-name" name="name" type="text" required autocomplete="name"><div class="fehltext">Bitte ausfüllen.</div></div>' +
      '<div class="feld" data-f="email"><label for="a-email">E-Mail *</label><input id="a-email" name="email" type="email" required autocomplete="email"><div class="fehltext">Bitte gültige E-Mail angeben.</div></div></div>' +
      '<div class="zwei"><div class="feld"><label for="a-tel">Telefon</label><input id="a-tel" name="telefon" type="tel" autocomplete="tel"></div>' +
      '<div class="feld"><label for="a-art">Leistung</label><select id="a-art" name="leistung">' + LEIST.map(function (l) { return "<option>" + l[0] + "</option>"; }).join("") + "<option>Sonstiges</option></select></div></div>" +
      '<div class="feld" data-f="nachricht"><label for="a-text">Ihr Vorhaben *</label><textarea id="a-text" name="nachricht" required placeholder="Hersteller, Artikelnummer, Spurweite, gewünschter Decoder …"></textarea><div class="fehltext">Bitte kurz beschreiben.</div></div>' +
      '<input class="hp" type="text" name="webseite" tabindex="-1" autocomplete="off" aria-hidden="true">' +
      '<div class="feld" data-f="ds"><label class="check"><input type="checkbox" name="ds"><span>Ich bin einverstanden, dass meine Angaben zur Bearbeitung der Anfrage verwendet werden (<a href="#datenschutz">Datenschutz</a>).</span></label><div class="fehltext">Bitte bestätigen.</div></div>' +
      '<button class="btn" type="submit">Anfrage absenden</button><div id="anfrageMeldung" style="margin-top:14px"></div></form>' +
      '<aside class="summe"><h3>Lieber persönlich?</h3><p>Wir beraten Sie gern am Telefon.</p>' + ansprechHtml(true) + zeitenHtml() + "</aside></div></div>";
  }

  /** Kasten mit Ansprechpartner – überall, wo Beratung angeboten wird */
  function ansprechHtml(mitTelefon) {
    var name = SHOP.ansprechpartner || SHOP.inhaber;
    var init = name.split(" ").map(function (w) { return w.charAt(0); }).join("");
    var bild = SHOP.ansprechpartnerFoto && !DEMO
      ? '<img class="ansprech-bild" src="' + esc(SHOP.ansprechpartnerFoto) + '" alt="' + esc(name) + '">'
      : '<div class="ansprech-bild" aria-hidden="true">' + esc(init) + "</div>";
    return '<div class="ansprech">' + bild +
      '<div><span class="ueberzeile" style="margin:0">Ihr Ansprechpartner</span><b>' + esc(name) + "</b>" +
      "<span>" + esc(SHOP.ansprechpartnerRolle || "Inhaber") + "</span>" +
      (mitTelefon ? '<a class="ansprech-tel" href="tel:+4971919127979">' + esc(SHOP.telefon) + "</a>" : "") +
      "</div></div>";
  }

  function zeitenHtml() {
    var tag = new Date().getDay(); // 0 So
    var idx = tag === 0 ? 2 : tag === 6 ? 1 : 0;
    return '<div class="zeiten">' + SHOP.oeffnungszeiten.map(function (z, i) {
      return '<div class="' + (i === idx ? "heute" : "") + '"><span>' + esc(z[0]) + "</span><span>" + esc(z[1]) + "</span></div>";
    }).join("") + "</div>";
  }

  function kontaktFoto() {
    var src = SHOP.kontaktFoto || "";
    var ersatz = '<div class="foto-ersatz">' + SVG_LOK + "</div>";
    if (DEMO || !src) return ersatz;
    if (!/^https?:/.test(src)) src = src; // relativer Pfad, z. B. bilder/laden.jpg
    return '<img src="' + esc(src) + '" alt="' + esc(SHOP.kontaktFotoText || "MDS-Modell") + '" loading="lazy" onerror="this.outerHTML=this.dataset.e" data-e="' + esc(ersatz) + '">';
  }

  function seiteKontakt() {
    var maps = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(SHOP.strasse + ", " + SHOP.ort);
    return '<div class="wrap seite"><span class="ueberzeile">Telefonische Unterstützung und Beratung</span><h1>Kontakt</h1><div class="kontakt">' +
      '<div class="block"><h2>' + esc(SHOP.firma) + "</h2><p>" + esc(SHOP.strasse) + "<br>" + esc(SHOP.ort) + "</p>" +
      ansprechHtml() +
      '<p>Telefon: <a href="tel:+4971919127979">' + esc(SHOP.telefon) + "</a><br>Fax: " + esc(SHOP.fax) + '<br>E-Mail: <a href="mailto:' + esc(SHOP.email) + '">' + esc(SHOP.email) + "</a></p>" +
      '<h3 style="margin-top:22px">Öffnungszeiten</h3>' + zeitenHtml() + "</div>" +
      '<div class="block"><figure class="kontakt-foto">' + kontaktFoto() + '<figcaption>' + esc(SHOP.kontaktFotoText || "") + "</figcaption></figure>" +
      '<h2>Anfahrt</h2><p>Abholung bestellter Ware und Beratung vor Ort nach vorheriger Absprache.</p>' +
      '<div class="karte-platz"><div><p>Aus Datenschutzgründen wird keine Karte eingebettet.</p><a class="btn btn-2" href="' + maps + '" target="_blank" rel="noopener">In Google Maps öffnen</a></div></div></div>' +
      "</div></div>";
  }

  /* ---------- Rechtstexte ---------- */
  function adresseZeile() { return esc(SHOP.firma) + ", Inhaber " + esc(SHOP.inhaber) + ", " + esc(SHOP.strasse) + ", " + esc(SHOP.ort); }

  // Grundlage: gesetzliche Muster-Widerrufsbelehrung (Anlage 1 zu Art. 246a § 1 Abs. 2 S. 2 EGBGB)
  function widerrufText() {
    return "<p>Verbraucher ist jede natürliche Person, die ein Rechtsgeschäft zu Zwecken abschließt, die überwiegend weder ihrer gewerblichen noch ihrer selbständigen beruflichen Tätigkeit zugerechnet werden können. Verbrauchern steht ein Widerrufsrecht nach folgender Maßgabe zu:</p>" +
      "<h2>Widerrufsrecht</h2>" +
      "<p>Sie haben das Recht, binnen vierzehn Tagen ohne Angabe von Gründen diesen Vertrag zu widerrufen.</p>" +
      "<p>Die Widerrufsfrist beträgt vierzehn Tage ab dem Tag, an dem Sie oder ein von Ihnen benannter Dritter, der nicht der Beförderer ist, die Waren in Besitz genommen haben bzw. hat. Haben Sie mehrere Waren im Rahmen einer einheitlichen Bestellung bestellt, die getrennt geliefert werden, beginnt die Frist mit dem Tag, an dem Sie oder ein von Ihnen benannter Dritter, der nicht der Beförderer ist, die letzte Ware in Besitz genommen haben bzw. hat. Wird eine Ware in mehreren Teilsendungen oder Stücken geliefert, beginnt die Frist mit Inbesitznahme der letzten Teilsendung bzw. des letzten Stücks.</p>" +
      "<p>Um Ihr Widerrufsrecht auszuüben, müssen Sie uns (" + adresseZeile() + ", Telefon " + esc(SHOP.telefon) + ", Fax " + esc(SHOP.fax) + ", E-Mail " + esc(SHOP.email) + ") mittels einer eindeutigen Erklärung (z. B. ein mit der Post versandter Brief oder E-Mail) über Ihren Entschluss, diesen Vertrag zu widerrufen, informieren. " +
      'Sie können dafür das beigefügte Muster-Widerrufsformular verwenden, das jedoch nicht vorgeschrieben ist. Sie können das <a href="#widerrufsformular">Online-Widerrufsformular</a> auf unserer Webseite elektronisch ausfüllen und übermitteln. Machen Sie von dieser Möglichkeit Gebrauch, so werden wir Ihnen unverzüglich (z. B. per E-Mail) eine Bestätigung über den Eingang eines solchen Widerrufs übermitteln.</p>' +
      "<p>Zur Wahrung der Widerrufsfrist reicht es aus, dass Sie die Mitteilung über die Ausübung des Widerrufsrechts vor Ablauf der Widerrufsfrist absenden.</p>" +
      "<h2>Folgen des Widerrufs</h2>" +
      "<p>Wenn Sie diesen Vertrag widerrufen, haben wir Ihnen alle Zahlungen, die wir von Ihnen erhalten haben, einschließlich der Lieferkosten (mit Ausnahme der zusätzlichen Kosten, die sich daraus ergeben, dass Sie eine andere Art der Lieferung als die von uns angebotene, günstigste Standardlieferung gewählt haben), unverzüglich und spätestens binnen vierzehn Tagen ab dem Tag zurückzuzahlen, an dem die Mitteilung über Ihren Widerruf dieses Vertrags bei uns eingegangen ist. Für diese Rückzahlung verwenden wir dasselbe Zahlungsmittel, das Sie bei der ursprünglichen Transaktion eingesetzt haben, es sei denn, mit Ihnen wurde ausdrücklich etwas anderes vereinbart; in keinem Fall werden Ihnen wegen dieser Rückzahlung Entgelte berechnet. Wir können die Rückzahlung verweigern, bis wir die Waren wieder zurückerhalten haben oder bis Sie den Nachweis erbracht haben, dass Sie die Waren zurückgesandt haben, je nachdem, welches der frühere Zeitpunkt ist.</p>" +
      "<p>Sie haben die Waren unverzüglich und in jedem Fall spätestens binnen vierzehn Tagen ab dem Tag, an dem Sie uns über den Widerruf dieses Vertrags unterrichten, an " + adresseZeile() + " zurückzusenden oder zu übergeben. Die Frist ist gewahrt, wenn Sie die Waren vor Ablauf der Frist von vierzehn Tagen absenden.</p>" +
      "<p>Sie tragen die unmittelbaren Kosten der Rücksendung der Waren.</p>" +
      "<p>Sie müssen für einen etwaigen Wertverlust der Waren nur aufkommen, wenn dieser Wertverlust auf einen zur Prüfung der Beschaffenheit, Eigenschaften und Funktionsweise der Waren nicht notwendigen Umgang mit ihnen zurückzuführen ist.</p>" +
      "<h2>Ausschluss des Widerrufsrechts</h2>" +
      "<p>Das Widerrufsrecht besteht nicht bei Verträgen zur Lieferung von Waren, die nicht vorgefertigt sind und für deren Herstellung eine individuelle Auswahl oder Bestimmung durch den Verbraucher maßgeblich ist oder die eindeutig auf die persönlichen Bedürfnisse des Verbrauchers zugeschnitten sind (z. B. individuelle Umlackierungen, Beschriftungen oder Umbauten nach Kundenwunsch).</p>" +
      "<h2>Muster-Widerrufsformular</h2>" +
      "<p>(Wenn Sie den Vertrag widerrufen wollen, dann füllen Sie bitte dieses Formular aus und senden Sie es zurück – oder nutzen Sie unser " + '<a href="#widerrufsformular">Online-Widerrufsformular</a>.)</p>' +
      '<div class="muster">An: ' + adresseZeile() + ", Fax " + esc(SHOP.fax) + ", E-Mail " + esc(SHOP.email) + "<br><br>" +
      "Hiermit widerrufe(n) ich/wir (*) den von mir/uns (*) abgeschlossenen Vertrag über den Kauf der folgenden Waren (*)/die Erbringung der folgenden Dienstleistung (*)<br><br>" +
      "_______________________________________<br><br>Bestellt am (*)/erhalten am (*): ______________<br>Name des/der Verbraucher(s): ______________<br>Anschrift des/der Verbraucher(s): ______________<br>" +
      "Unterschrift des/der Verbraucher(s) (nur bei Mitteilung auf Papier): ______________<br>Datum: ______________<br><br>(*) Unzutreffendes streichen.</div>";
  }

  function datenschutzText() {
    var formsubmit = SHOP.versandModus === "formsubmit";
    return "<p><i>Stand: November 2026</i></p>" +
      "<h2>1. Verantwortlicher</h2>" +
      "<p>Verantwortlich für die Datenverarbeitung auf dieser Website im Sinne der Datenschutz-Grundverordnung (DSGVO) ist:<br>" + adresseZeile() + "<br>Telefon: " + esc(SHOP.telefon) + " · E-Mail: " + esc(SHOP.email) + "</p>" +
      "<p>Wir nehmen den Schutz Ihrer persönlichen Daten ernst. Personenbezogene Daten werden auf dieser Website nur im technisch notwendigen Umfang und für die unten genannten Zwecke verarbeitet. Wir verkaufen Ihre Daten nicht und verwenden sie nicht für Werbung oder Profilbildung.</p>" +
      "<h2>2. Aufruf der Website und Server-Logfiles</h2>" +
      "<p>Beim Aufruf der Website übermittelt Ihr Browser automatisch Informationen an den Server, die in sogenannten Logfiles gespeichert werden: IP-Adresse, Datum und Uhrzeit des Zugriffs, aufgerufene Seite/Datei, Referrer-URL (zuvor besuchte Seite), Browsertyp und -version sowie Betriebssystem. Diese Daten sind technisch erforderlich, um die Website anzuzeigen und Stabilität und Sicherheit zu gewährleisten (Art. 6 Abs. 1 lit. f DSGVO – berechtigtes Interesse). Eine Zusammenführung mit anderen Datenquellen findet nicht statt.</p>" +
      '<p class="platzhalter">Hosting: Bitte den tatsächlichen Hoster eintragen. Bei GitHub Pages: GitHub Inc., 88 Colin P. Kelly Jr. Street, San Francisco, CA 94107, USA. GitHub verarbeitet die oben genannten Zugriffsdaten auch in den USA; die Übermittlung stützt sich auf das EU-US Data Privacy Framework bzw. EU-Standardvertragsklauseln. Bei eigenem Webspace: Name und Anschrift des Hosters sowie Hinweis auf den Auftragsverarbeitungsvertrag.</p>' +
      "<h2>3. Keine Cookies, keine Analyse- oder Trackingdienste</h2>" +
      "<p>Diese Website setzt keine Cookies und verwendet keine Analyse-, Werbe- oder Trackingdienste. Externe Inhalte (Fachhändler-Karte) werden nur nach Ihrem Klick geladen. Schriftarten werden lokal von unserem eigenen Server geladen; es findet keine Verbindung zu Google Fonts statt.</p>" +
      "<h2>4. Warenkorb (lokaler Speicher Ihres Browsers)</h2>" +
      "<p>Damit Ihr Warenkorb beim Weiterklicken erhalten bleibt, speichern wir die ausgewählten Artikel sowie – falls Sie das Bestellformular ausfüllen – Ihre Adressangaben im lokalen Speicher (localStorage) Ihres Browsers. Diese Daten verbleiben auf Ihrem Gerät und werden nicht an uns übertragen, solange Sie keine Bestellung absenden. Sie können sie jederzeit über die Einstellungen Ihres Browsers löschen. Rechtsgrundlage: § 25 Abs. 2 Nr. 2 TDDDG (unbedingt erforderlich für den von Ihnen gewünschten Dienst) und Art. 6 Abs. 1 lit. b DSGVO.</p>" +
      "<h2>5. Bestellungen</h2>" +
      "<p>Wenn Sie eine Bestellung aufgeben, verarbeiten wir die von Ihnen angegebenen Daten (Name, ggf. Firma, Anschrift, Land, E-Mail-Adresse, optional Telefonnummer und Kundennummer, bestellte Artikel, gewählte Liefer- und Zahlungsart, Anmerkungen) zur Abwicklung des Kaufvertrags: Erstellung der Rechnung, Versand bzw. Abholung, Kommunikation mit Ihnen (Art. 6 Abs. 1 lit. b DSGVO). Sie erhalten eine automatische Eingangsbestätigung per E-Mail. " +
      "Für den Versand geben wir Name und Lieferadresse an das beauftragte Versandunternehmen (DHL) weiter, zur Zahlungsabwicklung erhält unsere Bank die für die Überweisung nötigen Angaben. Eine Online-Zahlung über Zahlungsdienstleister findet nicht statt.</p>" +
      "<p>Bestell- und Rechnungsdaten bewahren wir entsprechend den handels- und steuerrechtlichen Aufbewahrungsfristen (§ 257 HGB, § 147 AO; bis zu 8 bzw. 10 Jahre) auf (Art. 6 Abs. 1 lit. c DSGVO) und löschen sie danach.</p>" +
      "<h2>6. Werkstatt-Anfragen, Widerrufsformular und Kontakt</h2>" +
      "<p>Wenn Sie uns über das Anfrageformular, das Online-Widerrufsformular, per E-Mail oder telefonisch kontaktieren, verarbeiten wir Ihre Angaben (z. B. Name, E-Mail-Adresse, Telefonnummer, Ihre Nachricht bzw. die widerrufenen Waren), um Ihr Anliegen zu bearbeiten (Art. 6 Abs. 1 lit. b DSGVO bei vertragsbezogenen Anfragen und Widerrufen, sonst Art. 6 Abs. 1 lit. f DSGVO). Die Daten werden gelöscht, sobald die Anfrage abschließend bearbeitet ist und keine gesetzlichen Aufbewahrungspflichten entgegenstehen.</p>" +
      (formsubmit
        ? "<h2>7. Übermittlung der Formulare per E-Mail-Dienst (FormSubmit)</h2>" +
          "<p>Die Inhalte des Bestell-, Anfrage- und Widerrufsformulars werden technisch über den Dienst FormSubmit (formsubmit.co, Devro LABS) an unser E-Mail-Postfach weitergeleitet; FormSubmit versendet auch die automatische Eingangsbestätigung an Sie. Dabei werden die eingegebenen Daten sowie Ihre IP-Adresse an FormSubmit übertragen und dort zur Zustellung verarbeitet; eine Verarbeitung außerhalb der EU (insbesondere in den USA) ist möglich. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO (Vertragsabwicklung bzw. Bearbeitung Ihrer Anfrage) sowie unser berechtigtes Interesse an einer einfachen technischen Übermittlung (Art. 6 Abs. 1 lit. f DSGVO). Weitere Informationen: https://formsubmit.co/privacy.</p>"
        : "<h2>7. Versand der Formulare</h2><p>Die Inhalte der Formulare werden über unseren eigenen Webserver per E-Mail an uns übermittelt; zusätzlich wird eine Sicherungskopie der Bestellung auf dem Server gespeichert. Ein externer Dienstleister ist nicht beteiligt.</p>") +
      "<h2>8. Bilder und Karten</h2>" +
      "<p>Produktfotos werden von unserem eigenen Server (www.mds-modell.eu) geladen.</p>" +
      "<p><b>Fachhändler-Karte (OpenStreetMap):</b> Auf der Seite „Fachhändler“ können Sie eine Karte einblenden. Die Karte wird erst geladen, wenn Sie auf „Karte anzeigen“ klicken. Dann ruft Ihr Browser Kartenausschnitte von den Servern der OpenStreetMap Foundation (St John’s Innovation Centre, Cowley Road, Cambridge, CB4 0WS, Großbritannien) ab; dabei wird Ihre IP-Adresse übermittelt. Rechtsgrundlage ist Ihre Einwilligung (Art. 6 Abs. 1 lit. a DSGVO, § 25 Abs. 1 TDDDG), die Sie durch den Klick erteilen. Wenn Sie „Karte künftig immer anzeigen“ wählen, speichern wir diese Entscheidung im lokalen Speicher Ihres Browsers; Sie können sie durch Löschen der Websitedaten widerrufen. Für Großbritannien besteht ein Angemessenheitsbeschluss der EU-Kommission. Weitere Informationen: https://wiki.osmfoundation.org/wiki/Privacy_Policy.</p>" +
      "<p><b>Google Maps:</b> Erst wenn Sie auf der Kontaktseite auf „In Google Maps öffnen“ klicken, wird Google Maps (Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Irland) in einem neuen Fenster aufgerufen; dann gelten die Datenschutzbestimmungen von Google.</p>" +
      "<h2>9. Ihre Rechte</h2>" +
      "<p>Sie haben jederzeit das Recht auf Auskunft über die zu Ihrer Person gespeicherten Daten (Art. 15 DSGVO), auf Berichtigung (Art. 16), Löschung (Art. 17), Einschränkung der Verarbeitung (Art. 18), Datenübertragbarkeit (Art. 20) sowie das Recht, einer Verarbeitung auf Grundlage berechtigter Interessen zu widersprechen (Art. 21 DSGVO). Wenden Sie sich dazu einfach per Telefon, Post oder E-Mail an uns.</p>" +
      "<p>Sie haben außerdem das Recht, sich bei einer Datenschutz-Aufsichtsbehörde zu beschweren. Zuständig für uns ist: Der Landesbeauftragte für den Datenschutz und die Informationsfreiheit Baden-Württemberg, Lautenschlagerstraße 20, 70173 Stuttgart.</p>" +
      "<h2>10. Datensicherheit</h2>" +
      "<p>Die Übertragung dieser Website und aller Formulare erfolgt verschlüsselt (HTTPS/TLS).</p>" +
      "<h2>11. Änderungen</h2>" +
      "<p>Wir passen diese Datenschutzerklärung an, wenn sich die Website oder die rechtlichen Vorgaben ändern. Es gilt die jeweils hier veröffentlichte Fassung.</p>";
  }

  function seiteText(id) {
    var T = {
      impressum: ["Impressum",
        "<h2>Angaben gemäß § 5 DDG</h2><p>" + esc(SHOP.firma) + "<br>Inhaber: " + esc(SHOP.inhaber) + "<br>" + esc(SHOP.strasse) + "<br>" + esc(SHOP.ort) + "</p>" +
        "<h2>Kontakt</h2><p>Telefon: " + esc(SHOP.telefon) + "<br>Fax: " + esc(SHOP.fax) + "<br>E-Mail: " + esc(SHOP.email) + "</p>" +
        '<h2>Umsatzsteuer-ID</h2><p class="platzhalter">Bitte Umsatzsteuer-Identifikationsnummer nach § 27a UStG ergänzen (falls vorhanden).</p>' +
        "<h2>Verantwortlich für den Inhalt</h2><p>" + esc(SHOP.inhaber) + ", Anschrift wie oben</p>" +
        "<h2>Haftung für Links</h2><p>Für Inhalte externer Links übernehmen wir keine Haftung. Für den Inhalt der verlinkten Seiten sind ausschließlich deren Betreiber verantwortlich.</p>" +
        "<h2>Urheberrecht</h2><p>Alle Inhalte dieser Website liegen bei " + esc(SHOP.inhaber) + ". Vervielfältigung und Weitergabe an Dritte nur mit Zustimmung.</p>"],
      datenschutz: ["Datenschutzerklärung", datenschutzText()],
      agb: ["Allgemeine Geschäftsbedingungen",
        '<p class="platzhalter">Bitte die bestehenden AGB hier einfügen. Empfehlung: den Abschnitt „Vertragsschluss“ an den Online-Shop anpassen (Bestellung über den Button „Zahlungspflichtig bestellen“, automatische Eingangsbestätigung per E-Mail, Vertragsschluss mit Zusendung der Rechnung).</p>'],
      widerruf: ["Widerrufsbelehrung", widerrufText()],
      versand: ["Versand & Zahlung",
        "<h2>Zahlungsarten</h2><ul><li><b>Vorauskasse per Überweisung</b> – für Neukunden und Bestellungen aus dem Ausland. Sie erhalten eine Vorausrechnung per E-Mail; der Versand erfolgt nach Zahlungseingang. Erfolgt die Zahlung nicht innerhalb von 30 Tagen, wird der Auftrag storniert.</li>" +
        "<li><b>Rechnung</b> – für Bestandskunden: 8 Tage Zeit zur Prüfung und Überweisung nach Lieferung.</li><li><b>Barzahlung</b> bei Abholung in Auenwald.</li></ul>" +
        "<h2>Versand</h2><p>Wir versenden mit DHL bzw. DHL Express. Die Versandkosten werden gesondert berechnet und Ihnen mit der Rechnung mitgeteilt. Wertpaketversand und andere Versanddienstleister sind auf Wunsch gegen Aufpreis möglich.</p>" +
        '<p class="platzhalter">Empfehlung: konkrete Versandkosten je Land in <code>daten/shop.json</code> eintragen – dann werden sie automatisch im Warenkorb angezeigt.</p>' +
        "<h2>Lieferzeit</h2><p>Lagerartikel ca. 8 Tage. Ist ein Artikel nicht vorrätig oder beim Hersteller nicht lieferbar, informieren wir Sie über die voraussichtliche Wartezeit.</p>" +
        "<h2>Mindestbestellwert</h2><p>" + euro(SHOP.mindestbestellwert || 0) + "</p>"],
    };
    var t = T[id];
    return '<div class="wrap seite"><div class="text"><h1>' + t[0] + "</h1>" + t[1] + "</div></div>";
  }

  function seiteWiderrufsformular() {
    function f(name, label, typ, pflicht, extra) {
      return '<div class="feld" data-f="' + name + '"><label for="w-' + name + '">' + label + (pflicht ? " *" : "") + "</label>" +
        '<input id="w-' + name + '" name="' + name + '" type="' + (typ || "text") + '"' + (pflicht ? " required" : "") + " " + (extra || "") + ">" +
        '<div class="fehltext">Bitte ausfüllen.</div></div>';
    }
    return '<div class="wrap seite"><h1>Widerrufsformular</h1>' +
      '<p style="max-width:46em">Sie möchten einen Kauf widerrufen? Füllen Sie einfach dieses Formular aus. Sie erhalten sofort eine Eingangsbestätigung per E-Mail. ' +
      'Alternativ können Sie uns den Widerruf auch per Post, Fax oder E-Mail mitteilen – Details in der <a href="#widerruf">Widerrufsbelehrung</a>.</p>' +
      '<div class="kasse"><form class="block" id="widerrufForm" novalidate>' +
      '<h2>Hiermit widerrufe ich den Vertrag über den Kauf folgender Waren</h2>' +
      '<div class="feld" data-f="waren"><label for="w-waren">Artikel (Bezeichnung und/oder Art.-Nr.) *</label><textarea id="w-waren" name="waren" required placeholder="z. B. MDS-60009 Ge 4/4 II 617 „Ilanz“, digital"></textarea><div class="fehltext">Bitte angeben.</div></div>' +
      '<div class="zwei">' + f("bestellnr", "Bestell- oder Rechnungsnummer", "text", false) + f("bestellt", "Bestellt am / erhalten am", "text", true, 'placeholder="z. B. 02.11.2026 / 09.11.2026"') + "</div>" +
      '<h2 style="margin-top:10px">Ihre Angaben</h2>' +
      f("name", "Vor- und Nachname", "text", true, 'autocomplete="name"') +
      f("anschrift", "Anschrift (Straße, PLZ, Ort)", "text", true, 'autocomplete="street-address"') +
      '<div class="zwei">' + f("email", "E-Mail (für die Bestätigung)", "email", true, 'autocomplete="email"') + f("telefon", "Telefon (optional)", "tel", false, 'autocomplete="tel"') + "</div>" +
      '<div class="feld"><label for="w-bemerkung">Bemerkung (optional)</label><textarea id="w-bemerkung" name="bemerkung" placeholder="Eine Begründung ist nicht erforderlich."></textarea></div>' +
      '<input class="hp" type="text" name="webseite" tabindex="-1" autocomplete="off" aria-hidden="true">' +
      '<button class="btn btn-gross" type="submit">Widerruf jetzt absenden</button><div id="widerrufMeldung" style="margin-top:14px"></div></form>' +
      '<aside class="summe"><h3>Rücksendung</h3><p>Bitte senden Sie die Ware an:</p><p><b>' + esc(SHOP.firma) + "</b><br>" + esc(SHOP.strasse) + "<br>" + esc(SHOP.ort) + "</p>" +
      "<p>Fragen? Wir beraten Sie gern:</p>" + ansprechHtml(true) + "</aside></div></div>";
  }

  function widerrufAktionen() {
    var form = $("#widerrufForm");
    form.onsubmit = function (e) {
      e.preventDefault();
      if (!pruefen(form, ["waren", "bestellt", "name", "anschrift", "email"])) return;
      var btn = form.querySelector('button[type="submit"]'), m = $("#widerrufMeldung");
      btn.disabled = true; btn.textContent = "Wird gesendet …";
      var d = { typ: "widerruf", webseite: form.elements.webseite.value };
      ["waren", "bestellnr", "bestellt", "name", "anschrift", "email", "telefon", "bemerkung"].forEach(function (n) { d[n] = form.elements[n].value.trim(); });
      senden(d).then(function (res) {
        if (!res || !res.ok) throw new Error((res && res.fehler) || "Unbekannter Fehler");
        var zeit = new Date().toLocaleString("de-DE");
        form.innerHTML = '<div class="hinweisbox gelb"><b>Ihr Widerruf ist eingegangen</b> (' + esc(zeit) + " Uhr)." +
          (res.demo ? " Vorschau – es wurde keine E-Mail verschickt." : " Eine Bestätigung wurde an " + esc(d.email) + " gesendet.") +
          "<br>Bitte senden Sie die Ware an die rechts genannte Adresse zurück.</div>";
      }).catch(function (err) {
        btn.disabled = false; btn.textContent = "Widerruf jetzt absenden";
        m.innerHTML = '<div class="hinweisbox">Senden fehlgeschlagen: ' + esc(err.message) + "<br>Bitte senden Sie den Widerruf per E-Mail an " + esc(SHOP.email) + ".</div>";
      });
    };
  }

  /* Lok fährt beim Laden ein und beim Herunterscrollen nach rechts wieder hinaus */
  var zug = null;
  function heroZugStart() {
    var el = $(".hero-zug");
    if (!el) { zug = null; return; }
    var ruhig = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    zug = { el: el, svg: el.querySelector("svg"), raeder: $$(".rad", el), bereit: ruhig };
    if (!ruhig) el.addEventListener("animationend", function (e) {
      if (e.target !== el) return;
      zug.bereit = true;
      zug.raeder.forEach(function (r) { r.style.animation = "none"; });
      heroZugScroll();
    });
    heroZugScroll();
  }
  function heroZugScroll() {
    if (!zug || !zug.bereit || !document.body.contains(zug.el)) return;
    var hero = $(".hero");
    var rest = zug.el.getBoundingClientRect();           // Position der stehenden Lok (Wrapper bewegt sich nicht)
    var weg = window.innerWidth - rest.left + 40;          // bis ganz aus dem Bild
    var p = Math.max(0, Math.min(1, window.scrollY / (hero.offsetHeight * 0.75)));
    var x = Math.pow(p, 1.6) * weg;                          // langsam anfahren, dann schneller
    zug.svg.style.transform = "translateX(" + x.toFixed(1) + "px)";
    var radPx = rest.width * 17 / 640;
    var grad = (x / radPx) * 180 / Math.PI;
    zug.raeder.forEach(function (r) { r.style.transform = "rotate(" + grad.toFixed(1) + "deg)"; });
  }
  window.addEventListener("scroll", function () { if (zug) requestAnimationFrame(heroZugScroll); }, { passive: true });
  window.addEventListener("resize", function () { if (zug) heroZugScroll(); });

  /* ---------- Lupe & Großansicht ---------- */
  function zoomAktionen() {
    var box = $("#zoombild");
    if (!box) return;
    var img = box.querySelector("img");
    function offnen() {
      var bild = box.querySelector("img");
      var inhalt = bild ? '<img src="' + esc(bild.currentSrc || bild.src) + '" alt="' + esc(bild.alt) + '">' : '<div class="lb-svg">' + (box.querySelector(".ersatz") || {}).innerHTML + "</div>";
      var lb = document.createElement("div");
      lb.className = "lightbox";
      lb.setAttribute("role", "dialog");
      lb.setAttribute("aria-label", "Großansicht");
      lb.innerHTML = '<div class="lb-leiste"><span>' + esc(document.querySelector(".detail h1").textContent) + '</span>' +
        '<span class="lb-knoepfe"><button type="button" data-z="-1" aria-label="Verkleinern">−</button><button type="button" data-z="1" aria-label="Vergrößern">+</button>' +
        '<button type="button" class="lb-zu" aria-label="Schließen">✕ Schließen</button></span></div>' +
        '<div class="lb-flaeche"><div class="lb-inhalt">' + inhalt + "</div></div>" +
        '<div class="lb-tipp">Klicken oder +/− zum Zoomen · Bild mit der Maus verschieben · Esc schließt</div>';
      document.body.appendChild(lb);
      document.body.style.overflow = "hidden";
      var stufe = 1, flaeche = lb.querySelector(".lb-flaeche"), inn = lb.querySelector(".lb-inhalt");
      function setzen(neu, ex, ey) {
        var alt = stufe;
        stufe = Math.max(1, Math.min(4, neu));
        var r = flaeche.getBoundingClientRect();
        var fx = ex == null ? 0.5 : (flaeche.scrollLeft + ex - r.left) / flaeche.scrollWidth;
        var fy = ey == null ? 0.5 : (flaeche.scrollTop + ey - r.top) / flaeche.scrollHeight;
        inn.style.width = (stufe * 100) + "%";
        inn.style.height = (stufe * 100) + "%";
        flaeche.classList.toggle("gezoomt", stufe > 1);
        flaeche.scrollLeft = fx * flaeche.scrollWidth - (ex == null ? r.width / 2 : ex - r.left);
        flaeche.scrollTop = fy * flaeche.scrollHeight - (ey == null ? r.height / 2 : ey - r.top);
        return alt;
      }
      var zieh = null, bewegt = false;
      flaeche.addEventListener("mousedown", function (e) { zieh = { x: e.clientX, y: e.clientY, sl: flaeche.scrollLeft, st: flaeche.scrollTop }; bewegt = false; });
      window.addEventListener("mousemove", ziehen);
      function ziehen(e) {
        if (!zieh) return;
        var dx = e.clientX - zieh.x, dy = e.clientY - zieh.y;
        if (Math.abs(dx) + Math.abs(dy) > 4) bewegt = true;
        flaeche.scrollLeft = zieh.sl - dx; flaeche.scrollTop = zieh.st - dy;
      }
      window.addEventListener("mouseup", function () { zieh = null; });
      flaeche.addEventListener("click", function (e) { if (!bewegt) setzen(stufe >= 2.5 ? 1 : 2.5, e.clientX, e.clientY); });
      flaeche.addEventListener("wheel", function (e) { if (e.ctrlKey || stufe > 1 || e.deltaY < 0) { e.preventDefault(); setzen(stufe * (e.deltaY < 0 ? 1.2 : 1 / 1.2), e.clientX, e.clientY); } }, { passive: false });
      $$("[data-z]", lb).forEach(function (b) { b.onclick = function () { setzen(stufe + Number(b.dataset.z) * 0.75); }; });
      function zu() {
        lb.remove(); document.body.style.overflow = ""; document.removeEventListener("keydown", taste); window.removeEventListener("mousemove", ziehen);
        $("#lupeBtn") && $("#lupeBtn").focus();
      }
      function taste(e) { if (e.key === "Escape") zu(); if (e.key === "+") setzen(stufe + 0.75); if (e.key === "-") setzen(stufe - 0.75); }
      document.addEventListener("keydown", taste);
      lb.querySelector(".lb-zu").onclick = zu;
      lb.querySelector(".lb-zu").focus();
    }
    box.addEventListener("click", offnen);
    // Lupe beim Überfahren (nur Maus)
    box.addEventListener("mousemove", function (e) {
      var bild = box.querySelector("img");
      if (!bild) return;
      var r = box.getBoundingClientRect();
      bild.style.transformOrigin = ((e.clientX - r.left) / r.width * 100) + "% " + ((e.clientY - r.top) / r.height * 100) + "%";
      box.classList.add("lupe-an");
    });
    box.addEventListener("mouseleave", function () { box.classList.remove("lupe-an"); });
  }

  /* ---------- Fachhändler ---------- */
  var haendlerZustand = { land: "", q: "" };
  function seiteHaendler() {
    var laender = [];
    HAENDLER.forEach(function (x) { if (laender.indexOf(x.land) < 0) laender.push(x.land); });
    return '<div class="wrap seite"><h1>Fachhändler</h1>' +
      '<p style="max-width:46em">Unsere Produkte erhalten Sie auch bei diesen Fachhändlern in ' + laender.length + " Ländern. Lassen Sie sich vor Ort beraten.</p>" +
      '<div class="werkzeug"><div class="suche"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>' +
      '<input type="text" id="hSuche" placeholder="Ort, PLZ oder Name suchen …" value="' + esc(haendlerZustand.q) + '" aria-label="Fachhändler suchen"></div></div>' +
      '<div class="land-chips" role="group" aria-label="Land wählen"><button type="button" data-land="">Alle Länder <span>' + HAENDLER.length + "</span></button>" +
      laender.map(function (l) {
        return '<button type="button" data-land="' + esc(l) + '">' + esc(l) + " <span>" + HAENDLER.filter(function (x) { return x.land === l; }).length + "</span></button>";
      }).join("") + "</div>" +
      '<div id="hListe"></div>' +
      '<div class="karte-box" id="hKarte"><div class="karte-frage">' +
      '<svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>' +
      "<h3>Karte der Fachhändler</h3><p>Zum Anzeigen der Karte werden Kartenausschnitte von OpenStreetMap geladen. Dabei wird Ihre IP-Adresse an die OpenStreetMap Foundation übertragen (<a href=\"#datenschutz\">Datenschutz</a>).</p>" +
      '<button type="button" class="btn" id="karteLaden">Karte anzeigen</button>' +
      '<label class="check" style="justify-content:center;margin-top:12px"><input type="checkbox" id="karteMerken"><span>Karte künftig immer anzeigen</span></label></div></div>' +
      '</div>';
  }

  /* Karte (Leaflet + OpenStreetMap), erst nach Klick geladen */
  var lkarte = null, karteGruppe = null;
  function leafletLaden() {
    if (window.L) return Promise.resolve();
    return new Promise(function (res, rej) {
      var css = document.createElement("link");
      css.rel = "stylesheet"; css.href = "assets/leaflet/leaflet.css";
      document.head.appendChild(css);
      var s = document.createElement("script");
      s.src = "assets/leaflet/leaflet.js"; s.onload = res; s.onerror = rej;
      document.head.appendChild(s);
    });
  }
  function karteStarten() {
    var box = $("#hKarte");
    if (!box) return;
    if (DEMO) {
      box.querySelector(".karte-frage p").textContent = "In der Vorschau kann keine Karte geladen werden – auf der echten Website erscheint hier die Karte mit allen Fachhändlern.";
      return;
    }
    leafletLaden().then(function () {
      box.innerHTML = '<div id="hMap" class="h-map" role="region" aria-label="Karte der Fachhändler"></div><p class="karte-hinweis">Standorte ungefähr (Ortsebene). Auf einen Punkt klicken für Adresse und Kontakt.</p>';
      lkarte = L.map("hMap", { scrollWheelZoom: false });
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>-Mitwirkende'
      }).addTo(lkarte);
      karteGruppe = L.featureGroup().addTo(lkarte);
      lkarte.on("focus", function () { lkarte.scrollWheelZoom.enable(); });
      lkarte.on("blur", function () { lkarte.scrollWheelZoom.disable(); });
      karteAktualisieren();
    }).catch(function () {
      box.querySelector(".karte-frage p").textContent = "Die Karte konnte nicht geladen werden.";
    });
  }
  function haendlerGefiltert() {
    var q = haendlerZustand.q.trim().toLowerCase();
    return HAENDLER.filter(function (x) {
      return (!haendlerZustand.land || x.land === haendlerZustand.land) &&
        (!q || (x.name + " " + x.ort + " " + x.strasse + " " + x.kontakt).toLowerCase().indexOf(q) >= 0);
    });
  }
  function karteAktualisieren() {
    if (!lkarte || !document.getElementById("hMap")) return;
    karteGruppe.clearLayers();
    var l = haendlerGefiltert().filter(function (x) { return x.lat; });
    l.forEach(function (x) {
      var web = x.web ? (/^https?:/.test(x.web) ? x.web : "https://" + x.web) : "";
      var m = L.circleMarker([x.lat, x.lng], { radius: 9, color: "#fff", weight: 2, fillColor: "#b90504", fillOpacity: 1 });
      m.bindPopup("<b>" + esc(x.name) + "</b><br>" + esc(x.strasse) + "<br>" + esc(x.ort) + ", " + esc(x.land) +
        (x.telefon ? "<br>Tel. " + esc(x.telefon) : "") +
        (x.email ? '<br><a href="mailto:' + esc(x.email) + '">' + esc(x.email) + "</a>" : "") +
        (web ? '<br><a href="' + esc(web) + '" target="_blank" rel="noopener">' + esc(x.web) + "</a>" : ""));
      m.haendler = x;
      m.addTo(karteGruppe);
    });
    // Ohne Länderfilter auf Europa zoomen (Hongkong würde die Ansicht sprengen)
    var sicht = l.filter(function (x) { return haendlerZustand.land || x.lng < 40; });
    if (sicht.length === 1) lkarte.setView([sicht[0].lat, sicht[0].lng], 11);
    else if (sicht.length) lkarte.fitBounds(L.latLngBounds(sicht.map(function (x) { return [x.lat, x.lng]; })).pad(0.15));
    else lkarte.setView([48.5, 9], 5);
  }
  function aufKarteZeigen(name) {
    if (!lkarte) { karteStarten(); setTimeout(function () { aufKarteZeigen(name); }, 800); return; }
    karteGruppe.eachLayer(function (m) {
      if (m.haendler && m.haendler.name === name) {
        lkarte.setView(m.getLatLng(), 12);
        m.openPopup();
        $("#hKarte").scrollIntoView({ behavior: "smooth", block: "center" });
      }
    });
  }
  function haendlerZeichnen() {
    var l = haendlerGefiltert();
    karteAktualisieren();
    $$(".land-chips button").forEach(function (b) { b.classList.toggle("aktiv", b.dataset.land === haendlerZustand.land); });
    var gruppen = {};
    l.forEach(function (x) { (gruppen[x.land] = gruppen[x.land] || []).push(x); });
    $("#hListe").innerHTML = l.length ? Object.keys(gruppen).map(function (land) {
      return '<h2 class="land-titel">' + esc(land) + ' <small>' + gruppen[land].length + "</small></h2>" +
        '<div class="haendler-raster">' + gruppen[land].map(function (x) {
          var web = x.web ? (/^https?:/.test(x.web) ? x.web : "https://" + x.web) : "";
          var tel = x.telefon ? x.telefon.replace(/[^\d+]/g, "") : "";
          return '<div class="haendler"><h3>' + esc(x.name) + "</h3>" +
            (x.kontakt ? '<div class="h-kontakt">' + esc(x.kontakt) + "</div>" : "") +
            '<p class="h-adr">' + esc(x.strasse) + "<br>" + esc(x.ort) + "</p>" +
            '<div class="h-links">' +
            (x.telefon ? '<a href="tel:' + esc(tel) + '"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/></svg>' + esc(x.telefon) + "</a>" : "") +
            (x.email ? '<a href="mailto:' + esc(x.email) + '"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18v12H3z"/><path d="M3 6l9 7 9-7"/></svg>' + esc(x.email) + "</a>" : "") +
            (web ? '<a href="' + esc(web) + '" target="_blank" rel="noopener"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>' + esc(x.web.replace(/^https?:\/\//, "")) + "</a>" : "") +
            "</div>" +
            (x.lat ? '<button type="button" class="link-btn h-karte" data-karte="' + esc(x.name) + '">Auf der Karte zeigen</button>' : "") +
            "</div>";
        }).join("") + "</div>";
    }).join("") : '<div class="leer">Kein Fachhändler gefunden.</div>';
    $$("[data-karte]").forEach(function (b) { b.onclick = function () { aufKarteZeigen(b.dataset.karte); }; });
  }
  function haendlerAktionen() {
    lkarte = null;
    haendlerZeichnen();
    $("#karteLaden").onclick = function () {
      if ($("#karteMerken").checked) speicher("mds-karte", true);
      karteStarten();
    };
    if (speicher("mds-karte")) karteStarten();
    $("#hSuche").oninput = function (e) { haendlerZustand.q = e.target.value; haendlerZeichnen(); };
    $$(".land-chips button").forEach(function (b) { b.onclick = function () { haendlerZustand.land = b.dataset.land; haendlerZeichnen(); }; });
  }

  /* ---------- Downloads ---------- */
  function seiteDownloads() {
    var gruppen = [];
    DOWNLOADS.forEach(function (d) { if (gruppen.indexOf(d.gruppe) < 0) gruppen.push(d.gruppe); });
    return '<div class="wrap seite"><h1>Downloads</h1><p style="max-width:46em">Prospekte, Bedienungs- und Umbauanleitungen zum Herunterladen (PDF).</p>' +
      gruppen.map(function (g) {
        return '<h2 class="land-titel">' + esc(g) + "</h2>" + '<div class="dl-liste">' +
          DOWNLOADS.filter(function (d) { return d.gruppe === g; }).map(function (d) {
            return '<a class="dl" href="' + esc(d.url) + '" target="_blank" rel="noopener">' +
              '<span class="dl-ic">PDF</span><span class="dl-t"><b>' + esc(d.titel) + "</b>" + (d.info ? "<span>" + esc(d.info) + "</span>" : "") + "</span>" +
              '<span class="dl-pfeil">Öffnen <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 4v12M6 10l6 6 6-6M5 20h14"/></svg></span></a>';
          }).join("") + "</div>";
      }).join("") +
      '<p style="margin-top:24px;color:var(--grau)">Sie benötigen eine Anleitung, die hier fehlt? Wir helfen gern weiter.</p>' + '<div style="max-width:460px">' + ansprechHtml(true) + "</div></div>";
  }

  function seite404() {
    return '<div class="wrap seite"><h1>Seite nicht gefunden</h1><p><a class="btn" href="#start">Zur Startseite</a></p></div>';
  }

  /* ---------- Router ---------- */
  function route() {
    var h = (location.hash || "#start").slice(1);
    var html, navKey = "", nachher = null;
    if (h === "start" || h === "") html = seiteStart();
    else if (h === "shop") { html = seiteShop({ typ: "alle" }); navKey = "shop"; }
    else if (h === "spur-n" || h === "spur-g") { html = seiteShop({ typ: "spur", wert: h.slice(-1).toUpperCase() }); navKey = h; }
    else if (h.indexOf("kat-") === 0 && kat(h.slice(4))) {
      var k = kat(h.slice(4));
      html = seiteShop({ typ: "kat", wert: k.id });
      navKey = k.spur ? "spur-" + k.spur.toLowerCase() : "shop";
    }
    else if (h.indexOf("p-") === 0) {
      var p = finde(h.slice(2));
      html = seiteProdukt(p);
      if (p) navKey = p.archiv ? "shop" : "spur-" + (spurVon(p) || "n").toLowerCase();
    }
    else if (h === "warenkorb") html = seiteKorb();
    else if (h === "kasse") html = seiteKasse();
    else if (h === "danke") html = seiteDanke();
    else if (h === "leistungen") { html = seiteLeistungen(); navKey = "leistungen"; }
    else if (h === "kontakt") { html = seiteKontakt(); navKey = "kontakt"; }
    else if (h === "widerrufsformular") { html = seiteWiderrufsformular(); navKey = h; }
    else if (h === "fachhaendler") { html = seiteHaendler(); navKey = h; }
    else if (h === "downloads") { html = seiteDownloads(); navKey = h; }
    else if (["impressum", "datenschutz", "agb", "widerruf", "versand"].indexOf(h) >= 0) { html = seiteText(h); navKey = h; }
    else if (h === "inhalt") return;
    else html = seite404();
    if (html === "") return;

    var liste = html.match(/<!--LISTE:([^>]*)-->/);
    main.innerHTML = html;
    if (h !== "start" && h !== "") {
      var t = main.querySelector("[data-titel]") ? main.querySelector("[data-titel]").dataset.titel : (main.querySelector("h1") ? main.querySelector("h1").textContent : "");
      var band = document.createElement("div");
      band.className = "titelband";
      band.innerHTML = '<div class="wrap"><b>' + esc(t) + '</b><span><a href="#start">MDS-Modell</a> / ' + esc(t) + "</span></div>";
      main.insertBefore(band, main.firstChild);
    }
    $$(".nav a").forEach(function (a) { a.classList.toggle("aktiv", a.dataset.nav === navKey); });
    var produktSeite = navKey === "shop" || navKey === "spur-n" || navKey === "spur-g";
    $(".nav-haupt").classList.toggle("aktiv", produktSeite);
    $("#nav").classList.remove("offen");
    window.scrollTo(0, 0);
    document.title = (main.querySelector("h1") ? main.querySelector("h1").textContent + " – " : "") + "MDS-Modell";

    if (liste) {
      var ids = JSON.parse(decodeURIComponent(liste[1]));
      shopListeZeichnen(ids);
      $("#sort").value = shopZustand.sort;
      $("#suche").oninput = function (e) { shopZustand.q = e.target.value; shopListeZeichnen(ids); };
      $("#sort").onchange = function (e) { shopZustand.sort = e.target.value; shopListeZeichnen(ids); };
    }
    if (h.indexOf("p-") === 0) produktAktionen(finde(h.slice(2)));
    if (h === "warenkorb") korbAktionen();
    if (h === "kasse") kasseAktionen();
    if (h === "leistungen") anfrageAktionen();
    if (h === "widerrufsformular") widerrufAktionen();
    if (h === "fachhaendler") haendlerAktionen();
    if (h.indexOf("p-") === 0) zoomAktionen();
    if (h === "start" || h === "") heroZugStart();
  }

  function mengeKnoepfe(root, onChange) {
    $$(".menge button", root).forEach(function (b) {
      b.onclick = function () {
        var inp = b.parentNode.querySelector("input");
        var v = Math.max(1, Math.min(99, (parseInt(inp.value, 10) || 1) + Number(b.dataset.m)));
        inp.value = v;
        if (onChange) onChange(inp, v);
      };
    });
  }

  function produktAktionen(p) {
    if (!p || p.archiv) return;
    mengeKnoepfe(main);
    function aktualisieren() {
      var r = $('input[name="var"]:checked');
      if (!r) return;
      var pr = preisFuer(p, r.value);
      $("#dPreis").innerHTML = pr === null ? euro(p.preis) + ' <small>zzgl. Aufpreis auf Anfrage</small>' : euro(pr);
      $("#aufpreisHinweis").style.display = pr === null ? "block" : "none";
    }
    $$('input[name="var"]').forEach(function (r) { r.onchange = aktualisieren; });
    aktualisieren();
    $("#inKorb").onclick = function () {
      var r = $('input[name="var"]:checked');
      var m = Math.max(1, Math.min(99, parseInt($("#menge").value, 10) || 1));
      inKorb(p.id, r ? r.value : "", m);
    };
  }

  function korbAktionen() {
    mengeKnoepfe(main, function (inp, v) { KORB[Number(inp.dataset.zi)].menge = v; korbSpeichern(); route(); });
    $$("input[data-zi]").forEach(function (inp) {
      inp.onchange = function () {
        KORB[Number(inp.dataset.zi)].menge = Math.max(1, Math.min(99, parseInt(inp.value, 10) || 1));
        korbSpeichern(); route();
      };
    });
    $$("[data-weg]").forEach(function (b) {
      b.onclick = function () { KORB.splice(Number(b.dataset.weg), 1); korbSpeichern(); route(); };
    });
  }

  function pruefen(form, felder) {
    var ok = true, erstes = null;
    felder.forEach(function (n) {
      var el = form.elements[n], box = form.querySelector('[data-f="' + n + '"]');
      var gut = el.type === "checkbox" ? el.checked : el.value.trim() !== "";
      if (gut && el.type === "email") gut = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value.trim());
      if (box) box.classList.toggle("fehler", !gut);
      if (!gut) { ok = false; erstes = erstes || el; }
    });
    if (erstes) erstes.focus();
    return ok;
  }

  function senden(daten) {
    if (DEMO) {
      return new Promise(function (res) {
        setTimeout(function () {
          var d = new Date();
          res({ ok: true, demo: true, bestellnummer: "MDS-" + d.getFullYear() + String(d.getMonth() + 1).padStart(2, "0") + String(d.getDate()).padStart(2, "0") + "-" + Math.floor(1000 + Math.random() * 9000) });
        }, 700);
      });
    }
    if (SHOP.versandModus === "formsubmit") return sendenFormSubmit(daten);
    return fetch("bestellung.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(daten)
    }).then(function (r) { return r.json(); });
  }

  /* Versand über FormSubmit.co – für statisches Hosting (GitHub Pages) ohne PHP.
     Beim allerersten Absenden schickt FormSubmit eine Aktivierungs-Mail an bestell_email. */
  function bestellNr() {
    var d = new Date();
    return "MDS-" + d.getFullYear() + String(d.getMonth() + 1).padStart(2, "0") + String(d.getDate()).padStart(2, "0") + "-" + Math.floor(1000 + Math.random() * 9000);
  }
  function sendenFormSubmit(daten) {
    var felder, nr = "";
    if (daten.typ === "widerruf") {
      felder = {
        _subject: "WIDERRUF – " + daten.name + (daten.bestellnr ? " – " + daten.bestellnr : ""),
        Art: "Widerruf eines Kaufvertrags (Online-Widerrufsformular)",
        Eingang: new Date().toLocaleString("de-DE"),
        Waren: daten.waren, Bestellnummer: daten.bestellnr || "–", "Bestellt / erhalten am": daten.bestellt,
        Name: daten.name, Anschrift: daten.anschrift, email: daten.email, Telefon: daten.telefon || "–", Bemerkung: daten.bemerkung || "–",
        _autoresponse: "Guten Tag " + daten.name + ",\n\nwir bestätigen den Eingang Ihres Widerrufs vom " + new Date().toLocaleString("de-DE") + " Uhr.\n\nWiderrufene Waren:\n" + daten.waren +
          "\n\nBitte senden Sie die Ware an: " + SHOP.firma + ", " + SHOP.strasse + ", " + SHOP.ort + ".\n\nMit freundlichen Grüßen\n" + SHOP.firma + " · Tel. " + SHOP.telefon
      };
    } else if (daten.typ === "anfrage") {
      felder = {
        _subject: "Anfrage: " + daten.leistung + " – " + daten.name,
        Leistung: daten.leistung, Name: daten.name, email: daten.email, Telefon: daten.telefon || "–", Nachricht: daten.nachricht
      };
    } else {
      nr = bestellNr();
      var k = daten.kunde, r = korbSumme();
      var artikel = r.pos.map(function (x, i) {
        return (i + 1) + ") " + x.z.menge + " × " + x.p.name + " [Art.-Nr. " + artNr(x.p) + "]" + (x.z.variante ? " – " + x.z.variante : "") +
          " – " + euro(x.ep) + " = " + euro(x.summe) + (x.aufpreis ? " (zzgl. Aufpreis auf Anfrage)" : "");
      }).join("\n");
      var summe = euro(r.summe) + (r.offen ? " zzgl. Aufpreis auf Anfrage (Digital/Sound)" : "") + ", zzgl. Versand – inkl. MwSt.";
      felder = {
        _subject: "Bestellung " + nr + " – " + k.vorname + " " + k.nachname,
        Bestellnummer: nr,
        Name: k.vorname + " " + k.nachname, Firma: k.firma || "–",
        Adresse: k.strasse + ", " + k.plz + " " + k.ort + ", " + k.land,
        email: k.email, Telefon: k.telefon || "–", Kundennummer: k.kundennr || "– (Neukunde?)",
        Lieferung: k.lieferung, Zahlung: k.zahlung,
        Artikel: artikel, Warensumme: summe, Anmerkung: k.bemerkung || "–",
        _autoresponse: "Vielen Dank für Ihre Bestellung " + nr + " bei " + SHOP.firma + "! Wir haben sie erhalten:\n\n" + artikel +
          "\n\nWarensumme: " + summe + "\nLieferung: " + k.lieferung + " · Zahlung: " + k.zahlung +
          "\n\nSie erhalten in Kürze eine Rechnung mit Versandkosten und unserer Bankverbindung.\n\n" +
          SHOP.firma + ", " + SHOP.strasse + ", " + SHOP.ort + " · Tel. " + SHOP.telefon
      };
    }
    felder._template = "table";
    felder._captcha = "false";
    felder._honey = daten.webseite || "";
    return fetch("https://formsubmit.co/ajax/" + encodeURIComponent(SHOP.formsubmit_ziel || SHOP.bestell_email), {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(felder)
    }).then(function (res) { return res.json(); }).then(function (res) {
      if (String(res.success) !== "true") throw new Error(res.message || "Versand fehlgeschlagen");
      return { ok: true, bestellnummer: nr };
    });
  }

  function kasseAktionen() {
    var form = $("#kasseForm");
    function lieferWechsel() {
      var abh = form.elements.lieferung.value === "Abholung";
      $("#barOpt").style.display = abh ? "flex" : "none";
      if (!abh && form.elements.zahlung.value === "Barzahlung bei Abholung") form.elements.zahlung[0].checked = true;
    }
    $$('input[name="lieferung"]', form).forEach(function (r) { r.onchange = lieferWechsel; });
    form.oninput = function () {
      var d = {};
      ["vorname", "nachname", "firma", "strasse", "plz", "ort", "land", "email", "telefon", "kundennr"].forEach(function (n) { d[n] = form.elements[n].value; });
      speicher("mds-kunde", d);
    };
    form.onsubmit = function (e) {
      e.preventDefault();
      if (!pruefen(form, ["vorname", "nachname", "strasse", "plz", "ort", "email", "agb"])) return;
      var btn = $("#absenden"), fehler = $("#sendFehler");
      btn.disabled = true; btn.textContent = "Wird gesendet …"; fehler.style.display = "none";
      var kunde = {};
      ["vorname", "nachname", "firma", "strasse", "plz", "ort", "land", "email", "telefon", "kundennr", "lieferung", "zahlung", "bemerkung"].forEach(function (n) { kunde[n] = form.elements[n].value.trim(); });
      senden({ typ: "bestellung", kunde: kunde, positionen: KORB.map(function (z) { return { id: z.id, variante: z.variante, menge: z.menge }; }), webseite: form.elements.webseite.value })
        .then(function (res) {
          if (!res || !res.ok) throw new Error((res && res.fehler) || "Unbekannter Fehler");
          speicher("mds-letzte", { nr: res.bestellnummer, email: kunde.email, demo: !!res.demo });
          KORB = []; korbSpeichern();
          location.hash = "#danke";
        })
        .catch(function (err) {
          btn.disabled = false; btn.textContent = "Zahlungspflichtig bestellen";
          fehler.style.display = "block";
          fehler.innerHTML = "<b>Die Bestellung konnte nicht gesendet werden.</b> " + esc(err.message) + "<br>Bitte versuchen Sie es erneut oder rufen Sie uns an: " + esc(SHOP.telefon);
        });
    };
  }

  /* Vier Schritte: Lok fährt von Station zu Station, die erreichte Nummer wird groß */
  function schritteAnimieren() {
    var ol = $(".schritte");
    if (!ol) return;
    var lok = ol.querySelector(".schritt-lok");
    var li = $$("li", ol);
    var ruhig = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    function alleAn() { li.forEach(function (x) { x.classList.add("aktiv"); }); }
    if (ruhig || !lok || getComputedStyle(lok).display === "none") {
      // Handy: Nummern nacheinander hervorheben, ohne Lok
      if (ruhig) return alleAn();
    }
    function stationX(i) {
      var o = ol.getBoundingClientRect(), n = li[i].querySelector(".nr").getBoundingClientRect();
      return n.left - o.left - lok.offsetWidth / 2 - 8; // Lok hält direkt vor der Nummer
    }
    function fahren() {
      var mitLok = lok && getComputedStyle(lok).display !== "none";
      var i = 0;
      if (mitLok) {
        lok.style.transition = "none";
        lok.style.left = "-" + lok.offsetWidth + "px";
        lok.style.opacity = "1";
        void lok.offsetWidth;
      }
      (function weiter() {
        if (i >= li.length) return;
        if (mitLok) {
          lok.style.transition = "left " + (i === 0 ? 1 : 1.1) + "s cubic-bezier(.45,.05,.35,1)";
          lok.style.left = stationX(i) + "px";
        }
        setTimeout(function () {
          li[i].classList.add("aktiv");
          i++;
          setTimeout(weiter, 450);
        }, mitLok ? (i === 0 ? 1000 : 1100) : 350);
      })();
    }
    if (!("IntersectionObserver" in window)) return fahren();
    var io = new IntersectionObserver(function (e) {
      if (e[0].isIntersecting) { io.disconnect(); fahren(); }
    }, { threshold: 0.5 });
    io.observe(ol);
  }

  function anfrageAktionen() {
    schritteAnimieren();
    var form = $("#anfrageForm");
    $$(".leist-anfragen").forEach(function (b) {
      b.onclick = function () {
        form.elements.leistung.value = b.dataset.leistung;
        $("#anfrage").scrollIntoView({ behavior: "smooth", block: "start" });
        setTimeout(function () { form.elements.name.focus({ preventScroll: true }); }, 500);
      };
    });
    var hb = $('.leist-hero a[href="#anfrage"]');
    if (hb) hb.onclick = function (e) { e.preventDefault(); $("#anfrage").scrollIntoView({ behavior: "smooth", block: "start" }); };
    form.onsubmit = function (e) {
      e.preventDefault();
      if (!pruefen(form, ["name", "email", "nachricht", "ds"])) return;
      var btn = form.querySelector('button[type="submit"]'), m = $("#anfrageMeldung");
      btn.disabled = true;
      senden({ typ: "anfrage", name: form.elements.name.value.trim(), email: form.elements.email.value.trim(), telefon: form.elements.telefon.value.trim(), leistung: form.elements.leistung.value, nachricht: form.elements.nachricht.value.trim(), webseite: form.elements.webseite.value })
        .then(function (res) {
          if (!res || !res.ok) throw new Error((res && res.fehler) || "Unbekannter Fehler");
          form.reset();
          m.innerHTML = '<div class="hinweisbox gelb"><b>Danke!</b> Ihre Anfrage ist angekommen' + (res.demo ? " (Vorschau – es wurde keine E-Mail verschickt)" : "") + ". Wir melden uns zeitnah.</div>";
        })
        .catch(function (err) { m.innerHTML = '<div class="hinweisbox">Senden fehlgeschlagen: ' + esc(err.message) + "</div>"; })
        .then(function () { btn.disabled = false; });
    };
  }

  function fehlerWeg(e) {
    var box = e.target.closest && e.target.closest(".feld");
    if (box) box.classList.remove("fehler");
  }
  document.addEventListener("input", fehlerWeg);
  document.addEventListener("change", fehlerWeg);

  /* ---------- Start ---------- */
  function start(shop, katalog, haendler, downloads) {
    SHOP = shop; KAT = katalog.kategorien; PROD = katalog.produkte; HAENDLER = haendler || []; DOWNLOADS = downloads || [];
    KORB = KORB.filter(function (z) { var p = finde(z.id); return p && !p.archiv; });
    $("#jahr").textContent = new Date().getFullYear();
    $("#fussAdresse").innerHTML = esc(SHOP.firma) + "<br>" + esc(SHOP.strasse) + "<br>" + esc(SHOP.ort) + "<br>Tel. " + esc(SHOP.telefon) + '<br><a href="mailto:' + esc(SHOP.email) + '">' + esc(SHOP.email) + "</a>";
    if (DEMO) {
      var band = document.createElement("div");
      band.className = "demo-band";
      band.textContent = "Vorschau der neuen Website – Bestellungen werden hier nur simuliert, es wird keine E-Mail versendet.";
      document.body.insertBefore(band, document.body.firstChild);
    }
    var mb = $(".menu-btn");
    mb.onclick = function () { var o = $("#nav").classList.toggle("offen"); mb.setAttribute("aria-expanded", o); };
    korbZaehler();
    window.addEventListener("scroll", function () { $(".kopf").classList.toggle("schatten", window.scrollY > 10); }, { passive: true });
    window.addEventListener("hashchange", route);
    route();
  }

  var inline = document.getElementById("mds-daten");
  if (inline) {
    var d = JSON.parse(inline.textContent);
    DEMO = !!d.demo;
    start(d.shop, d.katalog, d.haendler, d.downloads);
  } else {
    var laden = function (f) { return fetch("daten/" + f).then(function (r) { return r.json(); }); };
    Promise.all([laden("shop.json"), laden("produkte.json"), laden("haendler.json").catch(function () { return []; }), laden("downloads.json").catch(function () { return []; })])
      .then(function (r) { start(r[0], r[1], r[2], r[3]); })
      .catch(function (err) { if (window.console) console.error(err); main.innerHTML = '<div class="wrap seite"><h1>Fehler beim Laden</h1><p>Der Artikelkatalog konnte nicht geladen werden. Bitte rufen Sie uns an: 07191 9127979</p></div>'; });
  }
})();
