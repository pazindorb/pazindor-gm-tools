export function dnd5eConfig() {
  PGT.rollOptions = rollOptions();
  PGT.restOptions = restOptions();
  PGT.onRollRequest = rollRequest;
  PGT.onRestRequest = restRequest;
  PGT.conditions = conditions();
  PGT.conditionRollKeys = conditionRollKeys();
  PGT.applyCondition = applyCondition;
  PGT.adventurersConfig = adventurersRegisterConfig();
  PGT.actorTypes = ["character"];
  PGT.systemId = "dnd5e";
}

//==================================
//      REST AND ROLL REQUEST      =
//==================================
function rollOptions() {
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

function restOptions() {
  return {
    long: game.i18n.localize("PGT.REST.DND5E.LONG"),
    short: game.i18n.localize("PGT.REST.DND5E.SHORT")
  }
}

function restRequest(actor, selected) {
  if (selected === "long") {
    actor.longRest();
  }
  if (selected === "short") {
    actor.shortRest();
  }
}

async function rollRequest(actor, selected) {
  const [key, type] = selected.split(".");

  switch(type) {
    case "ability":
      const abilityCheck = await actor.rollAbilityCheck({ability: key});
      if (!abilityCheck) return null;
      return abilityCheck[0];

    case "save":
      const savingThrow = await actor.rollSavingThrow({ability: key});
      if (!savingThrow) return null;
      return savingThrow[0];

    case "skill":
      const skillCheck = await actor.rollSkill({skill: key});
      if (!skillCheck) return null;
      return skillCheck[0];
    
    default:
      return null;
  }
}

//==================================
//        CONDITION MANAGER        =
//==================================
function conditions() {
  const conditions = Object.keys(CONFIG.DND5E.conditionTypes);

  return CONFIG.statusEffects
      .filter(cond => cond.hud !== false)
      .map(cond => {
        cond.isCondition = conditions.includes(cond.id);
        return cond;
      });
}

function conditionRollKeys() {
  const keys = {};
  for (const [key, ability] of Object.entries(CONFIG.DND5E.abilities)) {
    keys[`${key}.save`] = `${ability.label} ${game.i18n.localize("PGT.SAVE")}`;
  }
  keys["ath.skill"] = `${CONFIG.DND5E.skills["ath"].label} ${game.i18n.localize("PGT.CHECK")}`;
  keys["acr.skill"] = `${CONFIG.DND5E.skills["acr"].label} ${game.i18n.localize("PGT.CHECK")}`;
  return keys;
}

function applyCondition(actor, statusId) {
  if (statusId === "exhaustion") CONFIG.ActiveEffect.documentClass._manageExhaustion(_dummyEvent(), actor);
  else actor.toggleStatusEffect(statusId, {active: true});
}

function _dummyEvent() {
  return {
    button: 0,
    preventDefault: () => {},
    stopPropagation: () => {},
  }
}

//==================================
//      ADVENTURERS REGISTER       =
//==================================
function adventurersRegisterConfig() {
  const abilityFields = [{id: "name", icon: "fa-solid fa-signature", label: "PGT.ADVENTURERS.CORE.NAME", type: "name-icon"}];
  const saveFields = [{id: "name", icon: "fa-solid fa-signature", label: "PGT.ADVENTURERS.CORE.NAME", type: "name-icon"}];
  const skillFields = [];

  for (const [key, ability] of Object.entries(CONFIG.DND5E.abilities)) {
    abilityFields.push({
      id: `${key}-check`, 
      label: `${ability.label} ${game.i18n.localize("PGT.CHECK")}`, 
      short: key.toUpperCase(),
      type: "value", 
      path: `system.abilities.${key}.mod`, 
      rollKey: `${key}.ability`
    });
    saveFields.push({
      id: `${key}-save`, 
      label: `${ability.label} ${game.i18n.localize("PGT.SAVE")}`, 
      short: key.toUpperCase(),
      type: "value", 
      path: `system.abilities.${key}.save.value`, 
      rollKey: `${key}.save`
    });
  }

  for (const [key, skill] of Object.entries(CONFIG.DND5E.skills)) {
    skillFields.push({
      id: `${key}-check`, 
      label: `${skill.label}`, 
      type: "value", 
      path: `system.skills.${key}.mod`, 
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
          {id: "speed", icon: "fa-solid fa-boot-heeled", label: "PGT.ADVENTURERS.CORE.SPEED", type: "value", path: "system.attributes.movement.walk"},
        ]
      },
      {
        id: "ability", 
        icon: "fa-solid fa-dumbbell", 
        label: "PGT.ADVENTURERS.TAB.ABILITY", 
        direction:"row",
        fields: abilityFields
      },
      {
        id: "save", 
        icon: "fa-solid fa-shield", 
        label: "PGT.ADVENTURERS.TAB.SAVE", 
        direction:"row",
        fields: saveFields
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