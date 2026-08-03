export function pf2eConfig() {
  PGT.rollOptions = rollOptions();
  PGT.restOptions = restOptions();
  PGT.onRollRequest = rollRequest;
  PGT.onRestRequest = restRequest;
  PGT.requestFields = requestFields();
  PGT.conditions = conditions();
  PGT.conditionRollKeys = conditionRollKeys();
  PGT.applyCondition = applyCondition;
  PGT.adventurersConfig = adventurersRegisterConfig();
  PGT.pcActorTypes = ["character"];
  PGT.systemId = "pf2e";
}

//==================================
//      REST AND ROLL REQUEST      =
//==================================
export function rollOptions() {
  const rollOptions = {
    ["PF2E.BASIC"]: {},
    ["PF2E.SKILL"]: {},
    ["PF2E.ACTION"]: pf2eActionOptions()
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

function pf2eActionOptions() {
  const options = {
    "treatWounds.action": game.i18n.localize("PF2E.Actions.TreatWounds.Label"),
    "battleMedicine.action": game.i18n.localize("PGT.REQUEST.PF2E.BATTLE_MEDICINE"),
    "earnIncome.action": game.i18n.localize("PF2E.Actions.EarnIncome.Title"),
    "encouragingWords.action": game.i18n.localize("PF2E.Actions.EncouragingWords.Title"),
    "recovery.action": game.i18n.localize("PF2E.Check.Specific.Recovery")
  };

  for (const action of game.pf2e.actions.values()) {
    if (action.section !== "skill" || typeof action.preview !== "function") continue;

    const label = game.i18n.localize(action.name);
    const variants = [...action.variants.values()];
    if (variants.length <= 1) {
      options[`${action.slug}.action`] = label;
      continue;
    }

    for (const variant of variants) {
      const variantLabel = variant.name ? game.i18n.localize(variant.name) : variant.slug;
      options[`${action.slug}|${variant.slug}.action`] = `${label} - ${variantLabel}`;
    }
  }

  return options;
}

export function restOptions() {
  return {
    rest: game.i18n.localize("PGT.REST.PF2E.REST"),
  }
}

export function restRequest(actor, selected) {
  if (selected === "rest") {
    game.pf2e.actions.restForTheNight({actors: [actor]})
  }
}

export async function rollRequest(actor, selected, options={}) {
  const [key, type] = selected.split(".");

  switch(type) {
    case "perception":
      return await actor.perception.roll(options);

    case "save":
      return await actor.saves[key].roll(options);

    case "skill":
      return await actor.skills[key].roll(options);

    case "action":
      return await actionRoll(actor, key, options);
  }
}

async function actionRoll(actor, key, options) {
  if (key === "treatWounds") {
    await game.pf2e.actions.treatWounds({actors: [actor]});
    return {skip: true};
  }

  if (key === "battleMedicine") {
    const {rollDC, ...rollOptions} = options;
    return await actor.skills.medicine.roll({
      ...rollOptions,
      dc: {value: Number.isFinite(rollDC) ? rollDC : 15, visible: true},
      extraRollOptions: ["action:battle-medicine"],
      label: game.i18n.localize("PGT.REQUEST.PF2E.BATTLE_MEDICINE"),
      traits: ["healing", "manipulate"]
    });
  }

  if (key === "earnIncome") {
    game.pf2e.actions.earnIncome(actor);
    return {skip: true};
  }

  if (key === "encouragingWords") {
    game.pf2e.actions.encouragingWords({actors: [actor]});
    return {skip: true};
  }

  if (key === "recovery") {
    return await actor.rollRecovery();
  }

  const [slug, variant] = key.split("|");
  const action = game.pf2e.actions.get(slug);
  if (!action) return null;

  const results = await action.use({
    actors: [actor],
    difficultyClass: Number.isFinite(options.rollDC) ? options.rollDC : undefined,
    variant: variant || undefined
  });
  return results?.[0]?.roll ?? {skip: true};
}

function requestFields() {
  return {
    roll: {
      messageMode: {
        element: "select",
        type: "string",
        options: CONFIG.ChatMessage.modes,
        label: "PGT.REQUEST.ROLL_MODE"
      }
    }
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
  actor.increaseCondition(slug);
}

//==================================
//      ADVENTURERS REGISTER       =
//==================================
function adventurersRegisterConfig() {
  const rollFields = [{id: "name", icon: "fa-solid fa-signature", label: "PGT.ADVENTURERS.CORE.NAME", type: "name-icon"}];
  const skillFields = [];

  rollFields.push({
    id: `perception`, 
    label: `${game.i18n.localize("PF2E.PerceptionLabel")}`, 
    icon: "fa-solid fa-eye",
    type: "value", 
    path: `system.perception.value`, 
    rollKey: `perception.perception`
  });
  const icons = {
    fortitude: "fa-solid fa-hand-fist",
    reflex: "fa-solid fa-rabbit-running",
    will: "fa-solid fa-brain"
  }
  for (const [key, save] of Object.entries(CONFIG.PF2E.saves)) {
    rollFields.push({
      id: `${key}-save`, 
      label: `${game.i18n.localize(save)}`, 
      icon: icons[key],
      type: "value", 
      path: `system.saves.${key}.value`, 
      rollKey: `${key}.save`
    });
  }

  for (const [key, skill] of Object.entries(CONFIG.PF2E.skills)) {
    skillFields.push({
      id: `${key}-check`, 
      label: `${skill.label}`, 
      type: "value", 
      path: `system.skills.${key}.value`, 
      rollKey: `${key}.skill`
    });
  }

  return {
    tabs: [
      {
        id: "core", 
        icon: "fa-solid fa-book", 
        label: "PGT.ADVENTURERS.TAB.CORE", 
        direction:"row",
        fields: [
          {id: "name", icon: "fa-solid fa-signature", label: "PGT.ADVENTURERS.CORE.NAME", type: "name-icon"},
          {id: "health", icon: "fa-solid fa-heart", label: "PGT.ADVENTURERS.CORE.HEALTH", type: "current-max", pathCurrent: "system.attributes.hp.value", pathMax: "system.attributes.hp.max", editable: "numeric"},
          {id: "ac", icon: "fa-solid fa-shield", label: "PGT.ADVENTURERS.CORE.AC", type: "value", path: "system.attributes.ac.value"},
          {id: "speed", icon: "fa-solid fa-boot-heeled", label: "PGT.ADVENTURERS.CORE.SPEED", type: "value", path: "system.movement.speeds.land.value"},
          {id: "perceptionDC", icon: "fa-solid fa-eye", label: `PF2E.Check.DC.Specific.perception`, type: "value", path: "system.perception.dc"},
        ]
      },
      {
        id: "rolls", 
        icon: "fa-regular fa-dice-d20", 
        label: "PGT.ADVENTURERS.TAB.ROLLS", 
        direction:"row",
        fields: rollFields
      },
      {
        id: "skills", 
        icon: "fa-solid fa-pen-ruler", 
        label: "PGT.ADVENTURERS.TAB.SKILL", 
        direction:"column",
        fields: skillFields
      },
    ],
    initialTab: "core",
  }
}
