export function daggerheartConfig() {
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
  PGT.systemId = "daggerheart";
}

//==================================
//      REST AND ROLL REQUEST      =
//==================================
function rollOptions() {
  const actionRolls = {};
  const reactionRolls = {};

  for (const [key, trait] of Object.entries(CONFIG.DH.ACTOR.abilities)) {
    const label = game.i18n.localize(trait.label);
    actionRolls[`${key}.action`] = label;
    reactionRolls[`${key}.reaction`] = label;
  }

  return {
    "DAGGERHEART.ACTION": actionRolls,
    "DAGGERHEART.REACTION": reactionRolls
  };
}

function restOptions() {
  return {
    shortRest: game.i18n.localize("DAGGERHEART.GENERAL.RefreshType.shortrest"),
    longRest: game.i18n.localize("DAGGERHEART.GENERAL.RefreshType.longrest")
  };
}

function restRequest(actor, selected) {
  if (!["shortRest", "longRest"].includes(selected)) return;

  const Downtime = game.system.api.applications.dialogs.Downtime;
  new Downtime(actor, selected === "shortRest").render({force: true});
}

async function rollRequest(actor, selected, options={}) {
  const [trait, actionType] = selected.split(".");
  if (!CONFIG.DH.ACTOR.abilities[trait] || !["action", "reaction"].includes(actionType)) return null;

  const modifier = parseInt(options.modifier) || 0;
  const difficulty = options.rollDC == null ? undefined : parseInt(options.rollDC);
  const advantage = parseInt(options.advantage) || 0;
  const result = await actor.rollTrait(trait, {
    actionType,
    selectedMessageMode: options.rollMode || undefined,
    roll: {
      type: "trait",
      trait,
      difficulty,
      advantage,
      baseModifiers: modifier
        ? [{label: game.i18n.localize("PGT.REQUEST.DAGGERHEART.MODIFIER"), value: modifier}]
        : []
    }
  });

  if (!result) return null;
  return {_total: result.roll?.total};
}

function requestFields() {
  return {
    roll: {
      advantage: {
        element: "select",
        type: "numeric",
        options: {
          1: "PGT.REQUEST.DAGGERHEART.ADVANTAGE",
          0: "PGT.REQUEST.DAGGERHEART.NORMAL",
          "-1": "PGT.REQUEST.DAGGERHEART.DISADVANTAGE"
        },
        value: 0,
        label: "PGT.REQUEST.DAGGERHEART.ADVANTAGE_TYPE"
      },
      modifier: {
        element: "input",
        type: "numeric",
        value: 0,
        label: "PGT.REQUEST.DAGGERHEART.MODIFIER"
      },
      rollMode: {
        element: "select",
        type: "string",
        options: CONFIG.ChatMessage.modes,
        label: "PGT.REQUEST.ROLL_MODE"
      }
    }
  };
}

//==================================
//        CONDITION MANAGER        =
//==================================
function conditions() {
  return CONFIG.statusEffects
    .filter(status => status.hud !== false)
    .map(status => ({
      ...status,
      name: game.i18n.localize(status.name),
      isCondition: status.systemEffect === true
    }));
}

function conditionRollKeys() {
  const keys = {};
  for (const [key, trait] of Object.entries(CONFIG.DH.ACTOR.abilities)) {
    keys[`${key}.reaction`] = game.i18n.localize(trait.label);
  }
  return keys;
}

function applyCondition(actor, statusId) {
  return actor.toggleStatusEffect(statusId, {active: true});
}

//==================================
//      ADVENTURERS REGISTER       =
//==================================
function adventurersRegisterConfig() {
  const traitFields = [{
    id: "name",
    icon: "fa-solid fa-signature",
    label: "PGT.ADVENTURERS.CORE.NAME",
    type: "name-icon"
  }];

  for (const [key, trait] of Object.entries(CONFIG.DH.ACTOR.abilities)) {
    traitFields.push({
      id: `${key}-action`,
      label: trait.label,
      short: key.slice(0, 3).toUpperCase(),
      type: "value",
      path: `system.traits.${key}.value`,
      rollKey: `${key}.action`
    });
  }

  return {
    tabs: [
      {
        id: "core",
        icon: "fa-solid fa-book",
        label: "PGT.ADVENTURERS.TAB.CORE",
        direction: "row",
        fields: [
          {id: "name", icon: "fa-solid fa-signature", label: "PGT.ADVENTURERS.CORE.NAME", type: "name-icon"},
          {id: "hitPoints", icon: "fa-solid fa-heart", label: "DAGGERHEART.GENERAL.HitPoints", type: "current-max", pathCurrent: "system.resources.hitPoints.value", pathMax: "system.resources.hitPoints.max", editable: "numeric"},
          {id: "stress", icon: "fa-solid fa-brain", label: "DAGGERHEART.GENERAL.stress", type: "current-max", pathCurrent: "system.resources.stress.value", pathMax: "system.resources.stress.max", editable: "numeric"},
          {id: "hope", icon: "fa-solid fa-sparkles", label: "DAGGERHEART.GENERAL.hope", type: "current-max", pathCurrent: "system.resources.hope.value", pathMax: "system.resources.hope.max", editable: "numeric"},
          {id: "armor", icon: "fa-solid fa-shield", label: "DAGGERHEART.GENERAL.armor", type: "value", path: "system.armorScore.value"},
          {id: "evasion", icon: "fa-solid fa-person-running", label: "DAGGERHEART.GENERAL.evasion", type: "value", path: "system.evasion"},
          {id: "majorThreshold", icon: "fa-solid fa-heart-crack", label: "DAGGERHEART.GENERAL.DamageThresholds.majorThreshold", type: "value", path: "system.damageThresholds.major"},
          {id: "severeThreshold", icon: "fa-solid fa-skull", label: "DAGGERHEART.GENERAL.DamageThresholds.severeThreshold", type: "value", path: "system.damageThresholds.severe"},
          {id: "proficiency", icon: "fa-solid fa-dice-d6", label: "DAGGERHEART.GENERAL.proficiency", type: "value", path: "system.proficiency"}
        ]
      },
      {
        id: "rolls",
        icon: "fa-solid fa-dice-d12",
        label: "PGT.ADVENTURERS.TAB.ROLLS",
        direction: "row",
        fields: traitFields
      }
    ],
    initialTab: "core"
  };
}
