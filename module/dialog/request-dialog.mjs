import { emitEvent, responseListener } from "../configs/socket.mjs";
import { BaseDialog } from "/modules/pazindor-dev-essentials/module/dialog/base-dialog.mjs";

class RequestDialog extends BaseDialog {

  constructor(requestType, options = {}) {
    super(options);
    this.requestType = requestType;
    this.selectOptions = options.selectOptions || {};
    this.collectMode = "active";
    this._collectAndPrepareActors(options.actors);
    this._prepareDetails();
  }

  _collectAndPrepareActors(actors) {
    let collected = actors;

    // Preconfigured list of actors
    if (collected) {
      this.collectMode = "preconfigured";
    }
    else {
      switch (this.collectMode) {
        case "active":
          collected = PDE.utils.collectActorsFromActiveUsers();
          break;

        case "scene": 
          collected = this.#collectActorsFromScene();
          break;

        case "all":
          collected = game.actors.filter(actor => PGT.pcActorTypes.includes(actor.type));
          break;
      }
    }
    
    const selector = {}
    collected.forEach((actor) => {
      selector[actor.id] = {
        selected: false,
        selectable: true,
        actor: actor
      }
    })
    this.actorSelector = selector;
  }

  #collectActorsFromScene() {
    if (!game.scenes.active) return [];
    return game.scenes.active.tokens.filter(token => token.actor).map(token => token.actor);
  }

  _prepareDetails() {
    const emitTypes = PGT.CONST.SOCKET.EMIT;
    switch(this.requestType) {
      case emitTypes.ROLL_REQUEST:
        this.details = {
          icon: "fa-dice",
          label: game.i18n.localize("PGT.REQUEST.ROLL_REQUEST"),
          rollDC: null,
        }
        this.isRoll = true;
        break;

      case emitTypes.REST_REQUEST:      
        this.details = {
          icon: "fa-bed",
          label: game.i18n.localize("PGT.REQUEST.REST_REQUEST"),
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
      title: "PGT.REQUEST.SEND",
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
    initialized.actions.sendRestRequest = this._onSendRestRequest;
    initialized.actions.sendRollRequest = this._onSendRollRequest;
    return initialized;
  }

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.actorSelector = this.actorSelector;
    context.hasActors = Object.keys(this.actorSelector).length !== 0;
    context.noActorSelected = Object.values(this.actorSelector).filter(actor => actor.selected).length === 0;

    context.collectModes = {
      active: "PGT.COLLECT_MODE.ACTIVE",
      scene: "PGT.COLLECT_MODE.SCENE",
      all: "PGT.COLLECT_MODE.ALL_PC"
    }
    context.collectMode = this.collectMode;
    context.selectOptions = this.selectOptions;
    context.details = this.details;
    context.rollRequest = context.hasActors && this.isRoll && !this.awaitingResult;
    context.restRequest = context.hasActors && this.isRest;
    context.isRoll = this.isRoll;
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

  async _onSendRestRequest(event, target) {
    event.preventDefault();
    const selected = event.target.dataset.key;

    const selectedActorIds = [];
    for (const wrapper of Object.values(this.actorSelector)) {
      if (wrapper.selected) selectedActorIds.push(wrapper.actor.id);
    }
    this._restRequest(selected, selectedActorIds);
    this.close();
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

  _onChange(event) {
    const target = this._getCtypeTarget(event.target);
    const dataset = target.dataset;
    const cType = dataset.ctype;

    if (cType === "setRollRequest") {
      const key = target.value;
      const label = target.selectedOptions[0].text;
      this.#setRollRequest(key, label);
      return;
    }

    if (cType === "collectMode") {
      this.collectMode = target.value;
      this._collectAndPrepareActors();
      this.render();
      return;
    }

    super._onChange(event);
  }

  async #setRollRequest(key, label) {
    for (const wrapper of Object.values(this.actorSelector)) {
      if (!wrapper.selected) continue;
      
      wrapper.selected = false;
      wrapper.key = key;
      wrapper.label = label;
      if (this.details.rollDC !== null) {
        wrapper.rollDC = this.details.rollDC;
      }
    }
    this.render();
  }

  async _onSendRollRequest(event, target) {
    event.preventDefault();
    this.awaitingResult = true;

    const selectedActorIds = [];
    const notSelectedActors = [];
    for (const wrapper of Object.values(this.actorSelector)) {
      if (wrapper.key) {
        selectedActorIds.push(wrapper.actor.id);
        delete wrapper.selectable;
        wrapper.request = true;
      }
      else {
        notSelectedActors.push(wrapper.actor.id);
      }
    }

    for (const actorId of notSelectedActors) {
      delete this.actorSelector[actorId];
    }

    for (const actorId of selectedActorIds) {
      this._rollRequest(this.actorSelector[actorId]);
    }

    this.render();
  }

  async _rollRequest(wrapper) {
    const actorId = wrapper.actor.id;
    if (!actorId) return;

    // If there is no active player GM needs to roll himself
    if (PDE.utils.getPlayersForActor(wrapper.actor).length === 0) {
      const roll = await PGT.onRollRequest(wrapper.actor, wrapper.key);
      this.#resolveRollOutcome(wrapper, roll);
    }

    const validationData = {emmiterId: game.user.id, actorId: actorId};
    const response = responseListener(PGT.CONST.SOCKET.RESPONSE.ROLL_RESULT, validationData);
    emitEvent(PGT.CONST.SOCKET.EMIT.ROLL_REQUEST, {
      actorId: actorId,
      selected: wrapper.key,
      options: {}
    });

    response.then(result => {
      const roll = result.payload;
      if (roll.noResult) this.close();
      this.#resolveRollOutcome(wrapper, roll);
    });
  }

  #resolveRollOutcome(wrapper, roll) {
    if (roll._total == null) {
      wrapper.result = "X";
      wrapper.outcome = "fail";
    }
    else {
      wrapper.result = roll._total;
      let outcome = "success";
      if (wrapper.rollDC != null) {
        outcome = roll._total >= wrapper.rollDC ? "success" : "fail";
      }

      wrapper.outcome = outcome;
    }
    delete wrapper.request;
    this.render();
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