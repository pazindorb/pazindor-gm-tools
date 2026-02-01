import { emitEvent } from "../configs/socket.mjs";
import { BaseDialog } from "/modules/pazindor-dev-essentials/module/dialog/base-dialog.mjs";

export class AdventurersRegister extends BaseDialog {

  constructor(options = {}) {
    super(options);
    this.selectedGroup = "";
    this._prepareAdventurers();

    this.constructor.TABS = {
      primary: {
        tabs: [
          ...(PGT.adventurersConfig.tabs || []), 
          {id: "advanced", icon: "fa-solid fa-gear", label: "PGT.ADVENTURERS.TAB.ADVANCED"}
        ],
        initial: PGT.adventurersConfig.initialTab || "advanced"
      }
    }
  }

  _prepareAdventurers() {
    this.allAdventurers = game.actors.filter(actor => actor.type === "character");
    this.groups = game.settings.get("pazindor-gm-tools", "adventurersGroups");
    
    if (this.groups.length > 0) {
      this.selectedGroup = game.settings.get("pazindor-gm-tools", "mainAdventurersGroup");
    }
  }

  static TABS = {
    primary: {
      tabs: [
        {id: "advanced", icon: "fa-solid fa-gear", label: "PGT.ADVENTURERS.TAB.ADVANCED"},
      ],
      initial: "core",
    }
  };

  /** @override */
  static PARTS = {
    root: {
      template: "modules/pazindor-gm-tools/templates/adventurers-register-dialog.hbs",
      scrollable: [".scrollable"]
    }
  };

  /** @override */
  static DEFAULT_OPTIONS = {
    id: "adventurers-register",
    classes: ["pgt themed"],
    position: {width: 700},
    window: {
      title: "PGT.ADVENTURERS.TITLE",
      icon: "fa-solid fa-book-open-cover",
    },
  }  

  _initializeApplicationOptions(options) {
    const initialized = super._initializeApplicationOptions(options);

    initialized.actions.roll = this._onCallRoll;
    initialized.actions.sheet = this._onSheetOpen;
    initialized.actions.addGroup = this._onAddNewGroup;
    initialized.actions.removeGroup = this._onRemoveGroup;
    initialized.actions.addToGroup = this._onAddToGroup;
    initialized.actions.removeFromGroup = this._onRemoveFromGroup;
    return initialized;
  }

  //=====================
  //       CONTEXT      =
  //=====================
  async _prepareContext(options) {
    const context = await super._prepareContext(options);

    // Group Selection
    const adventurers = this._prepareGroup();
    context.groups = PDE.utils.toSelectOptions(this.groups, "name", "name");
    context.selectedGroup = this.selectedGroup;
    context.adventurers = adventurers;

    // Prepare Advanced Tab
    context.actors = this._prepareActorsToSelect(adventurers);
    context.selectedActorId = this.selectedActorId;
    const selectedActor = adventurers.find(actor => actor.id === this.selectedActorId);
    context.selectedActor = selectedActor;
    if (selectedActor) {
      context.actorPaths = this._actorPaths(selectedActor.system);
      context.selectedPath = this.selectedPath;
      context.selectedPathValue = PDE.utils.getValueFromPath(selectedActor, `system.${this.selectedPath}`)
    }

    return context;
  }

  _prepareGroup() {
    const selected = this.selectedGroup;
    if (!selected) return this.allAdventurers;

    const group = this.groups.find(group => group.name === selected);
    if (!group) return [];

    return this.allAdventurers.filter(actor => group.adventurers[actor.id]);
  }

  _prepareActorsToSelect(adventurers) {
    const options = {};
    adventurers.forEach(actor => options[actor.id] = actor.name);
    return options;
  }

  _actorPaths(actor) {
    const paths = this.#getActorPaths(actor);
    const selectOptions = {};
    paths.forEach(path => selectOptions[path] = path);
    return selectOptions;
  }

  #getActorPaths(object, prefix="") {
    let paths = [];
    for (const key in object) {
      const value = object[key];
      const path = prefix ? `${prefix}.${key}` : key;

      if (value?.documentName === "Actor") {
        continue;
      }
      if (value != null && typeof value === 'object' && !Array.isArray(value)) {
        paths = paths.concat(this.#getActorPaths(value, path));
      } else {
        paths.push(path);
      }
    }
    return paths;
  }

  //=====================
  //       ACTIONS      =
  //=====================
  _onCallRoll(event, target) {
    const dataset = target.dataset;
    const actor = this.allAdventurers.find(actor => dataset.actorId === actor.id);
    if (!actor) return;

    const hasOwners = PDE.utils.getPlayersForActor(actor).length > 0;
    if (hasOwners) {
      emitEvent(PGT.CONST.SOCKET.EMIT.ROLL_REQUEST, {
        actorId: actor.id,
        selected: dataset.rollKey,
        options: {}
      });
    }
    else {
      PGT.onRollRequest(actor, dataset.rollKey);
    }
  }

  _onSheetOpen(event, target) {
    const actorId = target.dataset?.actorId;
    const actor = this.allAdventurers.find(actor => actorId === actor.id);
    if (!actor) return;
    actor.sheet.render(true);
  }

  async _onAddNewGroup(event, target) {
    const name = await PDE.InputDialog.input("Provide Group Name");
    if (!name) return;

    this.groups.push({
      name: name,
      adventurers: {}
    });
    this.render();
  }

  async _onAddToGroup(event, target) {
    const actorId = target.dataset?.actorId;
    if (!actorId) return;

    const groupName = await PDE.InputDialog.select("Select Group", PDE.utils.toSelectOptions(this.groups, "name", "name"));
    const group = this.groups.find(group => group.name === groupName);
    if (!group) return;

    group.adventurers[actorId] = actorId;
    this.render();
  }

  _onRemoveFromGroup(event, target) {
    const actorId = target.dataset?.actorId;
    if (!actorId) return;

    const group = this.groups.find(group => group.name === this.selectedGroup);
    if (!group) return;

    delete group.adventurers[actorId];
    this.render();
  }

  _onRemoveGroup(event, target) {
    const index = this.groups.findIndex(group => group.name === this.selectedGroup);
    if (index !== -1) this.groups.splice(index, 1);
    this.selectedGroup = "";
    this.render();
  }

  //=====================
  //        OTHER       =
  //=====================  
  async _onChangeString(path, value, dataset) {
    const actorId = dataset.actorId;
    const actor = this.allAdventurers.find(actor => actorId === actor.id);
    if (!actor) return super._onChangeString(path, value, dataset);

    await actor.update({[path]: value});
    this.render();
  }

  async _onChangeNumeric(path, value, nullable, dataset) {
    const actorId = dataset.actorId;
    const actor = this.allAdventurers.find(actor => actorId === actor.id);
    if (!actor) return super._onChangeNumeric(path, value, nullable, dataset);

    let numericValue = parseInt(value);
    if (nullable && isNaN(numericValue)) numericValue = null;
    await actor.update({[path]: numericValue});
    this.render();
  }

  close() {
    game.settings.set("pazindor-gm-tools", "adventurersGroups", this.groups);
    game.settings.set("pazindor-gm-tools", "mainAdventurersGroup", this.selectedGroup);
    super.close();
  }
}

let adventurersWindow;
export function openAdventurersRegister() {
  if (!adventurersWindow) {
    adventurersWindow = new AdventurersRegister();
  }
  if (adventurersWindow.rendered) adventurersWindow.close();
  else adventurersWindow.render(true);
}