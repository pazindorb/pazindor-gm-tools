import { emitEvent } from "../configs/socket.mjs";
import { TrackerConfig } from "./tracker-config.mjs";
import { BaseDialog } from "/modules/pazindor-dev-essentials/module/dialog/base-dialog.mjs";

class ProgressTracker extends BaseDialog {

  constructor(options = {}) {
    super(options);
    this.progressTracker = game.settings.get("pazindor-gm-tools", "progressTracker");
  }

  /** @override */
  static PARTS = {
    root: {
      template: "modules/pazindor-gm-tools/templates/progress-tracker-dialog.hbs",
      scrollable: [".scrollable"]
    }
  };

  /** @override */
  static DEFAULT_OPTIONS = {
    id: "progress-tracker",
    position: {
      width: 450,
      height: 250,
      left: 0,
    },
  }  

  has(key) {
    return !!this.progressTracker.trackers[key];
  }

  get(key) {
    return this.progressTracker.trackers[key];
  }
  
  _initializeApplicationOptions(options) {
    const initialized = super._initializeApplicationOptions(options);
    initialized.actions.update = () => this.updateTracker();
    initialized.actions.add = this._onAdd;
    initialized.actions.config = this._onConfig;
    initialized.actions.remove = this._onRemove;
    initialized.actions.reset = this._onResetTracker;
    initialized.actions.progress = this._onProgress;
    initialized.actions.revert = this._onRevert;
    initialized.actions.visible = this._onVisible;
    initialized.actions.openForPlayers = this._onOpenForPlayers;
    initialized.actions.finishTracker = this._onFinishTracker;
    return initialized;
  }

  //=====================
  //       CONTEXT      =
  //=====================
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.trackers = this._prepareTrackers();

    context.isGM = game.user.isGM;
    return context;
  }

  _prepareTrackers() {
    const trackers = [];
    for (const [key, original] of Object.entries(this.progressTracker.trackers)) {
      const tracker = foundry.utils.deepClone(original);

      let steps = "";
      for (let i = 0; i < tracker.value; i++) {
        steps += `<i class="step ${tracker.fullIcon}" style="color: ${tracker.fullColor}"> </i>`;
      }
      if (tracker.max) {
        for (let i = tracker.value; i < tracker.max; i++) {
          steps += `<i class="step ${tracker.emptyIcon}" style="color: ${tracker.emptyColor}"> </i>`;
        }
      }
      tracker.key = key;
      tracker.steps = steps;
      tracker.show = game.user.isGM || tracker.visible;
      trackers.push(tracker);
    }
    return trackers;
  }

  //=====================
  //       ACTIONS      =
  //=====================
  async _onAdd(event, target) {
    const newTracker = {
      label: "New Tracker",
      value: 0,
      max: null,
      countdown: false,
      announcement: "",
      announcementStyle: "",
      img: "icons/svg/clockwork.svg",
      visible: false,
      fullIcon: "fa-square fas",
      emptyIcon: "fa-square far",
      fullColor: "#d4c6ae",
      emptyColor: "#d4c6ae",
      macro: "",
      actionSources: []
    }
    new TrackerConfig(newTracker, foundry.utils.randomID()).render(true)
  }

  _onRemove(event, target) {
    delete this.progressTracker.trackers[target.dataset.key];
    this.updateTracker();
  }

  async _onConfig(event, target) {
    const key = target.dataset.key;
    const tracker = this.get(key);
    if (!tracker) return;
    new TrackerConfig(tracker, key).render(true)
  }

  _onResetTracker(event, target) {
    const tracker = this.get(target.dataset.key);
    if (!tracker) return;

    tracker.value = tracker.countdown ? tracker.max : 0;
    tracker.actionSources = [];
    this.updateTracker();
  }

  _onProgress(event, target) {
    this.increase(target.dataset.key, "manual");
  }

  _onRevert(event, target) {
    this.reduce(target.dataset.key, "manual");
  }

  async _onFinishTracker(event, target) {
    await this.finishTracker(target.dataset.key);
    this._onResetTracker(event, target);
  }

  _onVisible(event, target) {
    const tracker = this.get(target.dataset.key);
    if (!tracker) return;

    tracker.visible = !tracker.visible;
    this.updateTracker();
  }

  _onOpenForPlayers(event, target) {
    emitEvent(PGT.CONST.SOCKET.EMIT.OPEN_TRACKER, {});
  }

  async increase(key, source) {
    const tracker = this.get(key);
    if (!tracker) return;

    tracker.value += 1;
    if (source) tracker.actionSources.push({type: "increase", source: source});
    if (tracker.value == tracker.max && !tracker.countdown) this.finishTracker(key);
    if (tracker.max) tracker.value = Math.min(tracker.value, tracker.max);
    await this.updateTracker();
  }

  async reduce(key, source) {
    const tracker = this.get(key);
    if (!tracker) return;

    tracker.value -= 1;
    if (source) tracker.actionSources.push({type: "reduce", source: source});
    if (tracker.value == 0 && tracker.countdown) this.finishTracker(key);
    tracker.value = Math.max(tracker.value, 0);
    await this.updateTracker();
  }

  async updateTracker() {
    await game.settings.set("pazindor-gm-tools", "progressTracker", this.progressTracker);
    emitEvent(PGT.CONST.SOCKET.EMIT.UPDATE_TRACKER, {});
    this.render();
  }

  refresh() {
    this.progressTracker = game.settings.get("pazindor-gm-tools", "progressTracker");
    this.render();
  }

  async finishTracker(key) {
    const tracker = this.get(key);
    this.#displayAnnouncement(tracker);
    await this.#runPostFinishMacro(tracker);
  }

  #displayAnnouncement(tracker) {
    if (!tracker.announcement || !tracker.visible) return;
    PDE.announce(tracker.announcement, 3000, {style: tracker.announcementStyle});
  }

  async #runPostFinishMacro(tracker) {
    // Create Macro 
    const macro = new Macro({
      name: tracker.label,
      type: "script",
      img: tracker.img,
      command: tracker.macro
    });

    // Run Macro
    const scope = {
      tracker: tracker,
      giveItemToActor: giveItemToActor,
      increaseActions: getActions(tracker, "increase"),
      reduceActions: getActions(tracker, "reduce")
    }
    macro.params = scope;
    await macro.execute(scope);
  }
}

export function openProgressTracker(force=false, skipRender=false) {
  if (!window.trackerWindow) {
    window.trackerWindow = new ProgressTracker();
  }
  if (window.trackerWindow.rendered && !force) window.trackerWindow.close();
  else if (!skipRender) window.trackerWindow.render(true);
}


//=====================================
//=           MACRO HELPERS           =
//=====================================
async function giveItemToActor(actorUuid, itemUuid) {
  if (actorUuid === "manual") return;

  const item = await fromUuid(itemUuid);
  const actor = await fromUuid(actorUuid);

  if (!item) {
    console.error(`[PGT: Progress Tracker] Item with uuid ${itemUuid} not found`);
    return;
  }
  if (!actor) {
    console.error(`[PGT: Progress Tracker] Actor with uuid ${actorUuid} not found`);
    return;
  }
  PDE.crud.gmCreate(item.toObject(), {parent: actor}, CONFIG.Item.documentClass);
}

function getActions(tracker, type) {
  if (!tracker?.actionSources) return new Map();

  const collected = new Map();
  for (const action of tracker.actionSources) {
    if (action.type !== type) continue;

    const source = action.source;
    if (collected.has(source)) {
      const currentValue = collected.get(source);
      collected.set(source, currentValue + 1);
    }
    else {
      collected.set(source, 1);
    }
  }
  return collected;
}