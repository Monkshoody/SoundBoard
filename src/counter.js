import OBR from "@owlbear-rodeo/sdk";

export function setupCounter(element) {
  let counter = 0

  const setCounter = (count) => {
    counter = count;
    element.innerHTML = `count is ${counter}`;
    //OBR.notification.show(`count is ${counter}`);
 
    // Hole die Rolle des Spielers
    OBR.player.getRole().then(role => {
      OBR.notification.show(`${role} hits Count.`);
    });
  }
  element.addEventListener('click', () => setCounter(counter + 1))
  setCounter(0)
}
