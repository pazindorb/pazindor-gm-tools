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

  //=====================
  //       CONTEXT      =
  //=====================
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.tracker = this.tracker;
    return context;
  }

}
