export function rollOptions() {
  const rollOptions = {};
  for (const [key, ability] of Object.entries(CONFIG.DND5E.abilities)) {
    rollOptions[`${key}.ability`] = `${ability.label} ${game.i18n.localize("PGMT.check")}`;
  }
  for (const [key, ability] of Object.entries(CONFIG.DND5E.abilities)) {
    rollOptions[`${key}.save`] = `${ability.label} ${game.i18n.localize("PGMT.save")}`;
  }
  for (const [key, skill] of Object.entries(CONFIG.DND5E.skills)) {
    rollOptions[`${key}.skill`] = `${skill.label} ${game.i18n.localize("PGMT.check")}`;
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
    case "ability":
      actor.rollAbilityCheck({ability: key});
      break;

    case "save":
      actor.rollSavingThrow({ability: key});
      break;

    case "skill":
      actor.rollSkill({skill: key});
      break;
  }
}
