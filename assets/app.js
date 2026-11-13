/* MDS-Modell – Shop-Logik (ohne Online-Zahlung; Bestellung wird per E-Mail an den Händler gesendet) */
(function () {
  "use strict";

  var SHOP = null, KAT = [], PROD = [], DEMO = false;
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
  var SVG_LOK =
    '<svg viewBox="0 0 640 250" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Elektrolokomotive">' +
    '<line x1="0" y1="14" x2="640" y2="14" stroke="#8a8378" stroke-width="2"/>' +
    '<g stroke="#5f5a52" stroke-width="4" fill="none"><path d="M170 58 L200 18 L230 58"/><path d="M410 58 L440 18 L470 58"/></g>' +
    '<g stroke="#5f5a52" stroke-width="5"><line x1="180" y1="17" x2="220" y2="17"/><line x1="420" y1="17" x2="460" y2="17"/></g>' +
    '<rect x="78" y="56" width="484" height="16" rx="3" fill="#6b6660"/>' +
    '<path d="M40 182 L40 104 Q42 74 74 72 L566 72 Q598 74 600 104 L600 182 Z" fill="#b0141e"/>' +
    '<path d="M40 104 Q42 74 74 72 L104 72 L104 182 L40 182 Z" fill="#9c1019"/>' +
    '<path d="M536 72 L566 72 Q598 74 600 104 L600 182 L536 182 Z" fill="#9c1019"/>' +
    '<rect x="50" y="88" width="44" height="34" rx="4" fill="#26292e"/><rect x="546" y="88" width="44" height="34" rx="4" fill="#26292e"/>' +
    '<rect x="116" y="88" width="22" height="34" rx="2" fill="#26292e"/><rect x="502" y="88" width="22" height="34" rx="2" fill="#26292e"/>' +
    '<g fill="#86101a">' +
    [160, 214, 268, 322, 376, 430].map(function (x) { return '<rect x="' + x + '" y="88" width="42" height="40" rx="2"/>'; }).join("") +
    "</g>" +
    '<g stroke="#b0141e" stroke-width="2">' +
    [160, 214, 268, 322, 376, 430].map(function (x) {
      var o = ""; for (var y = 94; y < 128; y += 6) o += '<line x1="' + x + '" y1="' + y + '" x2="' + (x + 42) + '" y2="' + y + '"/>'; return o;
    }).join("") + "</g>" +
    '<rect x="40" y="150" width="560" height="4" fill="#fff" opacity=".85"/>' +
    '<rect x="44" y="182" width="552" height="14" fill="#2a2622"/>' +
    '<g fill="#3a3631"><rect x="110" y="192" width="130" height="22" rx="4"/><rect x="400" y="192" width="130" height="22" rx="4"/></g>' +
    '<g fill="#1c1a17" stroke="#7a736a" stroke-width="3">' +
    [140, 210, 430, 500].map(function (x) { return '<circle cx="' + x + '" cy="216" r="17"/>'; }).join("") + "</g>" +
    '<g fill="#7a736a">' + [140, 210, 430, 500].map(function (x) { return '<circle cx="' + x + '" cy="216" r="4"/>'; }).join("") + "</g>" +
    '<rect x="0" y="233" width="640" height="5" fill="#cfc8bb"/>' +
    '<g fill="#6b4a33">' + Array.apply(null, Array(20)).map(function (_, i) { return '<rect x="' + (i * 33 + 4) + '" y="238" width="20" height="8"/>'; }).join("") + "</g>" +
    "</svg>";

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
      : '<span class="preis">' + preisAnzeige(p) + "</span>";
    return '<a class="karte" href="#p-' + p.id + '">' +
      '<div class="bild">' + marke(p) + bildHtml(p) + "</div>" +
      '<div class="karte-text"><span class="artnr">Art.-Nr. ' + esc(artNr(p)) + "</span>" +
      "<h3>" + esc(p.name) + "</h3>" +
      (p.info ? '<p class="info">' + esc(p.info) + "</p>" : "") +
      (p.varianten.length > 1 && !p.archiv ? '<span class="chips-var"><span>analog</span><span>digital</span><span>digital + Sound</span></span>' : "") +
      '<div class="preiszeile">' + unten + "</div></div></a>";
  }

  /* ---------- Warenkorb ---------- */
  var KORB = speicher("mds-korb") || [];
  function korbSpeichern() { speicher("mds-korb", KORB); korbZaehler(); }
  function korbAnzahl() { return KORB.reduce(function (s, z) { return s + z.menge; }, 0); }
  function korbZaehler(puls) {
    var el = $("#korbZahl"), n = korbAnzahl();
    el.textContent = n;
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
      return { z: z, p: p, ep: ep, summe: ep === null ? null : ep * z.menge };
    }).filter(Boolean);
  }
  function korbSumme() {
    var pos = korbPositionen(), s = 0, smin = 0, offen = false;
    pos.forEach(function (x) {
      if (x.summe === null) { offen = true; smin += x.p.preis * x.z.menge; } else { s += x.summe; smin += x.summe; }
    });
    return { pos: pos, summe: s, summeMin: smin, offen: offen };
  }

  /* ---------- Seiten ---------- */
  var VORTEILE =
    '<div class="vorteile wrap" style="padding:0;max-width:none">' +
    '<div><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 7h16v12H4zM8 7V5h8v2"/></svg><span><b>Eigene Sonderserien</b>RhB-Modelle aus Auenwald</span></div>' +
    '<div><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M7 3v4M17 3v4M4 9h16M5 5h14v15H5z"/></svg><span><b>Ohne Online-Zahlung</b>Sie bestellen, wir senden die Rechnung</span></div>' +
    '<div><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 7h11v9H3zM14 10h4l3 3v3h-7"/><circle cx="7" cy="18" r="1.6"/><circle cx="17" cy="18" r="1.6"/></svg><span><b>Versand mit DHL</b>Oder Abholung in Auenwald</span></div>' +
    '<div><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/></svg><span><b>Persönliche Beratung</b>' + "07191 9127979" + "</span></div>" +
    "</div>";

  function seiteStart() {
    var neu = PROD.filter(function (p) { return !p.archiv; });
    var auswahl = ["mds-60015", "mds-60014", "id-21006", "avm-1655-100"].map(finde).filter(Boolean);
    var nAnz = neu.filter(function (p) { return spurVon(p) === "N"; }).length;
    var gAnz = neu.filter(function (p) { return spurVon(p) === "G"; }).length;
    return '<section class="hero"><div class="hero-schleier"></div><div class="wrap hero-in"><div>' +
      '<span class="ueber">Herzlich Willkommen bei mds-modell.eu</span>' +
      "<h1>Die Rhätische Bahn im Maßstab 1:160.</h1>" +
      "<p>Eigene Sonderserien der Ge 4/4 II in Baugröße N – analog, digital oder mit Sound. Dazu S-KuPLiX-Kupplungen, Weichenlaternen und Ersatzteile für die Gartenbahn.</p>" +
      '<div class="knoepfe"><a class="btn" href="#spur-n">Spur N entdecken</a><a class="btn btn-2" href="#spur-g">Zubehör Spur G</a></div>' +
      "</div><div></div></div></section>" +
      VORTEILE +
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
            (pr === null ? "Aufpreis auf Anfrage" : euro(pr)) + "</span></label>";
        }).join("") + "</div></div>";
    }
    var kauf = p.archiv
      ? '<div class="hinweisbox grau"><b>Ausverkauft.</b> Diese Sonderserie ist nicht mehr lieferbar. Fragen Sie gern nach Restbeständen: <a href="#kontakt">Kontakt</a></div>'
      : varHtml + '<div class="kauf"><div class="menge"><button type="button" data-m="-1" aria-label="weniger">−</button><input id="menge" type="number" min="1" max="99" value="1" aria-label="Menge"><button type="button" data-m="1" aria-label="mehr">+</button></div>' +
        '<button class="btn" id="inKorb">In den Warenkorb</button></div>' +
        '<div class="hinweisbox gelb" id="aufpreisHinweis" style="display:none">Für diese Ausführung bestätigen wir Ihnen den genauen Preis mit der Vorausrechnung. Sie können die Bestellung dann noch ablehnen.</div>';
    return '<div class="wrap"><div class="brot" style="margin-top:24px"><a href="#start">Start</a> › <a href="#shop">Shop</a> › <a href="#kat-' + k.id + '">' + esc((k.spur ? "Spur " + k.spur + " · " : "") + k.name) + "</a></div>" +
      '<div class="detail" style="padding-top:8px"><div><div class="bild">' + marke(p) + bildHtml(p) + "</div></div>" +
      '<div><span class="artnr">Art.-Nr. ' + esc(artNr(p)) + "</span><h1>" + esc(p.name) + "</h1>" +
      '<div class="preis" id="dPreis">' + preisAnzeige(p) + '</div><p class="mwst">inkl. MwSt., zzgl. <a href="#versand">Versandkosten</a></p>' +
      kauf +
      '<dl class="fakten">' +
      "<div><dt>Spurweite</dt><dd>" + (k.spur === "N" || /^N-/.test(p.name) ? "N (1:160)" : k.spur === "G" ? "G (Gartenbahn)" : "N (1:160)") + "</dd></div>" +
      "<div><dt>Kategorie</dt><dd>" + esc(k.name) + "</dd></div>" +
      (p.info ? "<div><dt>Ausführung</dt><dd>" + esc(p.info) + "</dd></div>" : "") +
      (hatVar ? "<div><dt>Varianten</dt><dd>" + esc(p.varianten.join(" · ")) + "</dd></div>" : "") +
      (!p.archiv ? "<div><dt>Lieferzeit</dt><dd>" + esc(SHOP.lieferzeit) + "</dd></div>" : "") +
      "</dl></div></div>" +
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
          '<span class="artnr">Einzelpreis: ' + (x.ep === null ? "Aufpreis auf Anfrage" : euro(x.ep)) + "</span><br>" +
          '<button class="link-btn" data-weg="' + i + '">Entfernen</button></div>' +
          '<div class="menge"><button type="button" data-z="' + i + '" data-m="-1" aria-label="weniger">−</button><input type="number" min="1" max="99" value="' + x.z.menge + '" data-zi="' + i + '" aria-label="Menge"><button type="button" data-z="' + i + '" data-m="1" aria-label="mehr">+</button></div>' +
          '<div class="sum">' + (x.summe === null ? "–" : euro(x.summe)) + "</div></div>";
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
      '<p class="klein">Alle Preise inkl. gesetzl. MwSt.' + (r.offen ? "<br>* zzgl. Aufpreis für Digital-/Sound-Ausführung – wird mit der Vorausrechnung bestätigt." : "") + "</p>" +
      (unterMin ? '<div class="hinweisbox">Mindestbestellwert: ' + euro(min) + "</div>" : "") +
      (mitKnopf ? '<a class="btn btn-gross" href="#kasse"' + (unterMin ? ' aria-disabled="true" style="pointer-events:none;opacity:.45"' : "") + ">Zur Kasse</a>" +
        '<p class="klein" style="text-align:center;margin-top:12px">Keine Online-Zahlung nötig – Sie erhalten eine Rechnung per E-Mail.</p>' : "") +
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
        return '<div class="mini"><span>' + x.z.menge + "× " + esc(x.p.name) + (x.z.variante ? " (" + esc(x.z.variante) + ")" : "") + "</span><span>" + (x.summe === null ? "–" : euro(x.summe)) + "</span></div>";
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
      "<p>Fragen? Rufen Sie uns an: <b>" + esc(SHOP.telefon) + "</b></p>" +
      '<a class="btn btn-2" href="#shop" style="margin-top:12px">Weiter einkaufen</a></div>';
  }

  function seiteLeistungen() {
    return '<div class="wrap seite"><span class="ueberzeile">Werkstatt &amp; Service</span><h1>Leistungen</h1>' +
      '<p style="max-width:44em;color:var(--grau)">Neben unseren eigenen Modellen bauen wir Ihre Fahrzeuge um. Beschreiben Sie uns kurz, was Sie vorhaben – wir melden uns mit einem Angebot.</p>' +
      leistungenKarten() +
      '<div class="kasse" style="margin-top:40px"><form class="block" id="anfrageForm" novalidate><h2>Anfrage senden</h2>' +
      '<div class="zwei"><div class="feld" data-f="name"><label for="a-name">Name *</label><input id="a-name" name="name" type="text" required autocomplete="name"><div class="fehltext">Bitte ausfüllen.</div></div>' +
      '<div class="feld" data-f="email"><label for="a-email">E-Mail *</label><input id="a-email" name="email" type="email" required autocomplete="email"><div class="fehltext">Bitte gültige E-Mail angeben.</div></div></div>' +
      '<div class="zwei"><div class="feld"><label for="a-tel">Telefon</label><input id="a-tel" name="telefon" type="tel" autocomplete="tel"></div>' +
      '<div class="feld"><label for="a-art">Leistung</label><select id="a-art" name="leistung">' + LEIST.map(function (l) { return "<option>" + l[0] + "</option>"; }).join("") + "<option>Sonstiges</option></select></div></div>" +
      '<div class="feld" data-f="nachricht"><label for="a-text">Ihr Vorhaben *</label><textarea id="a-text" name="nachricht" required placeholder="Hersteller, Artikelnummer, Spurweite, gewünschter Decoder …"></textarea><div class="fehltext">Bitte kurz beschreiben.</div></div>' +
      '<input class="hp" type="text" name="webseite" tabindex="-1" autocomplete="off" aria-hidden="true">' +
      '<div class="feld" data-f="ds"><label class="check"><input type="checkbox" name="ds"><span>Ich bin einverstanden, dass meine Angaben zur Bearbeitung der Anfrage verwendet werden (<a href="#datenschutz">Datenschutz</a>).</span></label><div class="fehltext">Bitte bestätigen.</div></div>' +
      '<button class="btn" type="submit">Anfrage absenden</button><div id="anfrageMeldung" style="margin-top:14px"></div></form>' +
      '<aside class="summe"><h3>Lieber persönlich?</h3><p>Wir beraten Sie gern am Telefon.</p><p style="font:700 1.5rem var(--kopf)">' + esc(SHOP.telefon) + "</p>" + zeitenHtml() + "</aside></div></div>";
  }

  function zeitenHtml() {
    var tag = new Date().getDay(); // 0 So
    var idx = tag === 0 ? 2 : tag === 6 ? 1 : 0;
    return '<div class="zeiten">' + SHOP.oeffnungszeiten.map(function (z, i) {
      return '<div class="' + (i === idx ? "heute" : "") + '"><span>' + esc(z[0]) + "</span><span>" + esc(z[1]) + "</span></div>";
    }).join("") + "</div>";
  }

  function seiteKontakt() {
    var maps = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(SHOP.strasse + ", " + SHOP.ort);
    return '<div class="wrap seite"><span class="ueberzeile">Telefonische Unterstützung und Beratung</span><h1>Kontakt</h1><div class="kontakt">' +
      '<div class="block"><h2>' + esc(SHOP.firma) + "</h2><p>" + esc(SHOP.strasse) + "<br>" + esc(SHOP.ort) + "</p>" +
      '<p>Telefon: <a href="tel:+4971919127979">' + esc(SHOP.telefon) + "</a><br>Fax: " + esc(SHOP.fax) + '<br>E-Mail: <a href="mailto:' + esc(SHOP.email) + '">' + esc(SHOP.email) + "</a></p>" +
      '<h3 style="margin-top:22px">Öffnungszeiten</h3>' + zeitenHtml() + "</div>" +
      '<div class="block"><h2>Anfahrt</h2><p>Abholung bestellter Ware und Beratung vor Ort nach vorheriger Absprache.</p>' +
      '<div class="karte-platz"><div><p>Aus Datenschutzgründen wird keine Karte eingebettet.</p><a class="btn btn-2" href="' + maps + '" target="_blank" rel="noopener">In Google Maps öffnen</a></div></div></div>' +
      "</div></div>";
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
      datenschutz: ["Datenschutzerklärung",
        '<p class="platzhalter">Bitte die bestehende Datenschutzerklärung hier einfügen und um folgende Punkte ergänzen: Bestellformular (Zweck: Vertragsabwicklung, Art. 6 Abs. 1 lit. b DSGVO), E-Mail-Versand der Bestellung, Speicherung des Warenkorbs im Browser (localStorage, kein Cookie), Google Fonts (oder lokal einbinden), Hoster.</p>'],
      agb: ["Allgemeine Geschäftsbedingungen",
        '<p class="platzhalter">Bitte die bestehenden AGB hier einfügen. Empfehlung: den Abschnitt „Vertragsschluss“ an den Online-Shop anpassen (Bestellung über den Button „Zahlungspflichtig bestellen“, automatische Eingangsbestätigung per E-Mail, Vertragsschluss mit Zusendung der Rechnung).</p>'],
      widerruf: ["Widerrufsbelehrung",
        '<p class="platzhalter">Bitte die bestehende Widerrufsbelehrung hier einfügen.</p>'],
      versand: ["Versand & Zahlung",
        "<h2>Zahlungsarten</h2><ul><li><b>Vorauskasse per Überweisung</b> – für Neukunden und Bestellungen aus dem Ausland. Sie erhalten eine Vorausrechnung per E-Mail; der Versand erfolgt nach Zahlungseingang. Erfolgt die Zahlung nicht innerhalb von 30 Tagen, wird der Auftrag storniert.</li>" +
        "<li><b>Rechnung</b> – für Bestandskunden: 8 Tage Zeit zur Prüfung und Überweisung nach Lieferung.</li><li><b>Barzahlung</b> bei Abholung in Auenwald.</li></ul>" +
        "<h2>Versand</h2><p>Wir versenden mit DHL bzw. DHL Express. Die Versandkosten werden gesondert berechnet und Ihnen mit der Rechnung mitgeteilt. Wertpaketversand und andere Versanddienstleister sind auf Wunsch gegen Aufpreis möglich.</p>" +
        '<p class="platzhalter">Empfehlung: konkrete Versandkosten je Land in <code>daten/shop.json</code> eintragen – dann werden sie automatisch im Warenkorb angezeigt.</p>' +
        "<h2>Lieferzeit</h2><p>Lagerartikel ca. 8 Tage. Ist ein Artikel nicht vorrätig oder beim Hersteller nicht lieferbar, informieren wir Sie über die voraussichtliche Wartezeit.</p>" +
        "<h2>Mindestbestellwert</h2><p>" + euro(SHOP.mindestbestellwert || 0) + "</p>"],
      widerrufsformular: ["Muster-Widerrufsformular",
        "<p>(Wenn Sie den Vertrag widerrufen wollen, dann füllen Sie bitte dieses Formular aus und senden Sie es zurück.)</p>" +
        "<p>An: " + esc(SHOP.firma) + ", " + esc(SHOP.strasse) + ", " + esc(SHOP.ort) + ", Fax: " + esc(SHOP.fax) + ", E-Mail: " + esc(SHOP.email) + "</p>" +
        "<p>Hiermit widerrufe(n) ich/wir (*) den von mir/uns (*) abgeschlossenen Vertrag über den Kauf der folgenden Waren (*)/die Erbringung der folgenden Dienstleistung (*)</p>" +
        "<p>_______________________________________________</p><p>Bestellt am (*)/erhalten am (*): ____________________</p><p>Name des/der Verbraucher(s): ____________________</p>" +
        "<p>Anschrift des/der Verbraucher(s): ____________________</p><p>Unterschrift des/der Verbraucher(s) (nur bei Mitteilung auf Papier): ____________________</p><p>Datum: ____________________</p><p>(*) Unzutreffendes streichen.</p>"]
    };
    var t = T[id];
    return '<div class="wrap seite"><div class="text"><h1>' + t[0] + "</h1>" + t[1] + "</div></div>";
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
    else if (["impressum", "datenschutz", "agb", "widerruf", "versand", "widerrufsformular"].indexOf(h) >= 0) { html = seiteText(h); navKey = h; }
    else if (h === "inhalt") return;
    else html = seite404();
    if (html === "") return;

    var liste = html.match(/<!--LISTE:([^>]*)-->/);
    main.innerHTML = html;
    if (h !== "start" && h !== "") {
      var t = main.querySelector("h1") ? main.querySelector("h1").textContent : "";
      var band = document.createElement("div");
      band.className = "titelband";
      band.innerHTML = '<div class="wrap"><b>' + esc(t) + '</b><span><a href="#start">MDS-Modell</a> / ' + esc(t) + "</span></div>";
      main.insertBefore(band, main.firstChild);
    }
    $$(".nav a").forEach(function (a) { a.classList.toggle("aktiv", a.dataset.nav === navKey); });
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
      $("#dPreis").innerHTML = pr === null ? "<small>ab</small>" + euro(p.preis) + ' <small>+ Aufpreis</small>' : euro(pr);
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
    if (daten.typ === "anfrage") {
      felder = {
        _subject: "Anfrage: " + daten.leistung + " – " + daten.name,
        Leistung: daten.leistung, Name: daten.name, email: daten.email, Telefon: daten.telefon || "–", Nachricht: daten.nachricht
      };
    } else {
      nr = bestellNr();
      var k = daten.kunde, r = korbSumme();
      var artikel = r.pos.map(function (x, i) {
        return (i + 1) + ") " + x.z.menge + " × " + x.p.name + " [Art.-Nr. " + artNr(x.p) + "]" + (x.z.variante ? " – " + x.z.variante : "") +
          " – " + (x.ep === null ? "Preis auf Anfrage" : euro(x.ep) + " = " + euro(x.summe));
      }).join("\n");
      var summe = euro(r.summe) + (r.offen ? " zzgl. Aufpreis Digital/Sound (wird bestätigt)" : "") + ", zzgl. Versand – inkl. MwSt.";
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

  function anfrageAktionen() {
    var form = $("#anfrageForm");
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
  function start(shop, katalog) {
    SHOP = shop; KAT = katalog.kategorien; PROD = katalog.produkte;
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
    window.addEventListener("hashchange", route);
    route();
  }

  var inline = document.getElementById("mds-daten");
  if (inline) {
    var d = JSON.parse(inline.textContent);
    DEMO = !!d.demo;
    start(d.shop, d.katalog);
  } else {
    Promise.all([fetch("daten/shop.json").then(function (r) { return r.json(); }), fetch("daten/produkte.json").then(function (r) { return r.json(); })])
      .then(function (r) { start(r[0], r[1]); })
      .catch(function () { main.innerHTML = '<div class="wrap seite"><h1>Fehler beim Laden</h1><p>Der Artikelkatalog konnte nicht geladen werden. Bitte rufen Sie uns an: 07191 9127979</p></div>'; });
  }
})();
