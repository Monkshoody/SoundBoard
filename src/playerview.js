import OBR from "@owlbear-rodeo/sdk";
import { loadPermissions, playSoundForAll, triggerGlobalNotification, loadSoundData } from "./permissions.js";

const PERMISSIONS_KEY = "com.soundboard/permissions"; // OwlBear-room Namespace for distributing permissions to sounds
const SOUND_TRIGGER_KEY = "com.soundboard/sound-trigger"; // OwlBear-room Namespace for distributing audio
const NOTIFY_KEY = "com.soundboard/global-notification"; // OwlBear-room Namespace for global notifications
const SOUND_PERMISSION_KEY = "com.soundboard/sound-enabled-for-players"; // OwlBear-room Namespace for toggeling sound permissions for players
const SOUNDDATA_KEY = "com.soundboard/sound-data"; // OwlBear-room Namespace for storing the sound data

var soundData = [];

export async function setupPlayerView(container, playerName) {
  let currentFilter = "all";
  let currentSearch = "";

  // search function for sounds
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
    ...[...new Set(soundData.map(sound => sound.category))].map(k => `category: ${k}`) // categories needs to be added dynamically (see gmview 328 existingOptions ...)
  ];

  options.forEach(opt => {
    const option = document.createElement('option');
    option.value = opt;
    option.textContent = opt;
    combinedSelect.appendChild(option);
  });

  container.appendChild(combinedSelect);
  
// main container for sounds
  const soundContainer = document.createElement('div');
  soundContainer.classList.add('sound-container');

  container.appendChild(soundContainer);

// for rerendering while searching, filtering and updateing permissions this function is used
  async function renderSounds() {
    // get updated permissions
    const permissions = await loadPermissions();
    // get updated soundData
    let newSoundData = await loadSoundData();

    // clear everything (filter, search, etc.) if there aren't any permissions
    if (!permissions[playerName] || permissions[playerName].length === 0) {
      searchInput.style.display = 'none';
      combinedSelect.style.display = 'none';
      soundContainer.innerHTML = "<p>no sounds available</p>";
    } else {
      searchInput.style.display = '';
      combinedSelect.style.display = '';
      soundContainer.style.display = '';
      soundContainer.innerHTML = ""; // emtying the playerview
    }

    // like gmview filteredsounds show generelly just available sounds, sounds for which the player has authorization
    let playerSounds = [];
    let filterSounds = [];
    permissions[playerName].forEach(soundName => {
      // find sounds for which the player has permission
      const sound = newSoundData.find(s => s.name === soundName);
      playerSounds.push(sound); // store these sounds in playerSounds
      filterSounds.push(sound);

      // filter according to search
      if (currentSearch.trim() !== "") {
        const search = currentSearch.trim().toLowerCase();
        playerSounds = playerSounds.filter(sound => sound.name.toLowerCase().includes(search));
      }

      // filter according to combined filter
      const selected = combinedSelect.value;
      if (currentFilter !== "all") {
        const category = selected.replace("category: ", "");
        playerSounds = playerSounds.filter(sound => sound.category === category);
      }
    });

    // since new sounds can be added, the filter needs to be updated to possible new categories
    const existingOptions = Array.from(combinedSelect.options).map(opt => opt.value); // get all already existing category options from combinedSelect
    const existingCategories = existingOptions
    .filter(opt => opt.startsWith("category: "))
    .map(opt => opt.replace("category: ", "")); // prepare for comparison

    const allCategories = [...new Set(filterSounds.map(sound => sound.category))]; // get all category options from metadata namespace (newSoundData)

    const newCategories = allCategories.filter(cat => !existingCategories.includes(cat)); // compare both lists existingCategories and allCategories to get new categories

    const removedCategories = existingCategories.filter(cat => !allCategories.includes(cat));
    // if GM gives access to a new sound, the filter will be updated with a new category.
    newCategories.forEach(cat => { // create for each new category an option in the dropdown menu
      const option = document.createElement('option');
      option.value = `category: ${cat}`;
      option.textContent = `category: ${cat}`;
      combinedSelect.appendChild(option);
    });
    // If the GM revoces access to sounds, the categories needs to updated since they could be obsolete
    removedCategories.forEach(cat => {
      const optionToRemove = Array.from(combinedSelect.options).find(
        opt => opt.value === `category: ${cat}`
      );
      if (optionToRemove) {
        combinedSelect.removeChild(optionToRemove);
      }
    });
    
    // sort alphabteically to the names
    playerSounds.sort((a, b) => a.name.localeCompare(b.name));
    // create cards for each filtered sound in the main container: soundContainer
    playerSounds.forEach(sound => {
      if (!sound) return;

      const card = document.createElement("div");
      card.className = "sound-card";

      // create a sound button to play the sound
      const button = document.createElement("button");
      button.textContent = sound.name;
      button.className = "sound-button";

      button.addEventListener("click", async () => {
        // await the click event, to ensure fluent sound play and notification 
        const metadata = await OBR.room.getMetadata();

        if (metadata[SOUND_PERMISSION_KEY]) { // check for permission to play sounds
          // notify everybody in the room, that the player has hit a sound
          await triggerGlobalNotification(`${playerName} played the sound "${sound.name}"!`);
          // play the audio in the room
          await playSoundForAll(sound.audio);
        } else { // if the GM muted everyone ... Players needs to be punished ^^
          await OBR.notification.show("You annoyed the GM, so you were muted. Give him a 🍪 to regain access.");
        }
      });

      card.appendChild(button);
      soundContainer.appendChild(card);
    });
  }

  // add EventListener for search
  searchInput.addEventListener('input', (e) => {
    currentSearch = e.target.value;
    renderSounds();
  });

  // add EventListener for filter
  combinedSelect.addEventListener('change', (e) => {
    currentFilter = e.target.value;
    renderSounds();
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
    
    // re-render the soundContainer
    await renderSounds();
  });

  // initial rendering to dislpay sounds
  renderSounds();
}
