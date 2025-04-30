import OBR from "@owlbear-rodeo/sdk";
import spellData from "./spells.json";

const METADATA_NAMESPACE = "spell-permissions";

export async function setupGMView(container, players = []) {
  container.innerHTML = "<p>Test Seite</p>";
}

export async function setupPlayerView(container, playerName) {
  container.innerHTML = "<p>no sounds available</p>";
}
