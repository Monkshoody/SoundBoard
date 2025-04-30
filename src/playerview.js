import OBR from "@owlbear-rodeo/sdk";
import spellData from "./spells.json";

const METADATA_NAMESPACE = "com.soundboard/permissions"; // OwlBear-Session Namespace for distributing permissions to sounds
const SOUND_TRIGGER_KEY = "com.soundboard/sound-trigger"; // OwlBear-Session Namespace for distributing audio

export async function setupPlayerView(container, playerName) {
  container.innerHTML = "<p>no sounds available</p>";

  let lastTimestamp = 0;

  OBR.scene.onMetadataChange((metadata) => {
    const trigger = metadata[SOUND_TRIGGER_KEY];
    if (!trigger) return;

    if (trigger.timestamp > lastTimestamp) {
      lastTimestamp = trigger.timestamp;
      const audio = new Audio(trigger.audio);
      audio.play();
    }
  });
}
