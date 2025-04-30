import OBR from "@owlbear-rodeo/sdk";

const METADATA_NAMESPACE = "spell-permissions";

export async function loadPermissions() {
  const metadata = await OBR.scene.getMetadata();
  return metadata[METADATA_NAMESPACE] || {};
}

export async function savePermissions(permissions) {
  // Neue Kopie erzeugen, damit die Änderung erkannt wird
  const newPermissions = structuredClone(permissions);
  await OBR.scene.setMetadata({ [METADATA_NAMESPACE]: newPermissions });
}
