import OBR from "@owlbear-rodeo/sdk";

const METADATA_NAMESPACE = "com.soundboard/permissions"; // OwlBear-room Namespace for distributing permissions to sounds
const SOUND_TRIGGER_KEY = "com.soundboard/sound-trigger"; // OwlBear-room Namespace for distributing audio
const NOTIFY_KEY = "com.soundboard/global-notification"; // OwlBear-room Namespace for global notifications
const SOUND_PERMISSION_KEY = "com.soundboard/sound-enabled-for-players"; // OwlBear-room Namespace for toggeling sound permissions for players

// loadPermissions will load the METADATA_NAMESPACE from the OwlBear-Room metadata
export async function loadPermissions() {
  const metadata = await OBR.room.getMetadata();
  return metadata[METADATA_NAMESPACE] || {};
}

// savePermissions will save the argument "permissions" in the METADATA_NAMESPACE
export async function savePermissions(permissions) {
  const currentMetadata = await OBR.room.getMetadata();
  await OBR.room.setMetadata({
    ...currentMetadata,
    [METADATA_NAMESPACE]: permissions, // set permissions to METADATA_NAMESPACE
    [SOUND_TRIGGER_KEY]: { timestamp: 0 }, // reset the timesamp so the OBR.room.onMetadataChange in gmview und playerview won't trigger
    [NOTIFY_KEY]: { timestamp: 0 } // same for NOTIFY_KEY
  });
}

// playSoundForAll will dirtibute the argument "audioFile" to all players in the room
export async function playSoundForAll(audioFile) {
  const currentMetadata = await OBR.room.getMetadata();
  await OBR.room.setMetadata({
    ...currentMetadata,
    [SOUND_TRIGGER_KEY]: {
      audio: audioFile, // safe the name of the audio file to be played in the room/browser
      timestamp: Date.now()  // update the timestamp so the onMetadataChange in gmview.js and playerview.js will trigger
    }
  });
}

// triggerGlobalNotification will set the argument "message" in the NOTIFY_KEY to notify everybody in the room
export async function triggerGlobalNotification(message) {
  const currentMetadata = await OBR.room.getMetadata();
  const timestamp = Date.now(); // update the timestamp so the onMetadataChange in gmview.js and playerview.js will trigger
  await OBR.room.setMetadata({
    ...currentMetadata,
    [NOTIFY_KEY]: { message, timestamp } 
  });
}