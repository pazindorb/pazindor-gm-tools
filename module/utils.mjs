export function keybindToText(keybind) {
  if (!keybind) return "";
  if (!keybind[0]) return "";
  let humanized = foundry.applications.sidebar.apps.ControlsConfig.humanizeBinding(keybind[0]);
  humanized = humanized.replace("Control", "Ctrl");
  return humanized;
}