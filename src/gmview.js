import OBR from "@owlbear-rodeo/sdk";
import spellData from "./spells.json";
import { loadPermissions, savePermissions } from "./permissions.js";

const METADATA_NAMESPACE = "com.soundboard/permissions"; // OwlBear-Session Namespace for distributing permissions to sounds
const SOUND_TRIGGER_KEY = "com.soundboard/sound-trigger"; // OwlBear-Session Namespace for distributing audio

// audio function to dirtibute audio to all players in the room
async function playSoundForAll(audioFile) {
  const meta = await OBR.scene.getMetadata();
  await OBR.scene.setMetadata({
    [SOUND_TRIGGER_KEY]: {
      audio: audioFile,
      timestamp: Date.now()  // prevents Caching & ensures new triggering
    }
  });
}

// main function for the Game-Masters-View
// I don't know what will happen if there are two GMs.
export async function setupGMView(container, players = []) {

  const permissions = await loadPermissions();
  console.log("Permissions GM:", permissions);

  //begin of navbar
  // navigation-bar for headdline and import/export Buttons
  const navbar = document.getElementById("navbar") || document.createElement("nav");
  navbar.classList.add("navbar");

  // container for buttons in navigation-bar
  let navButtons = navbar.querySelector(".nav-buttons");
  if (!navButtons) {
    navButtons = document.createElement("div");
    navButtons.classList.add("nav-buttons");
    navbar.appendChild(navButtons);
  }

  // export-button
  const exportButton = document.createElement("button");
  exportButton.classList.add("nav-button");
  exportButton.title = "save permissions";
  const exportIcon = document.createElement("img");
  exportIcon.src = "./export.png";
  exportIcon.alt = "export";
  exportIcon.classList.add("nav-icon");
  exportButton.appendChild(exportIcon);

  navButtons.appendChild(exportButton);

  // import-button
  const importButton = document.createElement("button");
  importButton.classList.add("nav-button");
  importButton.title = "open permissions";
  const importIcon = document.createElement("img");
  importIcon.src = "./import.png";
  importIcon.alt = "import";
  importIcon.classList.add("nav-icon");
  importButton.appendChild(importIcon);

  navButtons.appendChild(importButton);
  // end of navbar

  // begin of contentArea 
  // search function for sounds
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

  // for rerendering while searching and filtering this function is used
  function renderSpells() {
    // clear the container for a new render
    spellsContainer.innerHTML = '';

    // show generelly just available sounds
    let filteredSpells = spellData.filter(spell => spell.verfügbar);

    // filter according to search
    if (currentSearch.trim() !== "") {
      const search = currentSearch.trim().toLowerCase();
      filteredSpells = filteredSpells.filter(spell => spell.name.toLowerCase().includes(search));
    }

    // filter according to combined filter
    const selected = combinedSelect.value;
    if (currentFilter !== "all") {
      if (selected.startsWith("category: ")) {
        const category = selected.replace("category: ", "");
        filteredSpells = filteredSpells.filter(spell => spell.kategorie === category);
      }
      if (selected.startsWith("year: ")) {
          const year = selected.replace("year: ", "");
          filteredSpells = filteredSpells.filter(spell => spell.jahr === year);
      }
    }

    if (filteredSpells.length === 0) {
      spellsContainer.innerHTML = '<p>No sounds found.</p>';
      //return;
    }

    // create cards for each filtered sound in the main container: spellsContainer
    filteredSpells.forEach(spell => {
      const spellCard = document.createElement('div');
      spellCard.classList.add('spell-card');

      spellsContainer.appendChild(spellCard);
    
      // create a sound button to play the sound
      const button = document.createElement('button');
      button.textContent = `${spell.name}`;
      button.classList.add('spell-button');
    
      button.addEventListener('click', () => {
        //const audio = new Audio(spell.audio);
        //audio.play();
        // distribute sound to all Players in the room
        playSoundForAll(spell.audio);
      });

      spellCard.appendChild(button);
    });
  }

  searchInput.addEventListener('input', (e) => {
    currentSearch = e.target.value;
    renderSpells();
  });
  
  combinedSelect.addEventListener('change', (e) => {
    currentFilter = e.target.value;
    renderSpells();
  });

  // initial rendering to dislpay all sounds
  renderSpells();

  let lastTimestamp = 0;

  OBR.scene.onMetadataChange((metadata) => {

    const trigger = metadata[SOUND_TRIGGER_KEY];
    console.log("Trigger:", trigger);
    if (!trigger) return;

    if (trigger.timestamp > lastTimestamp) {
      lastTimestamp = trigger.timestamp;
      const audio = new Audio(trigger.audio);
      audio.play();
    }
  });
}
