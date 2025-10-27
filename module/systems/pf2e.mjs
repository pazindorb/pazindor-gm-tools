export function pf2eConfig() {
  PGT.rollOptions = pf2e.rollOptions();
  // PGT.restOptions = pf2e.restOptions(); // Check how pathfinder rest work
  PGT.onRollRequest = pf2e.rollRequest;
  // PGT.onRestRequest = pf2e.restRequest; // Check how pathfinder rest work
  PGT.conditions = pf2e.conditions();
  PGT.conditionRollKeys = pf2e.conditionRollKeys();
  PGT.applyCondition = pf2e.applyCondition;
  PGT.actorTypes = ["character"];
  PGT.systemId = "pf2e";
}

//==================================
//      REST AND ROLL REQUEST      =
//==================================
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

//==================================
//        CONDITION MANAGER        =
//==================================
export function conditions() {
  const ids = game.pf2e.ConditionManager.conditionsSlugs;
  const notConditions = ["hostile", "helpful", "friendly", "indifferent", "unfriendly"]

  const conditions = [];
  for (const [key, condition] of game.pf2e.ConditionManager.conditions.entries()) {
    if (ids.includes(key)) {
      conditions.push({
        name: condition.name,
        id: key,
        img: condition.img,
        isCondition: !notConditions.includes(key)
      })
    }
  }

  return conditions;
}

export function conditionRollKeys() {
  const rollKeys = {}
  for (const [key, save] of Object.entries(CONFIG.PF2E.saves)) {
    rollKeys[`${key}.save`] = `${game.i18n.localize(save)} ${game.i18n.localize("PGT.SAVE")}`;
  }
  return rollKeys;
}

export function applyCondition(actor, slug) {
  const manager = game.pf2e.ConditionManager;

  actor.increaseCondition(slug)
}