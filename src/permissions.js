import OBR from "@owlbear-rodeo/sdk";

const PERMISSIONS_KEY = "com.soundboard/permissions"; // OwlBear-room Namespace for distributing permissions to sounds
const SOUND_TRIGGER_KEY = "com.soundboard/sound-trigger"; // OwlBear-room Namespace for distributing audio
const NOTIFY_KEY = "com.soundboard/global-notification"; // OwlBear-room Namespace for global notifications
const SOUND_PERMISSION_KEY = "com.soundboard/sound-enabled-for-players"; // OwlBear-room Namespace for toggeling sound permissions for players
const SOUNDDATA_KEY = "com.soundboard/sound-data"; // OwlBear-room Namespace for storing the sound data
const PLAYERSOUND_KEY = "com.soundboard/player-key"; // OwlBear-room Namespace for individual player sounds

// loadPermissions will load the PERMISSIONS_KEY from the OwlBear-Room metadata
export async function loadPermissions() {
  const metadata = await OBR.room.getMetadata();
  return metadata[PERMISSIONS_KEY] || {};
}

// savePermissions will save the argument "permissions" in the PERMISSIONS_KEY
export async function savePermissions(permissions) {
  const currentMetadata = await OBR.room.getMetadata();
  await OBR.room.setMetadata({
    ...currentMetadata,
    [PERMISSIONS_KEY]: permissions, // set permissions to PERMISSIONS_KEY
    [SOUND_TRIGGER_KEY]: { timestamp: 0 }, // reset the timesamp so the OBR.room.onMetadataChange in gmview und playerview won't trigger
    [NOTIFY_KEY]: { timestamp: 0 } // same for NOTIFY_KEY
  });
}

export async function loadSoundData() {
  const metadata = await OBR.room.getMetadata();
  return metadata[SOUNDDATA_KEY] || [];
}

// saveSoundData will save the argument "soundData" in the SOUNDDATA_KEY
export async function saveSoundData(soundData) {
  const currentMetadata = await OBR.room.getMetadata();
  await OBR.room.setMetadata({
    ...currentMetadata,
    [SOUNDDATA_KEY]: soundData, // set soundData to SOUNDDATA_KEY
    [SOUND_TRIGGER_KEY]: { timestamp: 0 }, // reset the timesamp so the OBR.room.onMetadataChange in gmview und playerview won't trigger
    [NOTIFY_KEY]: { timestamp: 0 } // same for NOTIFY_KEY
  });
}

export async function loadPermissionsKey() {
  const metadata = await OBR.room.getMetadata();
  return metadata[SOUND_PERMISSION_KEY];
}
// playSoundForAll will dirtibute the argument "audioFile" to all players in the room
export async function playSoundForAll(audioFile, volume) {
  const currentMetadata = await OBR.room.getMetadata();
  await OBR.room.setMetadata({
    ...currentMetadata,
    [SOUND_TRIGGER_KEY]: {
      audio: audioFile, // safe the name of the audio file to be played in the room/browser
      volume: volume,
      timestamp: Date.now()  // update the timestamp so the onMetadataChange in gmview.js and playerview.js will trigger
    }
  });
}

// playSoundForPlayer will dirtibute the argument "audioFile" to the "player"
export async function playSoundForPlayer(audioFile, player, volume) {
  const currentMetadata = await OBR.room.getMetadata();
  await OBR.room.setMetadata({
    ...currentMetadata,
    [PLAYERSOUND_KEY]: {
      audio: audioFile,
      player: player,
      volume: volume,
      timestamp: Date.now()
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
