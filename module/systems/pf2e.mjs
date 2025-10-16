export function rollOptions() {
  const rollOptions = {
    ["PF2E.BASIC"]: {},
    ["PF2E.SKILL"]: {}
  };
  rollOptions["PF2E.BASIC"]["perception.perception"] = `${game.i18n.localize("PF2E.PerceptionLabel")} ${game.i18n.localize("PGT.CHECK")}`;
  for (const [key, save] of Object.entries(CONFIG.PF2E.saves)) {
    rollOptions["PF2E.BASIC"][`${key}.save`] = `${game.i18n.localize(save)} ${game.i18n.localize("PGT.SAVE")}`;
  }
  for (const [key, skill] of Object.entries(CONFIG.PF2E.skills)) {
    rollOptions["PF2E.SKILL"][`${key}.skill`] = `${game.i18n.localize(skill.label)} ${game.i18n.localize("PGT.CHECK")}`;
  }
  return rollOptions;
}

export function restOptions() {
  return {
    rest: game.i18n.localize("PGT.REST.PF2E.REST"),
  }
}

export function restRequest(actor, selected) {
  if (selected === "rest") {
    // Check how pathfinder rest work
  }
}

export async function rollRequest(actor, selected) {
  const [key, type] = selected.split(".");

  switch(type) {
    case "perception":
      return await actor.perception.roll();

    case "save":
      return await actor.saves[key].roll();

    case "skill":
      return await actor.skills[key].roll();
  }
}
