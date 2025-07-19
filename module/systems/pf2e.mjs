export function rollOptions() {
  const rollOptions = {};
  rollOptions["perception.perception"] = game.i18n.localize("PF2E.PerceptionLabel");
  for (const [key, save] of Object.entries(CONFIG.PF2E.saves)) {
    rollOptions[`${key}.save`] = game.i18n.localize(save);
  }
  for (const [key, skill] of Object.entries(CONFIG.PF2E.skills)) {
    rollOptions[`${key}.skill`] = game.i18n.localize(skill.label);
  }
  return rollOptions;
}

export function restOptions() {

}

export function restRequest(actor, selected) {
  
}

export function rollRequest(actor, selected) {
  const [key, type] = selected.split(".");

  switch(type) {
    case "perception":
      actor.perception.roll();
      break;

    case "save":
      actor.saves[key].roll();
      break;

    case "skill":
      actor.skills[key].roll();
      break;
  }
}
