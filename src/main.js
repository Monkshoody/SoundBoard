import './style.css';
import OBR from "@owlbear-rodeo/sdk";
import { setupGMView } from './gmview.js';
import { setupPlayerView } from './playerview.js';

//change spells to sounds
//change to english
//edit export/import for provided sounds (cut-off ?dl=0 to ?raw=1) how's this woth youtube or others?
//remove spells.json
//add an add-button to add new sounds
//add a sound slider to increase or decrease volume for each sound
//remove search and filter when no sound is available (see playerview)
// I don't know what will happen if there are two GMs

// Navigation und Content Struktur erstellen
document.querySelector('#app').innerHTML = `
  <nav id="navbar" class="navbar">
    <span class="brand">SoundBoard</span>
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
