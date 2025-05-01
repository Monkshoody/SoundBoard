import './style.css';
import OBR from "@owlbear-rodeo/sdk";
import { setupGMView } from './gmview.js';
import { setupPlayerView } from './playerview.js';

//(check) JSON-Liste mit allen Spell-Sounds (und Dropbox-Links direkt mit raw=1)
//(check) Suchfunktion oder DropDown nach Jahr oder kategorie (Verwandlung, Zauberkunst, ...)
//(check) aufhübschen
//(check) Extension Hosten
//(check) Player-View vs. GM-View
//(check) Sounds abspielen für alle Spieler im Raum
//(check) permissions -> GM kann jedem Spieler individuelle Sounds zuweisen (Bsp. Spieler 1 kann Lumos & Expelliarmus, Spieler 2 kann noch nichts, Spieler 3 kann Expelliarmus & Stupor)
//(check) Import/Export Funktion für diese permissons
//(To-Do) Add filter and search to playerview when they get access to sounds
//(To-Do) Mute Players with toggle in GM-View
//(Ideen): Spells.json als zusätzlichen Load und Save zulassen (Dan kann man auch individuelle Sounds hinzufügen oder löschen)
// |-> Manipulation der json: Wie macht man das ohne die Json in der Extension für alle Leute die darauf zugreifen wollen zu ändern
//change to english Documentation
//clean up (maybe change spells to sounds)

// Navigation und Content Struktur erstellen
document.querySelector('#app').innerHTML = `
  <nav id="navbar" class="navbar">
    <span class="brand">Spellboard</span>
    <div class="nav-buttons"></div>
  </nav>
  <div id="contentArea"></div>
`

OBR.onReady(async () => {
  const role = await OBR.player.getRole();

  if (role === "GM") {
    setupGMView(document.getElementById('contentArea'));
  } else {
    const name = await OBR.player.getName();
    setupPlayerView(document.getElementById('contentArea'), name);
  }
});
