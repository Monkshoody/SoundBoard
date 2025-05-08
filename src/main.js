import './style.css';
import OBR from "@owlbear-rodeo/sdk";
import { setupGMView } from './gmview.js';
import { setupPlayerView } from './playerview.js';

//ToDo
// edit export/import for provided sounds (export JSON of SOUNDDATA_KEY)
// add a sound slider to increase or decrease volume for each sound
// testing with multiple players
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
