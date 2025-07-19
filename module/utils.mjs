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