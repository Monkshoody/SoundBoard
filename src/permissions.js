import OBR from "@owlbear-rodeo/sdk";

const METADATA_NAMESPACE = "com.soundboard/permissions"; // OwlBear-room Namespace for distributing permissions to sounds
const SOUND_TRIGGER_KEY = "com.soundboard/sound-trigger"; // OwlBear-room Namespace for distributing audio
const NOTIFY_KEY = "com.soundboard/global-notification"; // OwlBear-room Namespace for global notifications
const SOUND_PERMISSION_KEY = "com.soundboard/sound-enabled-for-players"; // OwlBear-room Namespace for toggeling sound permissions for players

export async function loadPermissions() {
  const metadata = await OBR.room.getMetadata();
  return metadata[METADATA_NAMESPACE] || {};
}

export async function savePermissions(permissions) {
  const currentMetadata = await OBR.room.getMetadata();
  await OBR.room.setMetadata({ // ist das in Ordnung oder kille ich damit alle anderen Metadata?
    ...currentMetadata,
    [METADATA_NAMESPACE]: permissions,
    [SOUND_TRIGGER_KEY]: { timestamp: 0 }, // reset the timesamp so the OBR.room.onMetadataChange in gmview und playerview won't trigger
    [NOTIFY_KEY]: { timestamp: 0 } // same for NOTIFY_KEY
  });
}

// audio function to dirtibute audio to all players in the room
export async function playSoundForAll(audioFile) {
  const currentMetadata = await OBR.room.getMetadata();
  await OBR.room.setMetadata({
    ...currentMetadata,
    [SOUND_TRIGGER_KEY]: {
      audio: audioFile,
      timestamp: Date.now()  // prevents Caching & ensures new triggering
    }
  });
  const metad = await OBR.room.getMetadata();
  console.log("metadata after change", metad);
}

// set Nemaspace metadata NOTIFY_KEY with new message for all members in room
export async function triggerGlobalNotification(message) {
  const currentMetadata = await OBR.room.getMetadata();
  const timestamp = Date.now();
  await OBR.room.setMetadata({
    ...currentMetadata,
    [NOTIFY_KEY]: { message, timestamp }
  });
}