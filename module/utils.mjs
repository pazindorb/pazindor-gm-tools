export function handleProgressTrackerOnRollOutcomeDefault(trackerKey, rollRequest, roll) {
    let action = "none";
    if (rollRequest.outcome === "success" && rollRequest.tracker.success) action = rollRequest.tracker.success;
    if (rollRequest.outcome === "fail" && rollRequest.tracker.fail) action = rollRequest.tracker.fail;

    if (action === "increase") window.trackerWindow.increase(trackerKey, rollRequest.actor.uuid);
    if (action === "reduce") window.trackerWindow.reduce(trackerKey, rollRequest.actor.uuid);
}

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

export function mapExtraFieldsToValues(extraFields) {
  if (!extraFields) return {};

  const values = {};
  for (const [key, field] of Object.entries(extraFields)) {
    if (field.elements) {
      for (const [elemKey, elem] of Object.entries(field.elements)) {
        values[elemKey] = elem.value;
      }
    }
    else {
      values[key] = field.value;
    }
  }
  return values;
}