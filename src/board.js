import OBR from "@owlbear-rodeo/sdk";
import spellData from "./spells.json";

const METADATA_NAMESPACE = "spell-permissions";

export async function setupGMView(container, players = []) {

  const navbar = document.getElementById("navbar") || document.createElement("nav");
  navbar.classList.add("navbar");
  
  let brand = navbar.querySelector(".brand");
  if (!brand) {
    brand = document.createElement("span");
    brand.classList.add("brand");
    brand.textContent = "Spellboard";
    navbar.appendChild(brand);
  }
  
  // Container für Buttons (falls nicht schon da)
  let navButtons = navbar.querySelector(".nav-buttons");
  if (!navButtons) {
    navButtons = document.createElement("div");
    navButtons.classList.add("nav-buttons");
    navbar.appendChild(navButtons);
  }

  // Export-Button
  const exportButton = document.createElement("button");
  exportButton.classList.add("nav-button");
  exportButton.title = "save permissions";
  const exportIcon = document.createElement("img");
  exportIcon.src = "./public/export.png";
  exportIcon.alt = "export";
  exportIcon.classList.add("nav-icon");
  exportButton.appendChild(exportIcon);
  exportButton.addEventListener("click", async () => {
    const permissions = await loadPermissions();
    const blob = new Blob([JSON.stringify(permissions, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "spell-permissions.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });

  // Import-Button
  const importButton = document.createElement("button");
  importButton.classList.add("nav-button");
  importButton.title = "open permissions";
  const importIcon = document.createElement("img");
  importIcon.src = "./public/import.png";
  importIcon.alt = "import";
  importIcon.classList.add("nav-icon");
  importButton.appendChild(importIcon);
  importButton.addEventListener("click", async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const text = await file.text();
      try {
        const newPermissions = JSON.parse(text);
        await savePermissions(newPermissions);
        alert("Import erfolgreich!");
        renderSpells(); // die komplette Ansicht neu laden
      } catch (err) {
        alert("Fehler beim Importieren der Datei.");
      }
    };
    input.click();
  });

  navButtons.appendChild(importButton);
  navButtons.appendChild(exportButton);

  const permissions = await loadPermissions();
  console.log("Permissions GM:", permissions);
  let currentFilter = "Alle";
  let currentSearch = "";

  const searchInput = document.createElement('input');
  searchInput.type = 'text';
  searchInput.placeholder = '🔎 Suche nach Zaubername ...';
  searchInput.classList.add('search-bar');

  const combinedSelect = document.createElement('select');
  combinedSelect.classList.add('combined-filter');

  const options = [
    "Alle",
    ...[...new Set(spellData.map(spell => spell.kategorie))].map(k => `Kategorie: ${k}`),
    ...[...new Set(spellData.map(spell => spell.jahr))].map(j => `Jahr: ${j}`)
  ];

  options.forEach(opt => {
    const option = document.createElement('option');
    option.value = opt;
    option.textContent = opt;
    combinedSelect.appendChild(option);
  });

  container.appendChild(combinedSelect);

  const spellsContainer = document.createElement('div');
  spellsContainer.classList.add('spells-container');

  container.appendChild(searchInput);
  container.appendChild(combinedSelect);
  container.appendChild(spellsContainer);

  function renderSpells() {
    spellsContainer.innerHTML = '';

    let filteredSpells = spellData.filter(spell => spell.verfügbar);

    const selected = combinedSelect.value;
    if (currentFilter !== "Alle") {
      if (selected.startsWith("Kategorie: ")) {
        const category = selected.replace("Kategorie: ", "");
        filteredSpells = filteredSpells.filter(spell => spell.kategorie === category);
      }
      if (selected.startsWith("Jahr: ")) {
          const year = selected.replace("Jahr: ", "");
          filteredSpells = filteredSpells.filter(spell => spell.jahr === year);
      }
    }

    if (currentSearch.trim() !== "") {
      const search = currentSearch.trim().toLowerCase();
      filteredSpells = filteredSpells.filter(spell => spell.name.toLowerCase().includes(search));
    }

    if (filteredSpells.length === 0) {
      spellsContainer.innerHTML = '<p>Keine Zauber gefunden.</p>';
      return;
    }

    filteredSpells.forEach(spell => {
      // Karte für Spell erstellen
      const spellCard = document.createElement('div');
      spellCard.classList.add('spell-card');
    
      // Spell-Button
      const button = document.createElement('button');
      button.textContent = `${spell.name}`;
      button.classList.add('spell-button');
    
      button.addEventListener('click', () => {
        const audio = new Audio(spell.audio);
        audio.play();
      });
    
      // Checkbox-Gruppe
      const checkboxGroup = document.createElement('div');
      checkboxGroup.classList.add('checkbox-group');
    
      players.forEach(player => {
        const label = document.createElement('label');
        label.classList.add('checkbox-label');
    
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = permissions[player]?.includes(spell.name) || false;
        //checkbox.dataset.spell = spell.name;
        //checkbox.dataset.player = player; // Für spätere Save-Logik wichtig
        checkbox.addEventListener("change", async () => {
          // Button/Checkbox deaktivieren
          checkbox.disabled = true;

          
          if (!permissions[player]) permissions[player] = [];
          if (checkbox.checked) {
            if (!permissions[player].includes(spell.name)) {
              permissions[player].push(spell.name);
            }
          } else {
            permissions[player] = permissions[player].filter(s => s !== spell.name);
          }
          await savePermissions(permissions);
          // Wieder aktivieren
          checkbox.disabled = false;
        });
    
        label.appendChild(checkbox);
        label.append(` ${player}`);
        checkboxGroup.appendChild(label);
      });
    
      // Alles zusammenfügen
      spellCard.appendChild(button);
      spellCard.appendChild(checkboxGroup);
      spellsContainer.appendChild(spellCard);
    });

    // Metadata-Listener (optional, bei mehreren GMs oder Tabs)
    OBR.scene.onMetadataChange(({ metadata }) => {
      if (metadata[METADATA_NAMESPACE]) {
        // Du könntest hier z. B. neu rendern, wenn gewünscht
        renderSpells();
      }
    });
  }

  searchInput.addEventListener('input', (e) => {
    currentSearch = e.target.value;
    renderSpells();
  });
  
  combinedSelect.addEventListener('change', (e) => {
    currentFilter = e.target.value;
    renderSpells();
  });

  // Erstes Rendern
  renderSpells();
}

export async function setupPlayerView(container, playerName) {

  function renderPlayerSpells(permissions) {
    console.log("PlayerName:", playerName);
    console.log("Spells für Spieler:", permissions[playerName]);
    if (!permissions[playerName] || permissions[playerName].length === 0) {
      container.innerHTML = "<p>no sounds available</p>";
      return;
    }
    container.innerHTML = ""; // Leeren
    const playerSpells = permissions[playerName] || [];

    playerSpells.forEach(spellName => {
      const spell = spellData.find(s => s.name === spellName);
      if (!spell) return;

      const card = document.createElement("div");
      card.className = "spell-card";

      const button = document.createElement("button");
      button.textContent = spell.name;
      button.className = "spell-button";
      button.addEventListener("click", () => new Audio(spell.audio).play());

      card.appendChild(button);
      container.appendChild(card);
    });
  }

  const permissions = await loadPermissions();
  console.log("Permissions:", permissions);
  renderPlayerSpells(permissions);

  // Live-Update für Spieler
  OBR.scene.onMetadataChange(async ({ metadata = {} }) => {
    if (metadata[METADATA_NAMESPACE]) {
      renderPlayerSpells(metadata[METADATA_NAMESPACE]);
    }
  });  
}

async function loadPermissions() {
  const metadata = await OBR.scene.getMetadata();
  return metadata[METADATA_NAMESPACE] || {};
}

async function savePermissions(permissions) {
  // Neue Kopie erzeugen, damit die Änderung erkannt wird
  const newPermissions = structuredClone(permissions);
  await OBR.scene.setMetadata({ [METADATA_NAMESPACE]: newPermissions });
}

