import { BaseDialog } from "/modules/pazindor-dev-essentials/module/dialog/base-dialog.mjs";

export class TrackerConfig extends BaseDialog {

  constructor(tracker, key, options = {}) {
    super(options);
    this.tracker = tracker;
    this.key = key;
  }

  /** @override */
  static PARTS = {
    root: {
      template: "modules/pazindor-gm-tools/templates/tracker-config-dialog.hbs",
    }
  };

  /** @override */
  static DEFAULT_OPTIONS = {
    id: "tracker-config",
    position: {
      width: 450,
    },
    window: {
      title: "PGT.TRACKER_CONFIG.TITLE",
      icon: "fa-solid fa-gears",
      resizable: true
    },
  }  
  
  _initializeApplicationOptions(options) {
    const initialized = super._initializeApplicationOptions(options);
    initialized.actions.save = this._onSave;
    initialized.actions.pickImage = this._onPickImage;
    initialized.actions.quickMacro = this._onQuickMacro;
    return initialized;
  }

  _onPickImage(event, target) {
    event.preventDefault();

    const path = target.dataset.path;
    new FilePicker({
      type: "image",
      current: this.tracker.img,
      callback: img => this.updateAndRender(path, img, true)
    }).render(true);
  }

  _onSave(event, target) {
    event.preventDefault();

    if (!window.trackerWindow) {
      ui.notifications.warn("PGT.TRACKER_CONFIG.INITIALIZE_ERROR", {localize: true});
      return;
    }

    // Validation
    if (this.tracker.countdown && !this.tracker.max) {
      this.tracker.countdown = false;
    }
    if (this.tracker.countdown && this.tracker.max) {
      this.tracker.value = this.tracker.max;
    }

    window.trackerWindow.progressTracker.trackers[this.key] = this.tracker;
    window.trackerWindow.updateTracker();
    this.close();
  }

  async _onQuickMacro(event, target) {
    const type = await PDE.InputDialog.select("Select Quick Macro", {grantItem: "Grant Item to Actors"});
    if (type === "grantItem") await this.#grantItemMacro();
  }

  async #grantItemMacro() {
    const action = await PDE.InputDialog.select("Select Action", {increase: "Increase", reduce: "Reduce"});
    if (!action) return;

    const itemUuid = await PDE.InputDialog.open("drop", {header: "Drop Item Here"});
    if (!itemUuid?.[0] || !itemUuid[0].includes("Item.")) return; 

    this.tracker.macro = `${action}Actions.keys().forEach(actorUuid => giveItemToActor(actorUuid, "${itemUuid}"));`
    this.render();
  }

  //=====================
  //       CONTEXT      =
  //=====================
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.tracker = this.tracker;
    context.announcementStyles = PDE.announcementStyles
    return context;
  }

}
