export function dc20Config() {
  PGT.rollOptions = rollOptions();
  PGT.restOptions = restOptions();
  PGT.onRollRequest = rollRequest;
  PGT.onRestRequest = restRequest;
  PGT.requestFields = requestFields();
  PGT.conditions = conditions();
  PGT.conditionRollKeys = conditionRollKeys();
  PGT.applyCondition = applyCondition;
  PGT.conditionExtraFields = conditionExtraFields();
  PGT.adventurersConfig = adventurersRegisterConfig();
  PGT.pcActorTypes = ["character"];
  PGT.systemId = "dc20rpg";
}

//==================================
//      REST AND ROLL REQUEST      =
//==================================
function rollOptions() {
  const rollOptions = {
    ["DC20.BASIC"]: {},
    ["DC20.SKILL"]: {},
    ["DC20.TRADE"]: {}
  };
  for (const [key, label] of Object.entries(CONFIG.DC20RPG.ROLL_KEYS.baseChecks)) {
    rollOptions["DC20.BASIC"][`${key}.basic`] = `${label}`;
  }
  for (const [key, label] of Object.entries(CONFIG.DC20RPG.ROLL_KEYS.attributeChecks)) {
    rollOptions["DC20.BASIC"][`${key}.attribute`] = `${label}`;
  }
  for (const [key, label] of Object.entries(CONFIG.DC20RPG.ROLL_KEYS.saveTypes)) {
    rollOptions["DC20.BASIC"][`${key}.save`] = `${label}`;
  }
  for (const [key, label] of Object.entries(CONFIG.DC20RPG.ROLL_KEYS.skillChecks)) {
    rollOptions["DC20.SKILL"][`${key}.skill`] = `${label}`;
  }
  for (const [key, label] of Object.entries(CONFIG.DC20RPG.ROLL_KEYS.tradeChecks)) {
    rollOptions["DC20.TRADE"][`${key}.trade`] = `${label}`;
  }
  return rollOptions;
}

async function rollRequest(actor, selected, options={}) {
  const [key, type] = selected.split(".");
  if (!type) return null;

  const rollOptions = {
    initialRollMenuValue: {adv: (parseInt(options.adv) || 0), dis: (parseInt(options.dis) || 0), modifier: ""},
    messageMode: options.rollMode
  }

  if (type === "save") return await actor.roll(key, "save", rollOptions);
  else return await actor.roll(key, "check", rollOptions);
}

function restOptions() {
  return CONFIG.DC20RPG.DROPDOWN_DATA.restTypes
}

function restRequest(actor, selected) {
  actor.rest({preselected: selected, sendToActorOwners: true})
}

function requestFields() {
  return {
    roll: {
      rollMode: {
        element: "select",
        type: "string",
        options: CONFIG.ChatMessage.modes,
        label: "PGT.REQUEST.ROLL_MODE"
      },
      adv: {
        element: "input",
        type: "numeric",
        label: "PGT.REQUEST.DC20.ADV"
      },
      dis: {
        element: "input",
        type: "numeric",
        label: "PGT.REQUEST.DC20.DIS"
      }
    }
  }
}

//==================================
//        CONDITION MANAGER        =
//==================================
function conditions() {
  return CONFIG.statusEffects
      .filter(cond => !cond.system.hide)
      .map(cond => {
        cond.isCondition = cond.system.condition;
        return cond;
      });
}

function conditionRollKeys() {
  const keys = {};
  for (const [key, label] of Object.entries(CONFIG.DC20RPG.ROLL_KEYS.saveTypes)) {
    keys[`${key}.save`] = `${label}`;
  }
  keys[`mar.basic`] = CONFIG.DC20RPG.ROLL_KEYS.baseChecks.mar;
  keys[`spe.basic`] = CONFIG.DC20RPG.ROLL_KEYS.baseChecks.spe;
  keys[`att.basic`] = CONFIG.DC20RPG.ROLL_KEYS.baseChecks.att;
  return keys;
}

function applyCondition(actor, statusId, extraValues) {
  const options = {active: true, extras: {
    untilFirstTimeTriggered: extraValues.untilFirstTimeTriggered,
    untilTargetNextTurnEnd: extraValues.untilTargetNextTurnEnd,
    untilTargetNextTurnStart: extraValues.untilTargetNextTurnStart
  }}
  
  // Duration
  const duration = parseInt(extraValues.duration);
  if (duration) options.extras.forXRounds = duration;
  // Repeated Save
  const repeatedSaveDC = parseInt(extraValues.repeatedSaveDC);
  if (extraValues.repeatedSaveKey && repeatedSaveDC) {
    options.extras.repeatedSave = true;
    options.extras.repeatedSaveKey = extraValues.repeatedSaveKey;
    options.extras.against = repeatedSaveDC
    options.extras.id = statusId
  }
  actor.toggleStatusEffect(statusId, options);
}

function conditionExtraFields() {
  return {
    removeTrigger: {
      element: "multi-checkbox",
      type: "activable",
      label: "PGT.CONDITION.DC20.REMOVE_TRIGGER",
      elements: {
        untilFirstTimeTriggered: {label: "PGT.CONDITION.DC20.UNTIL_TRIGGERED", value: false},
        untilTargetNextTurnStart: {label: "PGT.CONDITION.DC20.UNTIL_START_TURN", value: false},
        untilTargetNextTurnEnd: {label: "PGT.CONDITION.DC20.UNTIL_END_TURN", value: false}
      }
    },
    duration: {
      element: "input",
      type: "numeric",
      label: "PGT.CONDITION.DC20.DURATION"
    },
    repeatedSaveKey: {
      element: "select",
      type: "string",
      label: "PGT.CONDITION.DC20.REPEATED_KEY",
      options: CONFIG.DC20RPG.ROLL_KEYS.saveTypes,
    },
    repeatedSaveDC: {
      element: "input",
      type: "numeric",
      label: "PGT.CONDITION.DC20.REPEATED_DC"
    }
  }
}

//==================================
//      ADVENTURERS REGISTER       =
//==================================
function adventurersRegisterConfig() {
  const attributeFields = [{id: "name", icon: "fa-solid fa-signature", label: "PGT.ADVENTURERS.CORE.NAME", type: "name-icon"}];
  for (const [key, label] of Object.entries(CONFIG.DC20RPG.ROLL_KEYS.attributeChecks)) {
    attributeFields.push({id: `${key}-check`, label: label, short: key.toUpperCase(), type: "value", path: `system.attributes.${key}.check`, rollKey: `${key}.attribute`});
  }
  
  const saveFields = [{id: "name", icon: "fa-solid fa-signature", label: "PGT.ADVENTURERS.CORE.NAME", type: "name-icon"}];
  for (const [key, label] of Object.entries(CONFIG.DC20RPG.ROLL_KEYS.saveTypes)) {
    let path = `system.attributes.${key}.save`;
    if (key === "phy") path = "system.special.phySave";
    if (key === "men") path = "system.special.menSave";
    saveFields.push({id: `${key}-save`, label: label, short: key.toUpperCase(), type: "value", path: path, rollKey: `${key}.save`});
  }

  const skillFields = [];
  for (const [key, label] of Object.entries(CONFIG.DC20RPG.skills)) {
    skillFields.push({id: `${key}-skill`, label: label, type: "value", path: `system.skills.${key}.modifier`, rollKey: `${key}.skill`});
  }

  const languageFields = []
  for (const [key, label] of Object.entries(CONFIG.DC20RPG.languages)) {
    languageFields.push({id: `${key}-lang`, label: label, type: "custom", customResolver: _langCustomResolver, key: key})
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
          {id: "health", icon: "fa-solid fa-heart", label: "dc20rpg.resources.health", type: "current-max", pathCurrent: "system.resources.health.current", pathMax: "system.resources.health.max", editable: "numeric"},
          {id: "stamina", icon: "fa-solid fa-hand-fist", label: "dc20rpg.resources.stamina", type: "current-max", pathCurrent: "system.resources.stamina.value", pathMax: "system.resources.stamina.max", editable: "numeric"},
          {id: "mana", icon: "fa-solid fa-star", label: "dc20rpg.resources.mana", type: "current-max", pathCurrent: "system.resources.mana.value", pathMax: "system.resources.mana.max", editable: "numeric"},
          {id: "restPoints", icon: "fa-solid fa-campground", label: "dc20rpg.resources.restPoints", type: "current-max", pathCurrent: "system.resources.restPoints.value", pathMax: "system.resources.restPoints.max", editable: "numeric"},
          {id: "move", icon: "fa-solid fa-person-walking", label: "dc20rpg.speed.ground", type: "value", path: "system.movement.ground.value"},
          {id: "jump", icon: "fa-solid fa-up", label: "dc20rpg.speed.jump", type: "value", path: "system.jump.value"},
        ]
      },
      {
        id: "combat", 
        icon: "fa-solid fa-swords", 
        label: "PGT.ADVENTURERS.TAB.COMBAT", 
        direction:"row",
        fields: [
          {id: "name", icon: "fa-solid fa-signature", label: "PGT.ADVENTURERS.CORE.NAME", type: "name-icon"},
          {id: "health", icon: "fa-solid fa-heart", label: "dc20rpg.resources.health", type: "current-max", pathCurrent: "system.resources.health.current", pathMax: "system.resources.health.max", editable: "numeric"},
          {id: "pd", icon: "fa-solid fa-shield", label: "dc20rpg.defence.precision", type: "value", path: "system.defences.precision.normal"},
          {id: "ad", icon: "fa-solid fa-globe", label: "dc20rpg.defence.area", type: "value", path: "system.defences.area.normal"},
          {id: "pdr", icon: "fa-solid fa-axe-battle", label: "dc20rpg.damageReduction.pdr", type: "value", path: "system.damageReduction.pdr.active"},
          {id: "edr", icon: "fa-solid fa-fire-flame-curved", label: "dc20rpg.damageReduction.edr", type: "value", path: "system.damageReduction.edr.active"},
          {id: "mdr", icon: "fa-solid fa-brain", label: "dc20rpg.damageReduction.mdr", type: "value", path: "system.damageReduction.mdr.active"},
          {id: "attack", icon: "fa-regular fa-dice-d20", label: "PGT.ADVENTURERS.COMBAT.DC20.ATTACK_MOD", type: "value", path: "system.attackMod.value.martial"},
          {id: "saveDC", icon: "fa-solid fa-share", label: "PGT.ADVENTURERS.COMBAT.DC20.SAVE_DC", type: "value", path: "system.saveDC.value.spell"},
        ]
      },
      {
        id: "attributes", 
        icon: "fa-solid fa-dumbbell", 
        label: "PGT.ADVENTURERS.DC20.TAB.ATTRIBUTES", 
        direction:"row",
        fields: attributeFields
      },
      {
        id: "saves", 
        icon: "fa-solid fa-shield", 
        label: "PGT.ADVENTURERS.DC20.TAB.SAVES", 
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
      {
        id: "languages", 
        icon: "fa-solid fa-comments", 
        label: "PGT.ADVENTURERS.TAB.LANGUAGES", 
        direction:"column",
        fields: languageFields
      },
    ],
    initialTab: "core",
  }
}

function _langCustomResolver(actor, field) {
  const mastery = actor?.skillAndLanguage?.languages?.[field.key]?.mastery || 0;
  if (mastery === 1) return `<i style="width: 100%;" class="fa-solid fa-circle-half-stroke" data-tooltip="${game.i18n.localize("dc20rpg.languageLevel.limited")}"></i>`;
  if (mastery === 2) return `<i style="width: 100%;" class="fa-solid fa-circle" data-tooltip="${game.i18n.localize("dc20rpg.languageLevel.fluent")}"></i>`;
  return "";
}