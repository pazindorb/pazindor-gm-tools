export function rollOptions() {
  const rollOptions = {
    ["DND5E.ABILITY"]: {},
    ["DND5E.SAVE"]: {},
    ["DND5E.SKILL"]: {}
  };
  for (const [key, ability] of Object.entries(CONFIG.DND5E.abilities)) {
    rollOptions["DND5E.ABILITY"][`${key}.ability`] = `${ability.label} ${game.i18n.localize("PGT.CHECK")}`;
  }
  for (const [key, ability] of Object.entries(CONFIG.DND5E.abilities)) {
    rollOptions["DND5E.SAVE"][`${key}.save`] = `${ability.label} ${game.i18n.localize("PGT.SAVE")}`;
  }
  for (const [key, skill] of Object.entries(CONFIG.DND5E.skills)) {
    rollOptions["DND5E.SKILL"][`${key}.skill`] = `${skill.label} ${game.i18n.localize("PGT.CHECK")}`;
  }
  return rollOptions;
}

export function restOptions() {
  return {
    long: game.i18n.localize("PGT.REST.DND5E.LONG"),
    short: game.i18n.localize("PGT.REST.DND5E.SHORT")
  }
}

export function restRequest(actor, selected) {
  if (selected === "long") {
    actor.longRest();
  }
  if (selected === "short") {
    actor.shortRest();
  }
}

export async function rollRequest(actor, selected) {
  const [key, type] = selected.split(".");

  switch(type) {
    case "ability":
      const abilityCheck = await actor.rollAbilityCheck({ability: key});
      return abilityCheck[0];

    case "save":
      const savingThrow = await actor.rollSavingThrow({ability: key});
      return savingThrow[0];

    case "skill":
      const skillCheck = await actor.rollSkill({skill: key});
      return skillCheck[0];
    
    default:
      return null;
  }
}
