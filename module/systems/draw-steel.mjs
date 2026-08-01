export function drawSteelConfig() {
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
  PGT.pcActorTypes = ["hero"];
  PGT.systemId = "draw-steel";
}

//==================================
//      REST AND ROLL REQUEST      =
//==================================
export function rollOptions() {
  const tests = {};
  for (const [key, characteristic] of Object.entries(ds.CONFIG.characteristics)) {
    tests[`${key}.characteristic`] = characteristic.label;
  }
  return { "DRAW_STEEL.TESTS": tests };
}

export function restOptions() {
  return {
    respite: game.i18n.localize("DRAW_STEEL.Actor.hero.TakeRespite")
  };
}

export function restRequest(actor, selected) {
  if (selected === "respite") actor.system.takeRespite();
}

export async function rollRequest(actor, selected, options={}) {
  const [key, type] = selected.split(".");
  if (type !== "characteristic" || !ds.CONFIG.characteristics[key]) return null;

  const config = {
    edges: Math.min((options.edges || 0), 2),
    banes: Math.min((options.banes || 0), 2),
    bonuses: options.bonuses
  };
  const message = await actor.rollCharacteristic(key, config);
  return message?.rolls?.[0] ?? null;
}

function requestFields() {
  return {
    roll: {
      edges: {
        element: "input",
        type: "numeric",
        label: "PGT.REQUEST.DRAW_STEEL.EDGES"
      },
      banes: {
        element: "input",
        type: "numeric",
        label: "PGT.REQUEST.DRAW_STEEL.BANES"
      },
      bonuses: {
        element: "input",
        type: "numeric",
        label: "PGT.REQUEST.DRAW_STEEL.BONUSES"
      },
      rollMode: {
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
  const conditionIds = new Set(Object.keys(ds.CONFIG.conditions));
  return Object.values(CONFIG.statusEffects)
    .filter(status => status.hud !== false)
    .map(status => ({
      ...status,
      isCondition: conditionIds.has(status.id)
    }));
}

export function conditionRollKeys() {
  const keys = {};
  for (const [key, characteristic] of Object.entries(ds.CONFIG.characteristics)) {
    keys[`${key}.characteristic`] = characteristic.label;
  }
  return keys;
}

export function applyCondition(actor, statusId, extraValues={}) {
  return actor.toggleStatusEffect(statusId, {
    active: true,
    effectEnd: extraValues.effectEnd || ""
  });
}

function conditionExtraFields() {
  const effectEnds = {};
  for (const [key, effectEnd] of Object.entries(ds.CONFIG.effectEnds)) {
    effectEnds[key] = effectEnd.label;
  }
  return {
    effectEnd: {
      element: "select",
      type: "string",
      label: "PGT.CONDITION.DRAW_STEEL.EFFECT_END",
      options: effectEnds
    }
  };
}

//==================================
//      ADVENTURERS REGISTER       =
//==================================
function adventurersRegisterConfig() {
  const characteristicFields = [{
    id: "name",
    icon: "fa-solid fa-signature",
    label: "PGT.ADVENTURERS.CORE.NAME",
    type: "name-icon"
  }];

  for (const [key, characteristic] of Object.entries(ds.CONFIG.characteristics)) {
    characteristicFields.push({
      id: `${key}-test`,
      label: characteristic.label,
      short: characteristic.hint,
      type: "value",
      path: `system.characteristics.${key}.value`,
      rollKey: `${key}.characteristic`
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
          {id: "stamina", icon: "fa-solid fa-heart", label: "DRAW_STEEL.Actor.base.FIELDS.stamina.label", type: "current-max", pathCurrent: "system.stamina.value", pathMax: "system.stamina.max", editable: "numeric"},
          {id: "recoveries", icon: "fa-solid fa-heart-pulse", label: "DRAW_STEEL.Actor.base.FIELDS.recoveries.label", type: "current-max", pathCurrent: "system.recoveries.value", pathMax: "system.recoveries.max", editable: "numeric"},
          {id: "speed", icon: "fa-solid fa-person-running", label: "DRAW_STEEL.Actor.base.FIELDS.movement.value.label", type: "value", path: "system.movement.value"},
          {id: "stability", icon: "fa-solid fa-shield", label: "DRAW_STEEL.Actor.base.FIELDS.combat.stability.label", type: "value", path: "system.combat.stability"},
          {id: "victories", icon: "fa-solid fa-trophy", label: "DRAW_STEEL.Actor.hero.FIELDS.hero.victories.label", type: "value", path: "system.hero.victories"}
        ]
      },
      {
        id: "rolls",
        icon: "fa-solid fa-dice-d10",
        label: "PGT.ADVENTURERS.TAB.ROLLS",
        direction: "row",
        fields: characteristicFields
      }
    ],
    initialTab: "core"
  };
}
