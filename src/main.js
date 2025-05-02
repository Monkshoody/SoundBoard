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
//(check) Add search to playerview when they get access to sounds
//(check) Send Notification to all in room when Player plays sound
//(check) Mute Players with toggle in GM-View (https://codepen.io/snphillips/pen/bGBeJWe)
//(test) audio play does not work. Maybe because of Edge, but let's check!
//clean up (maybe change spells to sounds)
//make new Git-Branch
//change to german

//New Git-Branch for public availabiity:
//change Spellboard -> Soundboard
//change to english
//edit export/import for provided sounds
//remove spells.json
//add an add-button to add new sounds
//remove search and filter when no sound is available (see playerview)

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
