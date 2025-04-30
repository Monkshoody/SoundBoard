import OBR from "@owlbear-rodeo/sdk";
import spellData from "./spells.json";

const METADATA_NAMESPACE = "spell-permissions";

export async function setupGMView(container, players = []) {
  //begin of navbar
  // navigation-bar for headdline and import/export Buttons
  const navbar = document.getElementById("navbar") || document.createElement("nav");
  navbar.classList.add("navbar");
  
  //headline in navigation-bar
  let brand = navbar.querySelector(".brand");
  if (!brand) {
    brand = document.createElement("span");
    brand.classList.add("brand");
    brand.textContent = "Spellboard";
    navbar.appendChild(brand);
  }

  // container for buttons in navigation-bar
  let navButtons = navbar.querySelector(".nav-buttons");
  if (!navButtons) {
    navButtons = document.createElement("div");
    navButtons.classList.add("nav-buttons");
    navbar.appendChild(navButtons);
  }

  // export-button
  const exportButton = document.createElement("button");
  exportButton.classList.add("nav-button");
  exportButton.title = "save permissions";
  const exportIcon = document.createElement("img");
  exportIcon.src = "./export.png";
  exportIcon.alt = "export";
  exportIcon.classList.add("nav-icon");
  exportButton.appendChild(exportIcon);

  navButtons.appendChild(exportButton);

  // import-button
  const importButton = document.createElement("button");
  importButton.classList.add("nav-button");
  importButton.title = "open permissions";
  const importIcon = document.createElement("img");
  importIcon.src = "./import.png";
  importIcon.alt = "import";
  importIcon.classList.add("nav-icon");
  importButton.appendChild(importIcon);

  navButtons.appendChild(importButton);
  // end of navbar

  // begin of contentArea 
  // search function for sounds
  let currentFilter = "all";
  let currentSearch = "";

  const searchInput = document.createElement('input');
  searchInput.type = 'text';
  searchInput.placeholder = '🔎 Search for sound name ...';
  searchInput.classList.add('search-bar');

  container.appendChild(searchInput);

  // filter for year and category
  const combinedSelect = document.createElement('select');
  combinedSelect.classList.add('combined-filter');

  const options = [
    "all",
    ...[...new Set(spellData.map(spell => spell.kategorie))].map(k => `category: ${k}`),
    ...[...new Set(spellData.map(spell => spell.jahr))].map(j => `year: ${j}`)
  ];

  options.forEach(opt => {
    const option = document.createElement('option');
    option.value = opt;
    option.textContent = opt;
    combinedSelect.appendChild(option);
  });

  container.appendChild(combinedSelect);

  // main container for sounds
  const spellsContainer = document.createElement('div');
  spellsContainer.classList.add('spells-container');

  container.appendChild(spellsContainer);

  // filter according to search
  if (currentSearch.trim() !== "") {
    const search = currentSearch.trim().toLowerCase();
    filteredSpells = filteredSpells.filter(spell => spell.name.toLowerCase().includes(search));
  }

  // filter according to combined filter
  let filteredSpells = spellData.filter(spell => spell.verfügbar); // show generelly just available sounds
  const selected = combinedSelect.value;
  if (currentFilter !== "all") {
    if (selected.startsWith("category: ")) {
      const category = selected.replace("category: ", "");
      filteredSpells = filteredSpells.filter(spell => spell.kategorie === category);
    }
    if (selected.startsWith("year: ")) {
        const year = selected.replace("year: ", "");
        filteredSpells = filteredSpells.filter(spell => spell.jahr === year);
    }
  }

  if (filteredSpells.length === 0) {
    spellsContainer.innerHTML = '<p>No sounds found.</p>';
    //return;
  }

  // create cards for each filtered sound in the main container: spellsContainer
  filteredSpells.forEach(spell => {
    const spellCard = document.createElement('div');
    spellCard.classList.add('spell-card');

    spellsContainer.appendChild(spellCard);
  
    // create a sound button to play the sound
    const button = document.createElement('button');
    button.textContent = `${spell.name}`;
    button.classList.add('spell-button');
  
    button.addEventListener('click', () => {
      const audio = new Audio(spell.audio);
      audio.play();
    });

    spellCard.appendChild(button);
  });
}
