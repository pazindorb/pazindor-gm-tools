import { emitEvent, responseListener } from "../socket.mjs";
import { getPlayersForActor, getSelectedTokens } from "../utils.mjs";
import { PgtDialog } from "./dialog.mjs";

class ConditionManagerDialog extends PgtDialog {

  constructor(conditions, options = {}) {
    super(options);
    canvas.tokens.activate();

    this.conditions = conditions;
    this.showAll = false;
    this.rollKeys = this.options.rollKeys;
    this.rollBefore = {
      askForRoll: false,
      key: "",
      dc: null,
    }
  }

  /** @override */
  static PARTS = {
    root: {
      classes: ["dc20rpg"],
      template: "modules/pazindor-gm-tools/templates/condition-manager-dialog.hbs",
    }
  };

  /** @override */
  static DEFAULT_OPTIONS = {
    id: "condition-manager",
    classes: ["pgt themed"],
    position: {width: 500},
    window: {
      title: "PGT.CONDITION_MANAGER.TITLE",
      icon: "fa-solid fa-bolt",
    },
  }  
  
  _initializeApplicationOptions(options) {
    const initialized = super._initializeApplicationOptions(options);
    initialized.actions.apply = this._onApplyStatus;
    return initialized;
  }

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.rollBefore = this.rollBefore;
    context.conditions = this._getCondtions();

    context.showAll = this.showAll;
    context.canAskForRoll = !!this.rollKeys;
    context.rollKeys = this.rollKeys;
    return context;
  }

  _getCondtions() {
    if (this.showAll) return this.conditions;
    else return this.conditions.filter(cond => cond.isCondition);
  }

  async _onApplyStatus(event, target) {
    event.preventDefault();
    const shouldAskForRoll = this.rollBefore.askForRoll && this.rollBefore.key && this.rollBefore.dc;
    const statusId = target.dataset.statusId;

    const tokens = getSelectedTokens();
    for (const token of tokens) {
      const actor = token.actor;
      if (!actor) continue;

      // Without asking for roll
      if (!shouldAskForRoll) {
        PGT.applyCondition(actor, statusId);
        continue;
      }
      
      // With asking for roll
      const hasOwners = getPlayersForActor(actor).length > 0;
      if (hasOwners) {
        const validationData = {emmiterId: game.user.id, actorId: actor.id};
        const response = responseListener(PGT.CONST.SOCKET.RESPONSE.ROLL_RESULT, validationData);
        emitEvent(PGT.CONST.SOCKET.EMIT.ROLL_REQUEST, {
          actorId: actor.id,
          selected: this.rollBefore.key,
          options: {}
        });
        response.then(result => {
          const roll = result.payload;
          if (!!!roll._total || roll._total < this.rollBefore.dc) PGT.applyCondition(actor, statusId);
        })
      }
      else {
        const roll = await PGT.onRollRequest(actor, this.rollBefore.key);
        if (!!!roll._total || roll._total < this.rollBefore.dc) PGT.applyCondition(actor, statusId);
      }
    }
  }
}

export function openConditionManager() {
  new ConditionManagerDialog(PGT.conditions, {rollKeys: PGT.conditionRollKeys}).render(true);
}