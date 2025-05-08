import './style.css';
import OBR from "@owlbear-rodeo/sdk";
import { setupGMView } from './gmview.js';
import { setupPlayerView } from './playerview.js';

// To-Do
// mute Player in metadata (something is wrong there)
// VolumeSlider is just temporary. If webside is reloaded everything will reset to 100% Volume. I suggest to use proper files and not count to much on this feature so far.
// Volumeslider for players rests itself if GM hits sounds
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
