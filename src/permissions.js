import OBR from "@owlbear-rodeo/sdk";
import spells from './spells.json'; // Annahme: deine Zauber liegen hier

export async function setupPermissions(container) {
  const party = await OBR.party.getPlayers();

  const wrapper = document.createElement('div');
  wrapper.classList.add('permissions-wrapper');

  // Spell-Namen für Autocomplete
  const spellNames = spells.filter(spell => spell.verfügbar).map(spell => spell.name);

  party.forEach(player => {
    const playerDiv = document.createElement('div');
    playerDiv.classList.add('player-entry');

    const nameLabel = document.createElement('label');
    nameLabel.textContent = player.name || player.id;
    nameLabel.classList.add('player-name');

    const inputField = document.createElement('input');
    inputField.type = 'text';
    inputField.placeholder = 'Zauber eingeben...';
    inputField.classList.add('spell-input');
    inputField.dataset.playerId = player.id;

    // Autocomplete hinzufügen
    inputField.addEventListener('input', (e) => {
      const value = e.target.value;
      closeAllLists();
    
      // Splitte bei Semikolon und hole das letzte Fragment
      const parts = value.split(';').map(p => p.trim());
      const lastPart = parts[parts.length - 1];
    
      if (!lastPart) return;
    
      const list = document.createElement('div');
      list.setAttribute('id', e.target.id + 'autocomplete-list');
      list.setAttribute('class', 'autocomplete-items');
      e.target.parentNode.appendChild(list);
    
      spellNames.forEach(spellName => {
        if (spellName.toLowerCase().startsWith(lastPart.toLowerCase())) {
          const item = document.createElement('div');
          item.innerHTML = "<strong>" + spellName.substr(0, lastPart.length) + "</strong>";
          item.innerHTML += spellName.substr(lastPart.length);
          item.innerHTML += `<input type='hidden' value='${spellName}'>`;
    
          item.addEventListener('click', () => {
            parts[parts.length - 1] = spellName; // Ersetze nur das letzte Fragment
            e.target.value = parts.join('; ') + '; '; // Setze das Eingabefeld neu
            closeAllLists();
          });
    
          list.appendChild(item);
        }
      });
    });
    

    function closeAllLists(elmnt) {
      const items = document.getElementsByClassName('autocomplete-items');
      for (let i = 0; i < items.length; i++) {
        if (elmnt !== items[i] && elmnt !== inputField) {
          items[i].parentNode.removeChild(items[i]);
        }
      }
    }

    document.addEventListener('click', (e) => {
      closeAllLists(e.target);
    });

    playerDiv.appendChild(nameLabel);
    playerDiv.appendChild(inputField);
    wrapper.appendChild(playerDiv);
  });

  container.appendChild(wrapper);
}
