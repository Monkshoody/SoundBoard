import OBR from "@owlbear-rodeo/sdk";
import spellData from "./spells.json";
import { loadPermissions, savePermissions, playSoundForAll, triggerGlobalNotification } from "./permissions.js";

const METADATA_NAMESPACE = "com.soundboard/permissions"; // OwlBear-room Namespace for distributing permissions to sounds
const SOUND_TRIGGER_KEY = "com.soundboard/sound-trigger"; // OwlBear-room Namespace for distributing audio
const NOTIFY_KEY = "com.soundboard/global-notification"; // OwlBear-room Namespace for global notifications
const SOUND_PERMISSION_KEY = "com.soundboard/sound-enabled-for-players"; // OwlBear-room Namespace for toggeling sound permissions for players

var players = []; // global players array including names of all players in the room

// wrapped OBR.party.getPlayers() function for recall during initialization and OBR.party.onchange()
async function updatePlayers(players) {
  const playersList = await OBR.party.getPlayers()
  players = playersList.map(player => player.name);
  return players;
}

// main function for the Game-Masters-View
export async function setupGMView(container) {

// initiate the SOUND_PERMISSION_KEY as true, so that the players are allowed to play sounds
  const currentMetadata = await OBR.room.getMetadata();
  await OBR.room.setMetadata({
    ... currentMetadata,
    [SOUND_PERMISSION_KEY]: true
  });

  // permissions defines who is able to see and play a sound. GM can checkbox the users to provide access to a sound.
  // Thus, permissions is an array containing all players and the accoring sound access
  const permissions = await loadPermissions();
  // three possibilities: 1. GM is first one in room und thus alone. -> getPlayers() will be empty
  //                      2. GM is with some, but not all players in room. -> getPlayers() will be partially full -> players needs update through OBR.party.onChange()
  //                      3. GM is with all players in the room. -> getPlayers() will be full -> we should still update players through OBR.party.onChange()
  players = await updatePlayers(players);

// begin of navbar
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

// audio-toggle container
  // toggle to allow or deny player to play sound in general
  const audioToggleWrapper = document.createElement("div");
  audioToggleWrapper.classList.add("audio-toggle-wrapper");

  // Label for the switch
  const label = document.createElement("label");
  label.classList.add("switch");

  // the actual input (checkbox)
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.id = "audio-toggle";
  checkbox.checked = true; // optional: initial deactivated (but the SOUND_PERMISSION_KEY needs to be initiate as false )

  // EventListener for the switch
  // if the switch is toggled SOUND_PERMISSION_KEY will be set to true or false accordingly
  checkbox.addEventListener("change", async () => {
    const currentMetadata = await OBR.room.getMetadata();
    await OBR.room.setMetadata({
      ... currentMetadata,
      [SOUND_PERMISSION_KEY]: checkbox.checked
    });
  });

  // make it slide
  const slider = document.createElement("span");
  slider.classList.add("slider", "round");

  // add checkbox and slider in label
  label.appendChild(checkbox);
  label.appendChild(slider);

  // description next to the switch
  const switchText = document.createElement("span");
  switchText.textContent = "mute player";
  switchText.classList.add("switch-text");

  // put it all together
  audioToggleWrapper.appendChild(switchText);
  audioToggleWrapper.appendChild(label);

  // insert into the navButtons
  navButtons.appendChild(audioToggleWrapper);

// export-button
  // export allows to export (player-)permissions of the room. Needfull in case you want to switch OwlBear-rooms but you don't want to tick all the checkboxes again
  const exportButton = document.createElement("button");
  exportButton.classList.add("nav-button");
  exportButton.title = "save permissions";
  const exportIcon = document.createElement("img");
  exportIcon.src = "./export.png";
  exportIcon.alt = "export";
  exportIcon.classList.add("nav-icon");
  exportButton.appendChild(exportIcon);

  // EventListener for the export-button
  exportButton.addEventListener("click", async () => {
    const blob = new Blob([JSON.stringify(permissions, null, 2)], { type: "application/json" }); // grab the current permissions of the room and parse them in JSON-format
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "SoundBoard-permissions.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });

  navButtons.appendChild(exportButton);

// import-button
  // import allows to import (player-)permissions to the room. We have an export, so we need an import right? RIGHT?!
  const importButton = document.createElement("button");
  importButton.classList.add("nav-button");
  importButton.title = "open permissions";
  const importIcon = document.createElement("img");
  importIcon.src = "./import.png";
  importIcon.alt = "import";
  importIcon.classList.add("nav-icon");
  importButton.appendChild(importIcon);

  // EventListener for the import-button
  importButton.addEventListener("click", async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const text = await file.text();
      // try the parse first, since we don't know what GMs are uploading
      try {
        const newPermissions = JSON.parse(text);
        await savePermissions(newPermissions);
        OBR.notification.show("import successful");
        await renderSpells(newPermissions); // pass newPermissions to render GMView properly
      } catch (err) {
        OBR.notification.show("Error importing file"); // ...since we don't know what GMs are uploading
      }
    };
    input.click();
  });

  navButtons.appendChild(importButton);
// end of navbar

// begin of contentArea 
  // search function for sounds
  let currentFilter = "all";
  let currentSearch = "";

// search function for spells
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

// for rerendering while searching, filtering and updateing checkboxes this function is used
  async function renderSpells(permissions) {
    // get an updated player-list
    players = await updatePlayers(players);
    const playerName = await OBR.player.getName();
    // clear the spellsContainer for a new render
    spellsContainer.innerHTML = '';

    // show generelly just available spells
    let filteredSpells = spellData.filter(spell => spell.verfügbar);
    // sort alphabteically to the names
    filteredSpells.sort((a, b) => a.name.localeCompare(b.name));

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

    // if there are no spells left, display a 
    if (filteredSpells.length === 0) {
      spellsContainer.innerHTML = '<p>No spells found.</p>';
      return; // in general not neccessary, scince filteredSpells is empty
    }

    // create cards for each filtered spell in the main container: spellsContainer
    filteredSpells.forEach(spell => {

      const spellCard = document.createElement('div');
      spellCard.classList.add('spell-card');
    
      // create a sound button to play the sound
      const button = document.createElement('button');
      button.textContent = `${spell.name}`;
      button.classList.add('spell-button');
      
      // EventListener for the button to notify everybody in the room and distribute the sound to everybody
      button.addEventListener('click', async () => {
        // notify everybody in the room, that the player has hit a spell
        await triggerGlobalNotification(`${playerName} hat den Zauber "${spell.name}" gewirkt!`);
        // play the audio in the room
        await playSoundForAll(spell.audio);
      });

      spellCard.appendChild(button);

      // The Checkbox-Group is used to display checkboxes for each player, for each spell.
      // If they are ticked, the according player get's the according spell displayed in his SpellBoard
      if (players.length) { // if players is empty, we don't need the checkboxes
        const checkboxGroup = document.createElement('div');
        checkboxGroup.classList.add('checkbox-group');

        // create a checkbox element for each player (for each sound)
        players.forEach((player) => {
          const label = document.createElement('label');
          label.classList.add('checkbox-label');
          const checkbox = document.createElement('input');
          checkbox.type = 'checkbox';
          
          // check existing room permissions to check and uncheck sounds
          checkbox.checked = permissions[player]?.includes(spell.name) || false;

          // add EventListener for permissions
          checkbox.addEventListener("change", async () => {
            // disable checkbox while permissions are updated (should be just a matter of milliseconds)
            checkbox.disabled = true;

            if (!permissions[player]) permissions[player] = []; // initiate permissions for player, if not alredy exist
            if (checkbox.checked) { 
              if (!permissions[player].includes(spell.name)) {
                permissions[player].push(spell.name); // player gets permission to play the sound if the checkbox is checked
              }
            } else {
              permissions[player] = permissions[player].filter(s => s !== spell.name); // player loses permission if checkbox is unchecked
            }
            
            // save the new permissions in the room metadata
            await savePermissions(permissions);

            // reactivate checkbox
            checkbox.disabled = false;
          });

          label.appendChild(checkbox);
          label.append(` ${player}`);
          checkboxGroup.appendChild(label);
        });

        spellCard.appendChild(checkboxGroup); 
      }

      // put all children together and append to the spellsContainer
      spellsContainer.appendChild(spellCard); 
    });
  }
// end of contentArea 

// begin of EventListener
  // add EventListener for search
  searchInput.addEventListener('input', (e) => {
    currentSearch = e.target.value;
    renderSpells(permissions);
  });
  
  // add EventListener for filter
  combinedSelect.addEventListener('change', (e) => {
    currentFilter = e.target.value;
    renderSpells(permissions);
  });
// end of EventListener

// check for changed metadata to trigger notification and sound
  let lastTimestamp = 0; // prevents Caching & ensures new triggering

  OBR.room.onMetadataChange((metadata) => {

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
  });
  

// check for new players to update checkboxes and permissions
  OBR.party.onChange((newplayer) => {
    updatePlayers(players); // update the global players array, scince someone joined or left the room
    renderSpells(permissions); // re-render to update the checkboxes
  });

// initial rendering to dislpay all spells
  renderSpells(permissions);
}
