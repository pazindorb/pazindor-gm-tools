import { emitEvent, responseListener } from "../configs/socket.mjs";
import { combinedKey } from "../utils.mjs";
import { openProgressTracker } from "./progress-tracker.mjs";
import { BaseDialog } from "/modules/pazindor-dev-essentials/module/dialog/base-dialog.mjs";

class RequestDialog extends BaseDialog {

  constructor(requestType, options = {}) {
    super(options);
    this.requestType = requestType;
    this.selectOptions = options.selectOptions || {};
    this.extraFields = options.extraFields || {};
    this.collectMode = "active";
    this._collectAndPrepareActors(options.actors);
    this._prepareDetails(options);
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

        case "target":
          collected = game.user.targets.map(token => token.actor);
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
      selector[combinedKey(actor)] = {
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

  _prepareDetails(options) {
    const emitTypes = PGT.CONST.SOCKET.EMIT;
    switch(this.requestType) {
      case emitTypes.ROLL_REQUEST:
        this.details = {
          icon: "fa-dice",
          label: game.i18n.localize("PGT.REQUEST.ROLL_REQUEST"),
          rollDC: options.rollDC || null,
          tracker: {
            key: "",
            success: "",
            fail: ""
          }
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

      case emitTypes.ROLL_LISTENER:
        this.details = {
          icon: "fa-ear-listen",
          label: game.i18n.localize("PGT.REQUEST.ROLL_LISTENER"),
          rollDC: options.rollDC || null,
          acceptFirstOnly: true,
          pcOnly: false,
          listening: false,
          tracker: {
            key: "",
            success: "",
            fail: ""
          }
        }
        this.awaitingResult = true;
        this.isListener = true;
        this.actorSelector = {};
        break;
    }   
  }

  /** @override */
  static DEFAULT_OPTIONS = {
    id: "actor-request",
    classes: ["pgt themed"],
    position: {width: 730},
    window: {
      title: "PGT.REQUEST.SEND",
      icon: "fa-solid fa-window",
    },
  }

  /** @override */
  static PARTS = {
    root: {
      template: "modules/pazindor-gm-tools/templates/request-dialog.hbs",
      scrollable: [".scrollable", ".scroll-options"]
    }
  };

  _initializeApplicationOptions(options) {
    const initialized = super._initializeApplicationOptions(options);
    initialized.actions.sendRestRequest = this._onSendRestRequest;
    initialized.actions.sendRollRequest = this._onSendRollRequest;
    initialized.actions.refresh = () => {this._collectAndPrepareActors(); this.render()};
    return initialized;
  }

  //=====================
  //       CONTEXT      =
  //=====================
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.actorSelector = this.actorSelector;
    context.hasActors = Object.keys(this.actorSelector).length !== 0;
    context.noActorSelected = Object.values(this.actorSelector).filter(actor => actor.selected).length === 0;

    context.progressTrackers = this.#collectProgressTrackers();
    context.progressTypes = {
      increase: "PGT.TRACKER.INCREASE_COUNTER",
      reduce: "PGT.TRACKER.REDUCE_COUNTER"
    }
    context.collectModes = {
      active: "PGT.COLLECT_MODE.ACTIVE",
      target: "PGT.COLLECT_MODE.TARGET",
      scene: "PGT.COLLECT_MODE.SCENE",
      all: "PGT.COLLECT_MODE.ALL_PC"
    }

    context.extraFields = this.extraFields;
    context.collectMode = this.collectMode;
    context.selectOptions = this.selectOptions;
    context.details = this.details;
    context.rollRequest = context.hasActors && this.isRoll && !this.awaitingResult;
    context.restRequest = context.hasActors && this.isRest;
    context.rollListener = this.isListener;
    context.isRoll = this.isRoll;
    context.awaitingResult = this.awaitingResult;
    return context;
  }

  #collectProgressTrackers() {
    if (!window.trackerWindow) openProgressTracker(false, true);

    const trackers = {};
    for (const [key, tracker] of Object.entries(window.trackerWindow.progressTracker.trackers)) {
      trackers[key] = tracker.label;
    }
    return trackers;
  }

  //=====================
  //       ACTIONS      =
  //=====================
  async _onSendRestRequest(event, target) {
    event.preventDefault();
    const selected = event.target.dataset.key;

    const selectedActorIds = [];
    for (const wrapper of Object.values(this.actorSelector)) {
      if (wrapper.selected) selectedActorIds.push(combinedKey(wrapper.actor));
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

  #setRollRequest(key, label) {
    for (const wrapper of Object.values(this.actorSelector)) {
      if (!wrapper.selected) continue;
      
      wrapper.selected = false;
      wrapper.key = key;
      wrapper.label = label;
      const [options, tooltip] = this.#getRollOptions();
      wrapper.rollOptions = options;
      wrapper.rollOptionsTooltip = tooltip;
      if (this.details.rollDC !== null) {
        wrapper.rollDC = this.details.rollDC;
      }
      if (this.details.tracker.key) {
        wrapper.tracker = this.details.tracker;
      }
    }
    this.render();
  }

  #getRollOptions() {
    const rollOptions = {}
    let tooltip = "";
    for (const [key, field] of Object.entries(this.extraFields)) {
      rollOptions[key] = field.value;
      if (field.value) tooltip += `${game.i18n.localize(field.label)}: ${field.value}<br>`;
    }
    return [rollOptions, tooltip];
  }

  async _onSendRollRequest(event, target) {
    event.preventDefault();
    this.awaitingResult = true;

    const selectedActorIds = [];
    const notSelectedActors = [];
    for (const wrapper of Object.values(this.actorSelector)) {
      if (wrapper.key) {
        selectedActorIds.push(combinedKey(wrapper.actor));
        delete wrapper.selectable;
        wrapper.request = true;
      }
      else {
        notSelectedActors.push(combinedKey(wrapper.actor));
      }
    }

    for (const combinedKey of notSelectedActors) {
      delete this.actorSelector[combinedKey];
    }

    for (const combinedKey of selectedActorIds) {
      this._rollRequest(this.actorSelector[combinedKey]);
    }

    this.render();
  }

  async _rollRequest(wrapper) {
    const actorId = wrapper.actor.id;
    if (!actorId) return;

    const rollOptions = wrapper.rollOptions;
    rollOptions.rollDC = wrapper.rollDC;

    // If there is no active player GM needs to roll himself
    if (PDE.utils.getPlayersForActor(wrapper.actor).length === 0) {
      const roll = await PGT.onRollRequest(wrapper.actor, wrapper.key, rollOptions);
      this.#resolveRollOutcome(wrapper, roll);
    }

    const validationData = {emmiterId: game.user.id, actorId: actorId};
    const response = responseListener(PGT.CONST.SOCKET.RESPONSE.ROLL_RESULT, validationData);
    emitEvent(PGT.CONST.SOCKET.EMIT.ROLL_REQUEST, {
      actorId: actorId,
      selected: wrapper.key,
      options: rollOptions
    });

    response.then(result => {
      const roll = result.payload;
      if (roll.noResult) this.close();
      this.#resolveRollOutcome(wrapper, roll);
    });
  }

  #resolveRollOutcome(wrapper, roll) {
    if (roll?.skip) {
      wrapper.result = "";
      wrapper.outcome = "success";
    }
    else if (roll?._total == null) {
      wrapper.result = "X";
      wrapper.outcome = "fail";
    }
    else {
      wrapper.result = roll._total;
      let outcome = "success";
      if (wrapper.rollDC != null) {
        outcome = roll._total >= wrapper.rollDC ? "success" : "fail";

        // Resolve Progress Tracker changes
        if (wrapper.tracker) {
          const trackerExist = window.trackerWindow.has(wrapper.tracker.key);
          if (trackerExist) {
            let action = "none";
            if (wrapper.tracker.success && outcome === "success") action = wrapper.tracker.success;
            if (wrapper.tracker.fail && outcome === "fail") action = wrapper.tracker.fail;

            if (action === "increase") window.trackerWindow.increase(wrapper.tracker.key);
            if (action === "reduce") window.trackerWindow.reduce(wrapper.tracker.key);
          }
        }
      }

      wrapper.outcome = outcome;
    }
    delete wrapper.request;
    this.render();
  }

  async onRollListened(message) {
    if (!this.details.listening) return;

    const actor = message.speakerActor;
    const roll = PGT.extractRollFromMessage(message);
    if (roll?._total == null || !actor) return;

    const rollDC = this.details.rollDC;
    const key = combinedKey(actor);

    if (this.details.pcOnly && !PGT.pcActorTypes.includes(actor.type)) return;
    if (this.actorSelector[key] && this.details.acceptFirstOnly) return;
    if (!this.actorSelector[key]) this.actorSelector[key] = {actor: actor};

    if (this.details.rollDC) this.actorSelector[key].rollDC = this.details.rollDC;
    if (this.details.tracker) this.actorSelector[key].tracker = this.details.tracker;
    this.#resolveRollOutcome(this.actorSelector[key], roll);
  }
}

let rollRequestWindow;
export function openRollRequest() {
  if (rollRequestWindow?.rendered) {
    rollRequestWindow.close();
    rollRequestWindow = null;
    return;
  }
  rollRequestWindow = new RequestDialog(PGT.CONST.SOCKET.EMIT.ROLL_REQUEST, {selectOptions: PGT.rollOptions, extraFields: PGT.requestFields?.roll});
  rollRequestWindow.render(true);
}

let restRequestWindow;
export function openRestRequest() {
  if (restRequestWindow?.rendered) {
    restRequestWindow.close();
    restRequestWindow = null;
    return;
  }
  restRequestWindow = new RequestDialog(PGT.CONST.SOCKET.EMIT.REST_REQUEST, {selectOptions: PGT.restOptions, extraFields: PGT.requestFields?.rest});
  restRequestWindow.render(true);
}

let rollListenerWindow;
export function openRollListener() {
  if (rollListenerWindow?.rendered) {
    rollListenerWindow.close();
    rollListenerWindow = null;
    return;
  }
  rollListenerWindow = new RequestDialog(PGT.CONST.SOCKET.EMIT.ROLL_LISTENER, {actors: []});
  rollListenerWindow.render(true);
}

Hooks.on("createChatMessage", (message) => {
  if (rollListenerWindow?.rendered && message.isRoll) rollListenerWindow.onRollListened(message)
});
