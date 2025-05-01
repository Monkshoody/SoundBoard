import OBR from "@owlbear-rodeo/sdk";
import spellData from "./spells.json";
import { loadPermissions, playSoundForAll } from "./permissions.js";

const METADATA_NAMESPACE = "com.soundboard/permissions"; // OwlBear-room Namespace for distributing permissions to sounds
const SOUND_TRIGGER_KEY = "com.soundboard/sound-trigger"; // OwlBear-room Namespace for distributing audio
const SOUND_PERMISSION_KEY = "com.soundboard/sound-enabled-for-players"; // OwlBear-room Namespace for toggeling sound permissions for players

export async function setupPlayerView(container, playerName) {
  function renderSpells(permissions) {
    if (!permissions[playerName] || permissions[playerName].length === 0) {
      container.innerHTML = "<p>no sounds available</p>";
      return;
    }
    container.innerHTML = ""; // emtying the playerview
    const playerSpells = permissions[playerName] || [];

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
        playSoundForAll(spell.audio);
      });

      card.appendChild(button);
      container.appendChild(card);
    });
  }

  const permissions = await loadPermissions();
  console.log("Permissions:", permissions);
  renderSpells(permissions);

  // check for changed metadata to trigger sound
  let lastTimestamp = 0; // prevents Caching & ensures new triggering
  OBR.room.onMetadataChange(async (metadata) => {
    const trigger = metadata[SOUND_TRIGGER_KEY]; // store the metadata for the sound trigger
    console.log("Trigger:", trigger);
    if (!trigger) return;
    console.log("Trigger timestamp:", trigger.timestamp, lastTimestamp);
    if (trigger.timestamp > lastTimestamp) { // if new triggert
      lastTimestamp = trigger.timestamp; // update timestamp
      const audio = new Audio(trigger.audio); // updates audio
      audio.play(); // play new audio
    }
    const permissions = await loadPermissions();
    renderSpells(permissions);
  });
}
