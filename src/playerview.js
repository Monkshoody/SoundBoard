import OBR from "@owlbear-rodeo/sdk";
import spellData from "./spells.json";
import { loadPermissions, playSoundForAll, triggerGlobalNotification } from "./permissions.js";

const METADATA_NAMESPACE = "com.soundboard/permissions"; // OwlBear-room Namespace for distributing permissions to sounds
const SOUND_TRIGGER_KEY = "com.soundboard/sound-trigger"; // OwlBear-room Namespace for distributing audio
const NOTIFY_KEY = "com.soundboard/global-notification"; // OwlBear-room Namespace for global notifications
const SOUND_PERMISSION_KEY = "com.soundboard/sound-enabled-for-players"; // OwlBear-room Namespace for toggeling sound permissions for players

/*
Ich muss die suche, filter und spells schon vor dem rendering an den container appenden, da sie sonst nicht funktionieren
dadurch werden sie aber bei container.innerHTML = "<p>no sounds available</p>"; gelöscht und anschließend nicht wieder angefügt
Ich kann sie aber auch nicht in der if else verzweigung stehen lassen, da sie sonst (vermutlich) bei jedem render neu eingefügt (oder ist java so schlau, dass es das selbst erkennt?)
Vielleicht gibt es sowas wie ein container.unappendchild() oder container.removechild(). Das könnte man in der if (!permissions[playerName] || permissions[playerName].length === 0) verwenden, um den Container zu leeren.
Aber dann habe ich wieder das gleiche Problem... glaube ich. Dang!
*/
export async function setupPlayerView(container, playerName) {
// search function for spells
  let currentFilter = "all";
  let currentSearch = "";

  const searchInput = document.createElement('input');
  searchInput.type = 'text';
  searchInput.placeholder = '🔎 Search for sound name ...';
  searchInput.classList.add('search-bar');

  container.appendChild(searchInput);

// filter for year and category
  const combinedSelect = document.createElement('select');
  combinedSelect.classList.add('combined-filter');

  const options = [
    "all",
    ...[...new Set(spellData.map(spell => spell.kategorie))].map(k => `category: ${k}`),
    ...[...new Set(spellData.map(spell => spell.jahr))].map(j => `year: ${j}`)
  ];

  options.forEach(opt => {
    const option = document.createElement('option');
    option.value = opt;
    option.textContent = opt;
    combinedSelect.appendChild(option);
  });

  container.appendChild(combinedSelect);
  
// main container for sounds
  const spellsContainer = document.createElement('div');
  spellsContainer.classList.add('spells-container');

  container.appendChild(spellsContainer);

// for rerendering while searching, filtering and updateing permissions this function is used
  async function renderSpells() {
    // get updated permissions
    const permissions = await loadPermissions();
    
    // clear everything (filter, search, etc.) if there aren't any permissions
    if (!permissions[playerName] || permissions[playerName].length === 0) {
      searchInput.style.display = 'none';
      combinedSelect.style.display = 'none';
      spellsContainer.innerHTML = "<p>no sounds available</p>";
    } else {
      searchInput.style.display = '';
      combinedSelect.style.display = '';
      spellsContainer.style.display = '';
      spellsContainer.innerHTML = ""; // emtying the playerview
    }

    let  playerSpells = [];
    permissions[playerName].forEach(spellName => {
      console.log("spellName", spellName);
      const spell = spellData.find(s => s.name === spellName);
      playerSpells.append(spell);
      console.log("playerSpells", playerSpells);

      // filter according to search
      if (currentSearch.trim() !== "") {
        const search = currentSearch.trim().toLowerCase();
        playerSpells = playerSpells.filter(spell => spell.toLowerCase().includes(search));
      }

      // filter according to combined filter
      const selected = combinedSelect.value;
      if (currentFilter !== "all") {
        if (selected.startsWith("category: ")) {
          const category = selected.replace("category: ", "");
          playerSpells = playerSpells.filter(spell => spell.kategorie === category);
        }
        if (selected.startsWith("year: ")) {
            const year = selected.replace("year: ", "");
            playerSpells = playerSpells.filter(spell => spell.jahr === year);
        }
      }
    });
    /*
    let playerSpells = permissions[playerName] || [];

    // filter according to search
    if (currentSearch.trim() !== "") {
      const search = currentSearch.trim().toLowerCase();
      playerSpells = playerSpells.filter(spell => spell.toLowerCase().includes(search));
    }

    // filter according to combined filter
    const selected = combinedSelect.value;
    if (currentFilter !== "all") {
      if (selected.startsWith("category: ")) {
        const category = selected.replace("category: ", "");
        playerSpells = playerSpells.filter(spell => spell.kategorie === category);
      }
      if (selected.startsWith("year: ")) {
          const year = selected.replace("year: ", "");
          playerSpells = playerSpells.filter(spell => spell.jahr === year);
      }
    }
    */
    // create cards for each filtered spell in the main container: spellsContainer
    playerSpells.forEach(spell => {
      //const spell = spellData.find(s => s.name === spellName);
      if (!spell) return;

      const card = document.createElement("div");
      card.className = "spell-card";

      // create a sound button to play the sound
      const button = document.createElement("button");
      button.textContent = spell.name;
      button.className = "spell-button";

      button.addEventListener("click", async () => {
        // await the click event, to ensure fluent sound play and notification 
        const metadata = await OBR.room.getMetadata();

        if (metadata[SOUND_PERMISSION_KEY]) { // check for permission to play sounds
          // notify everybody in the room, that the player has hit a spell
          await triggerGlobalNotification(`${playerName} hat den Zauber "${spell.name}" gewirkt!`);
          // play the audio in the room
          await playSoundForAll(spell.audio);
        } else { // if the GM muted everyone ... Players needs to be punished ^^
          await OBR.notification.show("Du hast den GM genervt, daher wurdest du gemutet. Gib ihm einen 🍪.");
        }
      });

      card.appendChild(button);
      spellsContainer.appendChild(card);
    });
  }

  // add EventListener for search
  searchInput.addEventListener('input', (e) => {
    currentSearch = e.target.value;
    renderSpells();
  });

  // add EventListener for filter
  combinedSelect.addEventListener('change', (e) => {
    currentFilter = e.target.value;
    renderSpells();
  });
// end of EventListener

// check for changed metadata to trigger sound
  let lastTimestamp = 0; // prevents Caching & ensures new triggering
  OBR.room.onMetadataChange(async (metadata) => {

    // if NOTIFY_KEY has changed, send a notification to everybody in the room
    const notify = metadata[NOTIFY_KEY];
    if (notify && notify.timestamp > lastTimestamp) {
      lastTimestamp = notify.timestamp;
      OBR.notification.show(notify.message, "INFO");
    }

    // if SOUND_TRIGGER_KEY has changed, play the audio file in everybodys browser
    const trigger = metadata[SOUND_TRIGGER_KEY]; // store the metadata for the sound trigger
    if (!trigger) return;
    if (trigger.timestamp > lastTimestamp) { // if new triggert
      lastTimestamp = trigger.timestamp; // update timestamp
      const audio = new Audio(trigger.audio); // updates audio
      audio.play(); // play new audio
    }
    
    // re-render the spellsContainer
    await renderSpells();
  });

  // initial rendering to dislpay spells
  renderSpells();
}
