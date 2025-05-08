import OBR from "@owlbear-rodeo/sdk";
import { loadPermissions, savePermissions, saveSoundData, loadSoundData, loadPermissionsKey, playSoundForAll, triggerGlobalNotification } from "./permissions.js";

const PERMISSIONS_KEY = "com.soundboard/permissions"; // OwlBear-room Namespace for distributing permissions to sounds
const SOUND_TRIGGER_KEY = "com.soundboard/sound-trigger"; // OwlBear-room Namespace for distributing audio
const NOTIFY_KEY = "com.soundboard/global-notification"; // OwlBear-room Namespace for global notifications
const SOUND_PERMISSION_KEY = "com.soundboard/sound-enabled-for-players"; // OwlBear-room Namespace for toggeling sound permissions for players
const SOUNDDATA_KEY = "com.soundboard/sound-data"; // OwlBear-room Namespace for storing the sound data

// global soundData array for storing the sounds
var soundData = [];

var players = []; // global players array including names of all players in the room

// wrapped OBR.party.getPlayers() function for recall during initialization and OBR.party.onchange()
async function updatePlayers(players) {
  const playersList = await OBR.party.getPlayers()
  players = playersList.map(player => player.name);
  return players;
}

// parse input Links 
function processDropboxLink(inputUrl) {
  const dropboxRegex = /^https:\/\/www\.dropbox\.com\/scl\/fi\/[\w\d]+\/[\w\d%-]+\.\w+\?.*/;

  if (!dropboxRegex.test(inputUrl)) {
    OBR.notification.show("Please enter a valid Dropbox link", "INFO");
    return null;
  }

  // Remove any existing dl=0 or dl=1
  let newUrl = inputUrl.replace(/([?&])dl=\d/, '');

  // Append raw=1 correctly (depending on whether parameters are already present)
  if (newUrl.includes('?')) {
    newUrl += '&raw=1';
  } else {
    newUrl += '?raw=1';
  }

  return newUrl;
}

async function exportData(data, name) {
  let blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }); // grab the current permissions or soundData of the room and parse them in JSON-format
  let url = URL.createObjectURL(blob);
  let a = document.createElement("a");
  a.href = url;
  a.download = `SoundBoard-${name}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// main function for the Game-Masters-View
export async function setupGMView(container) {

// initiate metadata for the OwlBear namespace
  const currentMetadata = await OBR.room.getMetadata();
  soundData = await loadSoundData();
  const permissionsKey = await loadPermissionsKey(); // fetch the metadata of the SOUND_PERMISSION_KEY to keep the soundPermissions as it was.
  console.log(permissionsKey);
  if (soundData == []) {
    await OBR.room.setMetadata({
      ... currentMetadata,
      [SOUND_PERMISSION_KEY]: permissionsKey, // initiate the SOUND_PERMISSION_KEY as true (see permissions.json), so on default players are allowed to play sounds
      [SOUNDDATA_KEY]: soundData // initiate the SOUNDDATA_KEY as empty array, so on default no sounds are available. SOUNDDATA_KEY will be updated accoring to soundData array
    });
  } else {
    await OBR.room.setMetadata({
      ... currentMetadata,
      [SOUND_PERMISSION_KEY]: permissionsKey, // initiate the SOUND_PERMISSION_KEY as true (see permissions.json), so on default players are allowed to play sounds
    });
  }

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
    console.log("metadata[SOUND_PERMISSION_KEY]:", metadata[SOUND_PERMISSION_KEY]);
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

// settings dropdown menu
  const settingsButton = document.createElement("button");
  settingsButton.classList.add("nav-button");
  settingsButton.title = "import/export";
  const settingsIcon = document.createElement("img");
  settingsIcon.src = "./settings.png";
  settingsIcon.alt = "import/export";
  settingsIcon.classList.add("nav-icon");
  settingsButton.appendChild(settingsIcon);

  // dropdown-menu for import and export functions
  const dropdownMenu = document.createElement("div");
  dropdownMenu.classList.add("dropdown-menu", "hidden"); // .hidden is controlled by CSS

  dropdownMenu.innerHTML = `
    <div class="dropdown-section">
      <button class="dropdown-item" data-type="export-permissions">🔐 export permissions</button>
      <button class="dropdown-item" data-type="export-sounds">🎵 export sounds</button>
    </div>
    <div class="dropdown-section">
      <button class="dropdown-item" data-type="import-permissions">🔐 import permissions</button>
      <button class="dropdown-item" data-type="import-sounds">🎵 import sounds</button>
    </div>
  `;

  let menuOpen = false;

  settingsButton.addEventListener("click", (event) => {
    event.stopPropagation(); // prevents click bubbling
    menuOpen = !menuOpen;
    dropdownMenu.classList.toggle("hidden", !menuOpen);
  });

  // Click outside the menu to close it
  document.addEventListener("click", (event) => {
    if (menuOpen && !dropdownMenu.contains(event.target) && event.target !== settingsButton) {
      dropdownMenu.classList.add("hidden");
      menuOpen = false;
    }
  });

  dropdownMenu.addEventListener("click", async (event) => {
    const type = event.target.getAttribute("data-type");
    if (!type) return;
  
    switch (type) {

      case "export-permissions":
        let newpermissions = await loadPermissions();
        await exportData(newpermissions, "permissions"); break;

      case "import-permissions":
        const inputPermissions = document.createElement("input");
        inputPermissions.type = "file";
        inputPermissions.accept = "application/json";
        inputPermissions.onchange = async (e) => {
          const file = e.target.files[0];
          if (!file) return;
          const text = await file.text();
          // try the parse first, since we don't know what GMs are uploading
          try {
            const newPermissions = JSON.parse(text);
            await savePermissions(newPermissions);
            OBR.notification.show("import successful");
            await renderSounds(newPermissions); // pass newPermissions to render GMView properly
          } catch (err) {
            console.alert("ERROR", err);
            OBR.notification.show("Error importing file"); // ...since we don't know what GMs are uploading
          }
        };
        inputPermissions.click();

      case "export-sounds":
        soundData = await loadSoundData();
        await exportData(soundData, "soundData"); break;

      case "import-sounds":
        const inputSounds = document.createElement("input");
        inputSounds.type = "file";
        inputSounds.accept = "application/json";
        inputSounds.onchange = async (e) => {
          const file = e.target.files[0];
          if (!file) return;
          const text = await file.text();
          // try the parse first, since we don't know what GMs are uploading
          try {
            const newSounds = JSON.parse(text);
            await saveSoundData(newSounds);
            OBR.notification.show("import successful");
            await renderSounds(permissions); // pass newPermissions to render GMView properly
          } catch (err) {
            console.alert("ERROR", err);
            OBR.notification.show("Error importing file"); // ...since we don't know what GMs are uploading
          }
        };
        inputSounds.click();
    }
  
    // close menu after click
    dropdownMenu.classList.add("hidden");
    menuOpen = false;
  });
  
  navButtons.appendChild(dropdownMenu);
  navButtons.appendChild(settingsButton);
// end of navbar

// begin of contentArea 
  // search function for sounds
  let currentFilter = "all";
  let currentSearch = "";

// addSounds for adding new Sounds
  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.placeholder = 'sound name';
  nameInput.classList.add('addInput');

  const categoryInput = document.createElement('input');
  categoryInput.type = 'text';
  categoryInput.placeholder = 'category';
  categoryInput.classList.add('addInput');

  const audioInput = document.createElement('input');
  audioInput.type = 'text';
  audioInput.placeholder = 'DropBox link';
  audioInput.classList.add('addInput');

  const addButton = document.createElement('button');
  addButton.textContent = '➕ add sound';
  addButton.classList.add('add-button');

  // EventListener for adding new sounds
  addButton.addEventListener('click', () => {
    const name = nameInput.value.trim();
    const category = categoryInput.value.trim();
    const audioName = audioInput.value.trim();
    const audio = processDropboxLink(audioName);
    if (audio === null) {audioInput.value = "";}

    if (name && category && audio) {
      const newSound = { name, category, audio };
      soundData.push(newSound);
      saveSoundData(soundData);

      OBR.notification.show("New sound added", "INFO");

      // clear input fields
      nameInput.value = "";
      categoryInput.value = "";
      audioInput.value = "";
    } else {
      OBR.notification.show("Please fill in all fields!", "INFO");
    }
    renderSounds(permissions);
  });

  // put eveything together
  container.appendChild(nameInput);
  container.appendChild(categoryInput);
  container.appendChild(audioInput);
  container.appendChild(addButton);

// search function for sounds
  const searchInput = document.createElement('input');
  searchInput.type = 'text';
  searchInput.placeholder = '🔎 Search for sound name ...';
  searchInput.classList.add('search-bar');

  container.appendChild(searchInput);

// filter for categories; Note that this is only the initiation of the filter DOM, as the filter reacts dynamically to the creation and deletion of new sounds.
  const combinedSelect = document.createElement('select');
  combinedSelect.classList.add('combined-filter');
  const options = ["all"];
  options.forEach(opt => {
    const option = document.createElement('option');
    option.value = opt;
    option.textContent = opt;
    combinedSelect.appendChild(option);
  });

  container.appendChild(combinedSelect);

// main container for sounds
  const soundsContainer = document.createElement('div');
  soundsContainer.classList.add('sound-container');

  container.appendChild(soundsContainer);

// for rerendering while searching, filtering and updateing checkboxes this function is used
  async function renderSounds(permissions) {
    // get an updated player-list
    players = await updatePlayers(players);
    const playerName = await OBR.player.getName();
    // clear the soundsContainer for a new render
    soundsContainer.innerHTML = '';

    // loud new soundData from the room namespace for it could be updated
    let filteredSounds = await loadSoundData();

    // since new sounds can be added, the filter needs to be updated to possible new categories
    const existingOptions = Array.from(combinedSelect.options).map(opt => opt.value); // get all already existing category options from combinedSelect
    const existingCategories = existingOptions
    .filter(opt => opt.startsWith("category: "))
    .map(opt => opt.replace("category: ", "")); // prepare for comparison

    const allCategories = [...new Set(filteredSounds.map(sound => sound.category))]; // get all category options from metadata namespace (filteredSounds)

    const newCategories = allCategories.filter(cat => !existingCategories.includes(cat)); // compare both lists existingCategories and allCategories to get new categories

    const removedCategories = existingCategories.filter(cat => !allCategories.includes(cat));
    // if GM adds a new sound, the filter will be updated with a new category
    newCategories.forEach(cat => { // create for each new category an option in the dropdown menu
      const option = document.createElement('option');
      option.value = `category: ${cat}`;
      option.textContent = `category: ${cat}`;
      combinedSelect.appendChild(option);
    });
    // If the GM removes a sound, the categories needs to updated since they could be obsolete
    removedCategories.forEach(cat => {
      const optionToRemove = Array.from(combinedSelect.options).find(
        opt => opt.value === `category: ${cat}`
      );
      if (optionToRemove) {
        combinedSelect.removeChild(optionToRemove);
      }
    });

    // sort alphabteically to the names
    filteredSounds.sort((a, b) => a.name.localeCompare(b.name));

    // filter according to search
    if (currentSearch.trim() !== "") {
      const search = currentSearch.trim().toLowerCase();
      filteredSounds = filteredSounds.filter(sound => sound.name.toLowerCase().includes(search));
    }

    // filter according to combined filter
    const selected = combinedSelect.value;
    if (currentFilter !== "all") {
      const category = selected.replace("category: ", "");
      filteredSounds = filteredSounds.filter(sound => sound.category === category);
    }

    // if there are no sounds left, display a message
    if (filteredSounds.length === 0) {
      soundsContainer.innerHTML = '<p>no sounds found</p>';
      return; // in general not neccessary, scince filteredSounds is empty
    }

    // create cards for each filtered sound in the main container: soundsContainer
    filteredSounds.forEach(sound => {

      const soundCard = document.createElement('div');
      soundCard.classList.add('sound-card');

      // create a sound button to play the sound
      const soundButton = document.createElement('button');
      soundButton.textContent = `${sound.name}`;
      soundButton.classList.add('sound-button');
      
      // EventListener for the soundButton to notify everybody in the room and distribute the sound to everybody
      soundButton.addEventListener('click', async () => {
        // notify everybody in the room, that the player has hit a sound
        await triggerGlobalNotification(`${playerName} played the sound "${sound.name}"!`);
        // play the audio in the room
        await playSoundForAll(sound.audio);
      });

      // Create the delete button (the "X")
      const deleteButton = document.createElement('span');
      deleteButton.textContent = '×'; // Unicode "X"
      deleteButton.classList.add('delete-button');

      // EventListener to delete the sound
      deleteButton.addEventListener('click', async () => {
        // Entferne Sound aus soundData
        const index = soundData.findIndex(s => s.name === sound.name && s.category === sound.category);
        if (index !== -1) {
          soundData.splice(index, 1); // delete the sound from soundData
          await saveSoundData(soundData);
          // update permissions: if GM removes a sound, the sound needs to be removed for the players as well
          if (players.length) { 
            players.forEach((player) => {
                if (permissions[player]) {
                  if (permissions[player].includes(sound.name)) {
                    permissions[player].pop(sound.name);
                    savePermissions(permissions);
                  }
                }
              });
          }

          renderSounds(permissions); // re-render
        }
      });

      // create volume-Slider
      volumeSlider = document.createElement('input');
      volumeSlider.type = 'range';
      volumeSlider.min = 0;
      volumeSlider.max = 1;
      volumeSlider.step = 0.01;
      volumeSlider.value = 1; // default volume 100%
      volumeSlider.classList.add('volume-slider');

      soundCard.appendChild(deleteButton);
      soundCard.appendChild(soundButton);
      soundCard.appendChild(volumeSlider);

      // The Checkbox-Group is used to display checkboxes for each player, for each sound.
      // If they are ticked, the according player get's the according sound displayed in his soundBoard
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
          checkbox.checked = permissions[player]?.includes(sound.name) || false;

          // add EventListener for permissions
          checkbox.addEventListener("change", async () => {
            // disable checkbox while permissions are updated (should be just a matter of milliseconds)
            checkbox.disabled = true;

            if (!permissions[player]) permissions[player] = []; // initiate permissions for player, if not alredy exist
            if (checkbox.checked) { 
              if (!permissions[player].includes(sound.name)) {
                permissions[player].push(sound.name); // player gets permission to play the sound if the checkbox is checked
              }
            } else {
              permissions[player] = permissions[player].filter(s => s !== sound.name); // player loses permission if checkbox is unchecked
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

        // create small buttons each player to play a sound just for them and you
        const playerSoundButton = document.createElement('div');
        playerSoundButton.classList.add('player-Sound-button');

        players.forEach((player) => {
          const playerButton = document.createElement('button');
          playerButton.classList.add('player-button');
          playerButton.innerText = player;

          playerButton.addEventListener('click', () => {
            console.log(`you clicked ${player}`);
            //playSoundForPlayers(sound.id, [player.id, currentGMId]); 
          });
        });

        soundCard.appendChild(playerSoundButton); 
        soundCard.appendChild(checkboxGroup); 
      }

      // put all children together and append to the soundsContainer
      soundsContainer.appendChild(soundCard); 
    });
  }
// end of contentArea 

// begin of EventListener
  // add EventListener for search
  searchInput.addEventListener('input', (e) => {
    currentSearch = e.target.value;
    renderSounds(permissions);
  });
  
  // add EventListener for filter
  combinedSelect.addEventListener('change', (e) => {
    currentFilter = e.target.value;
    renderSounds(permissions);
  });
// end of EventListener

// check for changed metadata to trigger notification and sound
  let lastTimestamp = 0; // prevents Caching & ensures new triggering
  let volumeSlider;
  OBR.room.onMetadataChange((metadata) => {

    // if NOTIFY_KEY has changed, send a notification to everybody in the room
    const notify = metadata[NOTIFY_KEY];
    if (notify && notify.timestamp > lastTimestamp) {
      lastTimestamp = notify.timestamp;
      OBR.notification.show(notify.message, "INFO");
      //return;
    }
    
    // if SOUND_TRIGGER_KEY has changed, play the audio file in everybodys browser
    const trigger = metadata[SOUND_TRIGGER_KEY]; // store the metadata for the sound trigger
    if (!trigger) return;
    if (trigger.timestamp > lastTimestamp) { // if new triggert
      lastTimestamp = trigger.timestamp; // update timestamp
      const audio = new Audio(trigger.audio); // updates audio
      audio.volume = volumeSlider.value; // Apply volume
      audio.play(); // play new audio
    }
  });
  

// check for new players to update checkboxes and permissions
  OBR.party.onChange((newplayer) => {
    updatePlayers(players); // update the global players array, scince someone joined or left the room
    renderSounds(permissions); // re-render to update the checkboxes
  });

// initial rendering to dislpay all sounds
  renderSounds(permissions);
}
