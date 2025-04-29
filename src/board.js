import OBR from "@owlbear-rodeo/sdk";
import spellData from "/src/spells.json"
const METADATA_NAMESPACE = "spell-permissions";

export async function setupGMView(container, players = []) {
  const permissions = await loadPermissions();
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
          if (!permissions[player]) permissions[player] = [];
          if (checkbox.checked) {
            if (!permissions[player].includes(spell.name)) {
              permissions[player].push(spell.name);
            }
          } else {
            permissions[player] = permissions[player].filter(s => s !== spell.name);
          }
          await savePermissions(permissions);
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

export async function setupPlayerView(playerName) {
  const permissions = await loadPermissions();
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

  // Live-Update für Spieler, falls der GM Änderungen vornimmt
  OBR.scene.onMetadataChange(({ metadata }) => {
    if (metadata[METADATA_NAMESPACE]) {
      setupPlayerView(playerName); // komplette Ansicht neu rendern
    }
  });
}

async function loadPermissions() {
  const metadata = await OBR.scene.getMetadata();
  return metadata[METADATA_NAMESPACE] || {};
}

async function savePermissions(permissions) {
  await OBR.scene.setMetadata({ [METADATA_NAMESPACE]: permissions });
}

