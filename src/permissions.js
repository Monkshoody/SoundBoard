import OBR from "@owlbear-rodeo/sdk";
import spellData from "./spells.json";

const METADATA_NAMESPACE = "spell-permissions";

async function loadPermissions() {
  const metadata = await OBR.scene.getMetadata();
  return metadata[METADATA_NAMESPACE] || {};
}

async function savePermissions(permissions) {
  // Neue Kopie erzeugen, damit die Änderung erkannt wird
  const newPermissions = structuredClone(permissions);
  await OBR.scene.setMetadata({ [METADATA_NAMESPACE]: newPermissions });
}
