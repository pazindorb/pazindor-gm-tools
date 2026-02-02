import { emitEvent, responseListener } from "../configs/socket.mjs";
import { BaseDialog } from "/modules/pazindor-dev-essentials/module/dialog/base-dialog.mjs";

class RequestDialog extends BaseDialog {

  constructor(requestType, options = {}) {
    super(options);
    this.requestType = requestType;
    this.selectOptions = options.selectOptions || {};
    
    const actors = options.actors || PDE.utils.collectActorsFromActiveUsers();
    this.actorSelector = this._actorSelector(actors);
    this._prepareDetails();
  }

  _actorSelector(actors) {
    const selector = {}
    actors.forEach((actor, actorId) => {
      selector[actorId] = {
        selected: false,
        selectable: true,
        actor: actor
      }
    })
    return selector;
  }

  _prepareDetails() {
    const emitTypes = PGT.CONST.SOCKET.EMIT;
    switch(this.requestType) {
      case emitTypes.ROLL_REQUEST:
        this.details = {
          icon: "fa-dice",
          label: game.i18n.localize("PGT.ROLL_REQUEST"),
          rollDC: null,
        }
        this.isRoll = true;
        break;

      case emitTypes.REST_REQUEST:      
        this.details = {
          icon: "fa-bed",
          label: game.i18n.localize("PGT.REST_REQUEST"),
          rollDC: null,
        }
        this.isRest = true;
        break;
    }
  }

  /** @override */
  static DEFAULT_OPTIONS = {
    id: "actor-request",
    classes: ["pgt themed"],
    position: {width: "auto"},
    window: {
      title: "PGT.SEND",
      icon: "fa-solid fa-window",
    },
  }

  /** @override */
  static PARTS = {
    root: {
      template: "modules/pazindor-gm-tools/templates/request-dialog.hbs",
      scrollable: [".scrollable"]
    }
  };

  _initializeApplicationOptions(options) {
    const initialized = super._initializeApplicationOptions(options);
    initialized.actions.sendRequest = this._onSendRequest;
    return initialized;
  }

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.actorSelector = this.actorSelector;
    context.hasActors = Object.keys(this.actorSelector).length !== 0;
    context.noActorSelected = Object.values(this.actorSelector).filter(actor => actor.selected).length === 0;

    context.selectOptions = this.selectOptions;
    context.details = this.details;
    context.rollRequest = context.hasActors && this.isRoll && !this.awaitingResult;
    context.restRequest = context.hasActors && this.isRest;
    context.awaitingResult = this.awaitingResult;
    return context;
  }

  async _onSendRequest(event) {
    event.preventDefault();
    this.awaitingResult = true;
    const selected = event.target.dataset.key;

    const selectedActorIds = [];
    const notSelectedActors = [];
    for (const wrapper of Object.values(this.actorSelector)) {
      if (wrapper.selected) {
        selectedActorIds.push(wrapper.actor.id);

        delete wrapper.selected;
        delete wrapper.selectable;
        wrapper.request = true;
      }
      else notSelectedActors.push(wrapper.actor.id);
    }

    for (const actorId of notSelectedActors) {
      delete this.actorSelector[actorId];
    }

    if (this.isRoll) {
      this._rollRequest(selected, selectedActorIds);
      this.render();
    }
    if (this.isRest) {
      this._restRequest(selected, selectedActorIds);
      this.close();
    }
  }

  async _restRequest(selected, actors) {
    for (const actorId of actors) {
      emitEvent(PGT.CONST.SOCKET.EMIT.REST_REQUEST, {
        actorId: actorId,
        selected: selected,
        options: {}
      });
    }
  }

  async _rollRequest(selected, actors) {
    for (const actorId of actors) {
      const validationData = {emmiterId: game.user.id, actorId: actorId};
      const response = responseListener(PGT.CONST.SOCKET.RESPONSE.ROLL_RESULT, validationData);
      emitEvent(PGT.CONST.SOCKET.EMIT.ROLL_REQUEST, {
        actorId: actorId,
        selected: selected,
        options: {}
      });

      response.then(result => {
        const roll = result.payload;
        if (roll._total == null) {
          this.actorSelector[actorId].result = "X";
          this.actorSelector[actorId].outcome = "fail";
        }
        else {
          this.actorSelector[actorId].result = roll._total;
          let outcome = "success";
          if (this.details.rollDC !== null) {
            outcome = roll._total >= this.details.rollDC ? "success" : "fail";
          }

          this.actorSelector[actorId].outcome = outcome;
        }
        delete this.actorSelector[actorId].request;
        this.render();
      });
    }
  }
}

let rollRequestWindow;
export function openRollRequest() {
  if (rollRequestWindow?.rendered) {
    rollRequestWindow.close();
    rollRequestWindow = null;
    return;
  }
  rollRequestWindow = new RequestDialog(PGT.CONST.SOCKET.EMIT.ROLL_REQUEST, {selectOptions: PGT.rollOptions});
  rollRequestWindow.render(true);
}

let restRequestWindow;
export function openRestRequest() {
  if (restRequestWindow?.rendered) {
    restRequestWindow.close();
    restRequestWindow = null;
    return;
  }
  restRequestWindow = new RequestDialog(PGT.CONST.SOCKET.EMIT.REST_REQUEST, {selectOptions: PGT.restOptions});
  restRequestWindow.render(true);
}