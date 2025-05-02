import OBR from "@owlbear-rodeo/sdk";
import spellData from "./spells.json";
import { loadPermissions, playSoundForAll, triggerGlobalNotification } from "./permissions.js";

const METADATA_NAMESPACE = "com.soundboard/permissions"; // OwlBear-room Namespace for distributing permissions to sounds
const SOUND_TRIGGER_KEY = "com.soundboard/sound-trigger"; // OwlBear-room Namespace for distributing audio
const NOTIFY_KEY = "com.soundboard/global-notification"; // OwlBear-room Namespace for global notifications
const SOUND_PERMISSION_KEY = "com.soundboard/sound-enabled-for-players"; // OwlBear-room Namespace for toggeling sound permissions for players

export async function setupPlayerView(container, playerName) {
  // search function for sounds
  let currentFilter = "all";
  let currentSearch = "";

  const searchInput = document.createElement('input');
  searchInput.type = 'text';
  searchInput.placeholder = '🔎 Search for sound name ...';
  searchInput.classList.add('search-bar');

  container.appendChild(searchInput);

  // main container for sounds
  const spellsContainer = document.createElement('div');
  spellsContainer.classList.add('spells-container');

  container.appendChild(spellsContainer);

  async function renderSpells() {
    const permissions = await loadPermissions();

    if (!permissions[playerName] || permissions[playerName].length === 0) {
      container.innerHTML = "<p>no sounds available</p>";
      return;
    }
    spellsContainer.innerHTML = ""; // emtying the playerview
    let playerSpells = permissions[playerName] || [];

    console.log("PlayerSpells:", playerSpells);
    
    // filter according to search
    if (currentSearch.trim() !== "") {
      const search = currentSearch.trim().toLowerCase();
      playerSpells = playerSpells.filter(spell => spell.toLowerCase().includes(search));
    }

    //console.log("PlayerSpells:", playerSpells);
    playerSpells.forEach(spellName => {
      const spell = spellData.find(s => s.name === spellName);
      if (!spell) return;

      const card = document.createElement("div");
      card.className = "spell-card";

      const button = document.createElement("button");
      button.textContent = spell.name;
      button.className = "spell-button";
      button.addEventListener("click", () => {
        /*
        const metadata = OBR.room.getMetadata();
        const isAllowed = metadata[SOUND_PERMISSION_KEY]
        console.log("isAllowed:", isAllowed);
        */
        OBR.room.getMetadata().then((metadata) =>{
          //console.log("spell-button clicked -> metadata[SOUND_PERMISSION_KEY]:", metadata[SOUND_PERMISSION_KEY]);
          if (metadata[SOUND_PERMISSION_KEY]) {
            playSoundForAll(spell.audio);
            triggerGlobalNotification(`${playerName} hat den Zauber "${spell.name}" gewirkt!`);
          } else {
            OBR.notification.show("Du hast den GM genervt, daher wurdest du gemutet. Gib ihm einen 🍪.");
          }
        })
      });

      card.appendChild(button);
      spellsContainer.appendChild(card);
    });
  }

  //const permissions = await loadPermissions();
  //console.log("Permissions:", permissions);

  searchInput.addEventListener('input', (e) => {
    currentSearch = e.target.value;
    renderSpells();
  });


  // check for changed metadata to trigger sound
  let lastTimestamp = 0; // prevents Caching & ensures new triggering
  OBR.room.onMetadataChange(async (metadata) => {
    const notify = metadata[NOTIFY_KEY];
    if (notify && notify.timestamp > lastTimestamp) {
      lastTimestamp = notify.timestamp;
      OBR.notification.show(notify.message, "INFO");
    }
    const trigger = metadata[SOUND_TRIGGER_KEY]; // store the metadata for the sound trigger
    console.log("Trigger:", trigger);
    if (!trigger) return;
    console.log("Trigger timestamp:", trigger.timestamp, lastTimestamp);
    if (trigger.timestamp > lastTimestamp) { // if new triggert
      lastTimestamp = trigger.timestamp; // update timestamp
      const audio = new Audio(trigger.audio); // updates audio
      audio.play(); // play new audio
    }
    //const permissions = await loadPermissions();
    renderSpells();
  });

  // initial rendering to dislpay all sounds
  renderSpells();
}
