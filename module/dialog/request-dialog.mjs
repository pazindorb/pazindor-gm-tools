import { PgtDialog } from "./dialog.mjs";
import { collectActorsFromActiveUsers } from "../utils.mjs";

class RequestDialog extends PgtDialog {

  constructor(actors, dropdownOptions, requestType, options = {}) {
    super(options);
    this.actorSelector = this._actorSelector(actors);
    this.dropdownOptions = dropdownOptions;
    this.selected = Object.keys(dropdownOptions)[0];
    this.requestType = requestType;
  }

  _actorSelector(actors) {
    const selector = {}
    actors.forEach((actor, actorId) => {
      selector[actorId] = {
        selected: false,
        actor: actor
      }
    })
    return selector;
  }

  /** @override */
  static DEFAULT_OPTIONS = {
    id: "dialog-request",
    classes: ["pgt themed"],
    position: {width: 500},
    window: {
      title: "PGMT.requestTitle",
      icon: "fa-solid fa-window",
    },
  }

  /** @override */
  static PARTS = {
    root: {
      template: "modules/pazindor-gm-tools/templates/request-dialog.hbs",
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
    context.dropdownOptions = this.dropdownOptions;
    context.selected = this.selected;
    context.label = `PGMT.${this.requestType}`;
    context.selectTitle = `PGMT.${this.requestType}Title`;
    context.icon = this.requestType === "roll" ? "fa-dice" : "fa-bed";
    return context;
  }

  async _onSendRequest(event, target) {
    event.preventDefault();
    switch(this.requestType) {
      case "roll":
        PGT.onRollRequest(actors, selected); break;
      case "rest":
        PGT.onRestRequest(actors, selected); break;
    }
    
  }
}

export function openRollRequest() {
  const actors = collectActorsFromActiveUsers();
  const dropdown = PGT.rollOptions;

  new RequestDialog(actors, dropdown, "roll").render(true);
}

export function openRestRequest() {
  const actors = collectActorsFromActiveUsers();
  const dropdown = PGT.restOptions;

  new RequestDialog(actors, dropdown, "rest").render(true);
}