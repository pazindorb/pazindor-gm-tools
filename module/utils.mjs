export function getValueFromPath(object, pathToValue) {
  for (var i=0, pathToValue=pathToValue.split('.'), length=pathToValue.length; i<length; i++){
    if (object === undefined || object === null) return;
    object = object[pathToValue[i]];
    if (object === undefined) return;
  };
  return object;
}

export function setValueForPath(object, path, value) {
  const keys = path.split('.');
  let currentObject = object;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];

    // If the key doesn't exist in the current object, create an empty object
    currentObject[key] = currentObject[key] || {};
    currentObject = currentObject[key];
  }

  // Set the value at the final key
  currentObject[keys[keys.length - 1]] = value;
}

export function toSelectOptions(objectArray, key, label) {
  const options = {};
  objectArray.forEach(obj => options[obj[key]] = obj[label]);
  return options;
}

export function collectActorsFromActiveUsers() {
  const activePlayers = getActivePlayers(false);

  const actors = new Map();
  for (const player of activePlayers) {
    const myActors = getActorsForPlayer(player);
    myActors.forEach(actor => actors.set(actor.id, actor));
  }
  return actors;
}

export function getActivePlayers(allowGM=false) {
  return game.users
      .filter(user => user.active)
      .filter(user => {
        if (user.isGM) return allowGM;
        else return true;
      })
}

export function getActorsForPlayer(player) {
  return game.actors.filter(actor => actor.ownership[player.id] === 3)
              .filter(actor => PGT.actorTypes.includes(actor.type))
}

export function getPlayersForActor(actor, allowGM=false) {
  return getActivePlayers(allowGM)
          .filter(player => actor.ownership[player.id] === 3)
}

export function getSelectedTokens() {
  if (canvas.activeLayer === canvas.tokens) return canvas.activeLayer.placeables.filter(p => p.controlled === true);
}

export async function getUserInput(title, selectOptions) {
  let body = "";
  if (selectOptions) {
    let optionsHTML = Object.entries(selectOptions)
          .map(([value, label]) => `<option value="${value}">${label}</option>`)
          .join("");
    body = `<select id="input" style="width: 100%; margin-top: 5px;">${optionsHTML}</select>`;
  }
  else {
    body = '<input type="text" id="input" style="width: 100%;"/>';
  }

  return new Promise((resolve) => {
    new Dialog({
      title: title,
      content: `
        <div style="padding: 10px;">
          <h4 class="divider">${title}</h4>
          ${body}
        </div>`,
      buttons: {
        ok: {
          label: game.i18n.localize("PGT.CONFIRM"),
          callback: (html) => {
            const value = html.find("#input").val();
            resolve(value);
          }
        },
        cancel: {
          label: game.i18n.localize("PGT.CLOSE"),
          callback: () => resolve(null)
        }
      },
      default: "ok",
      close: () => resolve(null)
    }).render(true);
  });
}

export function keybindToText(keybind) {
  if (!keybind) return "";
  if (!keybind[0]) return "";
  let humanized = foundry.applications.sidebar.apps.ControlsConfig.humanizeBinding(keybind[0]);
  humanized = humanized.replace("Control", "Ctrl");
  return humanized;
}