import './style.css'
import OBR from "@owlbear-rodeo/sdk";
import { setupGMView, setupPlayerView } from './board.js'

//(check) JSON-Liste mit allen Spell-Sounds (und Dropbox-Links direkt mit raw=1)
//(check) Suchfunktion oder DropDown nach Jahr oder kategorie (Verwandlung, Zauberkunst, ...)
//(check) aufhübschen
//Extension Hosten:
//(zu testen) Sounds abspielen für alle Spieler im Raum
//(zu testen) Player-View vs. GM-View
//(zu testen) permissions -> GM kann jedem Spieler individuelle Sounds zuweisen (Bsp. Spieler 1 kann Lumos & Expelliarmus, Spieler 2 kann noch nichts, Spieler 3 kann Expelliarmus & Stupor)
//(ausstehend) Import/Export Funktion für diese permissons
//Spells.json aus C:\Users\Wuest\OneDrive\Dokumente\Harry Potter PnP\Zauber\ verfollständigen und Spells aus C:\Users\Wuest\Documents\SoundBoard\src\ Überschreiben
//(Ideen): Spells.json als zusätzlichen Load und Save zulassen (Dan kann man auch individuelle Sounds hinzufügen oder löschen)
// |-> Manipulation der json: Wie macht man das ohne die Json in der Extension für alle Leute die darauf zugreifen wollen zu ändern
//change to english Documentation


// Navigation und Content Struktur erstellen
document.querySelector('#app').innerHTML = `
  <nav class="navbar">
    <span class="brand">Spellboard Hier ein Test</span>
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
/*
// Spieler aus OBR laden und direkt Spellboard anzeigen
OBR.party.getPlayers()
  .then(playersList => {
    const players = playersList.map(player => player.name);
    setupGMView(document.getElementById('contentArea'), players);
  })
  .catch(error => {
    console.error('Fehler beim Laden der Spieler:', error);
    setupGMView(document.getElementById('contentArea'), []);
  });
*/
/*
document.querySelector('#app').innerHTML = `
  <nav class="navbar">
    <button id="showSpellsBtn">Spells</button>
    <button id="loadFileBtn">Load File</button>
    <button id="saveFileBtn">Save File</button>
    <button id="showPermissionsBtn">Permissions</button>
  </nav>
  <div id="contentArea">
    <!-- Hier wird je nach Navigation der Inhalt geladen -->
  </div>
`

// Event Listener für Navigation
document.getElementById('loadFileBtn').addEventListener('click', handleLoadFile)
document.getElementById('saveFileBtn').addEventListener('click', handleSaveFile)
document.getElementById('showSpellsBtn').addEventListener('click', showSpells)
document.getElementById('showPermissionsBtn').addEventListener('click', showPermissions)

// Funktionen für Navigation
function handleLoadFile() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'application/json'
  input.onchange = async (event) => {
    const file = event.target.files[0]
    if (!file) return
    const text = await file.text()
    try {
      const data = JSON.parse(text)
      localStorage.setItem('permissionsData', JSON.stringify(data))
      alert('Permissions erfolgreich geladen!')
    } catch (e) {
      alert('Fehler beim Laden der Datei!')
      console.error(e)
    }
  }
  input.click()
}

function handleSaveFile() {
  const data = localStorage.getItem('permissionsData') || '{}'
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'permissions.json'
  a.click()
  URL.revokeObjectURL(url)
}

function showSpells() {
  document.getElementById('contentArea').innerHTML = `
    <div class="card" id="soundboard"></div>
  `
  OBR.party.getPlayers().then((playersList) => {
    const players = playersList.map(player => player.name); // Nur die Namen extrahieren
    setupSoundBoard(document.getElementById('soundboard'), players);
  });
}

function showPermissions() {
  document.getElementById('contentArea').innerHTML = `
    <h3>Permissions Verwaltung</h3>
    <div class="card" id="permissions"></div>
  `
  setupPermissions(document.getElementById('permissions'))
}
*/