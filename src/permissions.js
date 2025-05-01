import OBR from "@owlbear-rodeo/sdk";

const METADATA_NAMESPACE = "com.soundboard/permissions"; // OwlBear-room Namespace for distributing permissions to sounds
const SOUND_TRIGGER_KEY = "com.soundboard/sound-trigger"; // OwlBear-room Namespace for distributing audio
const SOUND_PERMISSION_KEY = "com.soundboard/sound-enabled-for-players"; // OwlBear-room Namespace for toggeling sound permissions for players

export async function loadPermissions() {
  const metadata = await OBR.room.getMetadata();
  return metadata[METADATA_NAMESPACE] || {};
}

export async function savePermissions(permissions) {
  await OBR.room.setMetadata({ // ist das in Ordnung oder kille ich damit alle anderen Metadata?
    [METADATA_NAMESPACE]: permissions,
    [SOUND_TRIGGER_KEY]: { timestamp: 0 } // reset the timesamp so the OBR.room.onMetadataChange in gmview und playerview won't trigger
  });
  
}

// audio function to dirtibute audio to all players in the room
export async function playSoundForAll(audioFile) {
  const meta = await OBR.room.getMetadata();
  await OBR.room.setMetadata({
    [SOUND_TRIGGER_KEY]: {
      audio: audioFile,
      timestamp: Date.now()  // prevents Caching & ensures new triggering
    }
  });
}
