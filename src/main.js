import './style.css';
import OBR from "@owlbear-rodeo/sdk";
import {setupGMView} from './gmview.js';
import {setupPlayerView} from './playerview.js';

//(check) JSON-Liste mit allen Spell-Sounds (und Dropbox-Links direkt mit raw=1)
//(check) Suchfunktion oder DropDown nach Jahr oder kategorie (Verwandlung, Zauberkunst, ...)
//(check) aufhübschen
//(check) Extension Hosten
//(check) Player-View vs. GM-View
//(check) permissions -> GM kann jedem Spieler individuelle Sounds zuweisen (Bsp. Spieler 1 kann Lumos & Expelliarmus, Spieler 2 kann noch nichts, Spieler 3 kann Expelliarmus & Stupor)
//(check) Import/Export Funktion für diese permissons
//(zu testen) Sounds abspielen für alle Spieler im Raum
//(check) Import/Export Funktion für diese permissons
//Spells.json aus C:\Users\Wuest\OneDrive\Dokumente\Harry Potter PnP\Zauber\ verfollständigen und Spells aus C:\Users\Wuest\Documents\SoundBoard\src\ Überschreiben
//(Ideen): Spells.json als zusätzlichen Load und Save zulassen (Dan kann man auch individuelle Sounds hinzufügen oder löschen)
// |-> Manipulation der json: Wie macht man das ohne die Json in der Extension für alle Leute die darauf zugreifen wollen zu ändern
//change to english Documentation

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
    OBR.party.getPlayers()
    .then(playersList => {
      const players = playersList.map(player => player.name);
      setupGMView(document.getElementById('contentArea'), players);
    })
    .catch(error => {
      console.error('Fehler beim Laden der Spieler:', error);
      setupGMView(document.getElementById('contentArea'), []);
    });
  } else {
    const name = await OBR.player.getName();
    setupPlayerView(document.getElementById('contentArea'), name);
  }
});
