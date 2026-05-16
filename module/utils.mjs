export function keybindToText(keybind) {
  if (!keybind) return "";
  if (!keybind[0]) return "";
  let humanized = foundry.applications.sidebar.apps.ControlsConfig.humanizeBinding(keybind[0]);
  humanized = humanized.replace("Control", "Ctrl");
  return humanized;
}

export function combinedKey(actor) {
  let combinedKey = actor.id;
  if (actor.token) combinedKey += actor.token.id;
  return combinedKey;
}