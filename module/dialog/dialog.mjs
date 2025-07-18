import { getValueFromPath, setValueForPath } from "../utils.mjs";

export class PgtDialog extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.api.ApplicationV2) {

  /** @override */
  static DEFAULT_OPTIONS = {
    id: "dialog-{id}",
    classes: ["pgt themed"],
    position: {width: 350},
    window: {
      title: "Dialog",
      icon: "fa-solid fa-window",
    },
  }

  _initializeApplicationOptions(options) {
    const initialized = super._initializeApplicationOptions(options);
    const colorTheme = game.settings.get("core", "uiConfig").colorScheme.applications;
    initialized.classes.push(`theme-${colorTheme}`);
    return initialized;
  }

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const colorTheme = game.settings.get("core", "uiConfig").colorScheme.applications;
    context.cssClass = `theme-${colorTheme}`;
    
    // Get active tab
    if (context.tabs) {
      const active = Object.values(context.tabs).find(tab => tab.active);
      if (active) context.activeTab = active.id;
    }
    return context;
  }

  _attachFrameListeners() {
    super._attachFrameListeners();
    this.window.content.addEventListener("change", this._onChange.bind(this));
    this.window.content.addEventListener("click", this._onClick.bind(this));
    this.window.content.addEventListener("drop", this._onDrop.bind(this));
  }

  _onChange(event) {
    const target = event.target;
    const dataset = target.dataset;
    const cType = dataset.ctype;
    const path = dataset.path;
    const value = target.value;

    switch (cType) {
      case "string": this._onChangeString(path, value, dataset); break;
      case "numeric": this._onChangeNumeric(path, value, false, dataset); break;
      case "numeric-nullable": this._onChangeNumeric(path, value, true, dataset); break;
      case "boolean" : this._onChangeBoolean(path, dataset); break;
    }
  }

  _onClick(event) {
    const target = event.target;
    const dataset = target.dataset;
    const cType = dataset.ctype;
    const path = dataset.path;

    switch (cType) {
      case "activable": this._onActivable(path, dataset); break;
    }
  }

  _onActivable(path, dataset) {
    const value = getValueFromPath(this, path);
    setValueForPath(this, path, !value);
    this.render();
  }

  _onChangeString(path, value, dataset) {
    setValueForPath(this, path, value);
    this.render();
  }

  _onChangeNumeric(path, value, nullable, dataset) {
    let numericValue = parseInt(value);
    if (nullable && isNaN(numericValue)) numericValue = null;
    setValueForPath(this, path, numericValue);
    this.render();
  }

  _onChangeBoolean(path, dataset) {
    const value = getValueFromPath(this, path);
    setValueForPath(this, path, !value);
    this.render();
  }

  async _onDrop(event) {
    event.preventDefault();
    const droppedData  = event.dataTransfer.getData('text/plain');
    if (!droppedData) return;

    const droppedObject = JSON.parse(droppedData);
    return droppedObject;
  }
}