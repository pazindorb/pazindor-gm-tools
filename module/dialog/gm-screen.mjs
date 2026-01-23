import { BaseDialog } from "/modules/pazindor-dev-essentials/module/dialog/base-dialog.mjs";
export class GmScreen extends BaseDialog {

  constructor(options = {}) {
    super(options);
    this.tabs = game.settings.get("pgt", "gmScreenTabs");
    this.index = 0;
    this._prepareTabs();
  }

  /** @override */
  static DEFAULT_OPTIONS = {
    id: "gm-screen",
    classes: ["pgt themed"],
    position: {
      width: "auto",
      height: 700,
      top: 0,
      left: 0,
    },
    window: {
      title: "PGT.GM_MENU",
      icon: "fa-solid fa-crown",
    },
  }

  /** @override */
  static PARTS = {
    root: {
      template: "modules/pazindor-gm-tools/templates/gm-screen.hbs",
      scrollable: [".scrollable"]
    }
  };

  _prepareTabs() {
    for (const tab of this.tabs) {
      if (tab.type === "actor") {
        if (tab.actorSheetA) tab.actorSheetA = null;
        if (tab.actorSheetB) tab.actorSheetB = null;
      }
      if (tab.type === "journal") {
        tab.journals = [];
      }
    }
  }

  _initializeApplicationOptions(options) {
    const initialized = super._initializeApplicationOptions(options);
    initialized.actions.activateTab = this._onActivateTab;
    initialized.actions.addTab = this._onAddTab;
    initialized.actions.configTab = this._onTabConfig;
    initialized.actions.deleteTab = this._onTabDelete;
    initialized.actions.clearTab = this._onClearTab;
    return initialized;
  }

  //=====================
  //       CONTEXT      =
  //=====================
  async _prepareContext(options) {
    const context = await super._prepareContext(options);

    context.tabs = foundry.utils.deepClone(this.tabs);
    context.selectedIndex = this.index;
    context.selectedTab = foundry.utils.deepClone(this.selectedTab);
    if (context.selectedTab.type === "actor") this._prepareActorTab(context);
    if (context.selectedTab.type === "journal") this._prepareJournalTab(context);

    return context;
  }

  _prepareActorTab(context) {
    let actorContentWidth = this.selectedTab.actorSheetA?.position?.width || 5;
    if (this.selectedTab.actorSheetB && this.selectedTab.renderActorB) {
      actorContentWidth += (this.selectedTab.actorSheetB?.position?.width || 0) + 45;
    }
    context.selectedTab.actorContentWidth = actorContentWidth;

    for (const actor of context.selectedTab.records) {
      if (actor.uuid === this.selectedTab.actorSheetA?.actor?.uuid) actor.active = "activeA";
      if (this.selectedTab.renderActorB && actor.uuid === this.selectedTab.actorSheetB?.actor?.uuid) actor.active = "activeB";
    }
  }

  _prepareJournalTab(context) {
    const grid = Object.entries(this.selectedTab.grid);
    const cells = [];
    let counter = 0;

    // Row 1
    for (const [colKey, column] of grid) {
      if (counter < 3) {
        cells.push({
          colspan: column.width1,
          rowspan: column.height,
          key: `${colKey}#row1`
        });
      }
      counter += column.width1;
    }

    // Row 2
    counter = 0;
    for (const [colKey, column] of grid) {
      if (column.height === 2) {
        column.width2 = column.width1;
      }
      if (counter < 3 && column.height === 1) {
        cells.push({
          colspan: column.width2,
          rowspan: column.height,
          key: `${colKey}#row2`
        });
      }
      counter += column.width2;
    }
    context.selectedTab.cells = cells;
  }

  //=====================
  //       ACTIONS      =
  //=====================
  _onActivateTab(event, target) {
    const index = parseInt(target.dataset.index);
    if (isNaN(index)) return;

    if (this.index === index) return;
    this._closeTab();
    this.index = index;
    this.render();
  }

  async _onAddTab() {
    const answers = await PDE.InputDialog.create("input", {
      header: game.i18n.localize("PGT.GM_SCREEN.CREATE_HEADER"),
      inputs: [
        {
          type: "input",
          label: game.i18n.localize("PGT.GM_SCREEN.TAB_NAME"),
        },
        {
          type: "select",
          label: game.i18n.localize("PGT.GM_SCREEN.TAB_TYPE"),
          options: {
            actor: game.i18n.localize("PGT.GM_SCREEN.TAB_TYPE_ACTOR"), 
            journal: game.i18n.localize("PGT.GM_SCREEN.TAB_TYPE_JOURNAL"), 
          }
        }
      ]
    });
    if (!answers) return;
    if (!answers[1]) {
      ui.notifications.error(game.i18n.localize("PGT.GM_SCREEN.WRONG_TAB_TYPE"));
      return;
    }

    const config = {
      name: answers[0],
      records: [],
      type: answers[1]
    }

    switch(answers[1]) {

      case "actor": 
        config.actorSheetA = null,
        config.actorSheetB = null,
        config.renderActorB = false
        break;

      case "journal":
        config.grid = {
          col1: {
            row1: "",
            row2: "",
            width1: 1,
            width2: 1,
            height: 1,
          },
          col2: {
            row1: "",
            row2: "",
            width1: 1,
            width2: 1,
            height: 1,
          },
          col3: {
            row1: "",
            row2: "",
            width1: 1,
            width2: 1,
            height: 1,
          }
        }
        break;
    }

    this.tabs.push(config);
    this.render();
  }

  async _onTabConfig() {
    if (this.selectedTab.type !== "journal") return;

    const answers = await PDE.InputDialog.create("input", {
      header: game.i18n.localize("PGT.GM_SCREEN.CONFIGURE_HEADER"),
      inputs: [
        {
          type: "input",
          label: game.i18n.localize("PGT.GM_SCREEN.COL1_WIDTH_1"),
          preselected: this.selectedTab.grid.col1.width1
        },
        {
          type: "input",
          label: game.i18n.localize("PGT.GM_SCREEN.COL1_WIDTH_2"),
          preselected: this.selectedTab.grid.col1.width2
        },
        {
          type: "input",
          label: game.i18n.localize("PGT.GM_SCREEN.COL1_HEIGHT"),
          preselected: this.selectedTab.grid.col1.height
        },
        {
          type: "input",
          label: game.i18n.localize("PGT.GM_SCREEN.COL2_WIDTH_1"),
          preselected: this.selectedTab.grid.col2.width1
        },
        {
          type: "input",
          label: game.i18n.localize("PGT.GM_SCREEN.COL2_WIDTH_2"),
          preselected: this.selectedTab.grid.col2.width2
        },
        {
          type: "input",
          label: game.i18n.localize("PGT.GM_SCREEN.COL2_HEIGHT"),
          preselected: this.selectedTab.grid.col2.height
        },
        {
          type: "input",
          label: game.i18n.localize("PGT.GM_SCREEN.COL3_HEIGHT"),
          preselected: this.selectedTab.grid.col3.height
        },
      ]
    })
    if (!answers) return;

    this.selectedTab.grid.col1.width1 = this._parseOrDefault(answers[0], 1);
    this.selectedTab.grid.col1.width2 = this._parseOrDefault(answers[1], 1);
    this.selectedTab.grid.col1.height = this._parseOrDefault(answers[2], 1);
    this.selectedTab.grid.col2.width1 = this._parseOrDefault(answers[3], 1);
    this.selectedTab.grid.col2.width2 = this._parseOrDefault(answers[4], 1);
    this.selectedTab.grid.col2.height = this._parseOrDefault(answers[5], 1);
    this.selectedTab.grid.col3.height = this._parseOrDefault(answers[6], 1);
    this.render();
  }

  _parseOrDefault(value, def) {
    const parsed = parseInt(value);
    if (isNaN(parsed)) return def;
    return parsed;
  }

  _onClearTab() {
    if (this.selectedTab.type !== "journal") return;

    this._closeTab();
    const grid = this.selectedTab.grid;
    grid.col1.row1 = "";
    grid.col1.row2 = "";
    grid.col2.row1 = "";
    grid.col2.row2 = "";
    grid.col3.row1 = "";
    grid.col3.row2 = "";
  }

  _onTabDelete() {
    this._closeTab();
    delete this.tabs.splice(this.index, 1);
    this.index = 0;
    this.render();
  }

  _onRemoveRecord(ix) {
    const index = parseInt(ix);
    if (isNaN(index)) return;
    delete this.selectedTab.records.splice(index, 1);
    this.render();
  }

  _onMouseDown(event) {
    let dataset = event.target.dataset;
    if (!dataset?.action) dataset = event.target.parentElement?.dataset;
    if (dataset?.action === "removeRecord") {
      this._onRemoveRecord(dataset.index);
    }
    else {
      super._onMouseDown(event)
    }
  }

  _onActivable(path, which, dataset) {
    if (this.selectedTab.type === "actor") return this._openActorSheet(which, dataset);
    super._onActivable(path, which, dataset);
  }

  async _openActorSheet(which, dataset) {
    const index = parseInt(dataset.index);
    if (isNaN(index)) return;

    const record = this.selectedTab.records[index];
    const actor = await fromUuid(record.uuid);
    if (!actor) {
      ui.notifications.error(game.i18n.localize("PGT.GM_SCREEN.ACTOR_NOT_EXIST"));
      return;
    }
    if (which === 1) {
      if (this.selectedTab.actorSheetA) this.selectedTab.actorSheetA.close();
      if (this.selectedTab.actorSheetA?.actor?.uuid === actor.uuid) this.selectedTab.actorSheetA = null;
      else this.selectedTab.actorSheetA = actor.sheet;
    }
    if (which === 3) {
      if (this.selectedTab.actorSheetB) this.selectedTab.actorSheetB.close();
      if (this.selectedTab.actorSheetB?.actor?.uuid === actor.uuid) this.selectedTab.actorSheetB = null;
      else this.selectedTab.actorSheetB = actor.sheet;
    }
    this.render();
  }

  async _onDrop(event) {
    const object = await super._onDrop(event);

    if (this.selectedTab.type === "actor" && object.type === "Actor") {
      const actor = await fromUuid(object.uuid);
      if (!actor) return;

      this.selectedTab.records.push({
        uuid: actor.uuid,
        name: actor.name,
        img: actor.img
      });
      this.render();
    }

    if (this.selectedTab.type === "journal" && object.type === "JournalEntry") {
      const key = event.target?.dataset?.key;
      if (!key) return;
      const [col, row] = key.split("#");
      this._removeUuidIfAlreadyExist(object.uuid);
      this.selectedTab.grid[col][row] = object.uuid;
      this.render();
    }
  }

  _removeUuidIfAlreadyExist(uuid) {
    const grid = this.selectedTab.grid;
    if (grid.col1.row1 === uuid) grid.col1.row1 = "";
    if (grid.col1.row2 === uuid) grid.col1.row2 = "";
    if (grid.col2.row1 === uuid) grid.col2.row1 = "";
    if (grid.col2.row2 === uuid) grid.col2.row2 = "";
    if (grid.col3.row1 === uuid) grid.col3.row1 = "";
    if (grid.col3.row2 === uuid) grid.col3.row2 = "";
  }

  //=====================
  //       RENDER       =
  //=====================
  async render(force=false, options={}) {
    this._preRenerOperations();
    const app = await super.render(force, options);

    switch (this.selectedTab.type) {
      case "actor": 
        const shouldRenderActorB = this._shouldRenderActorB();
        if (shouldRenderActorB !== this.selectedTab.renderActorB) {
          this.selectedTab.renderActorB = shouldRenderActorB;
          this.render(); // In that case we need to render again
        }
        this._renderActorSheets();
        break;

      case "journal":
        this._renderJournals();
        break;
    }

    return app;
  }

  _preRenerOperations() {
    this.selectedTab = this.tabs[this.index];
    if (!this.selectedTab) {
      this.selectedTab = this.tabs[0];
      this.index = 0;

      if (!this.selectedTab) {
        this.tabs.push({
          name: "Main Actors",
          records: [],
          type: "actor"
        });
        this.selectedTab = this.tabs[0];
      }
    }
  }

  _shouldRenderActorB() {
    if (!this.selectedTab.actorSheetB) return false;
    const screenWidth = this.element.clientWidth;
    const actorAWidth = this.selectedTab.actorSheetA?.position?.width || 0;
    const actorBWidth = this.selectedTab.actorSheetB?.position?.width || 0;
    return screenWidth - 200 > actorAWidth + actorBWidth;
  }

  async _renderActorSheets() {
    if (!this.element) return;
    if (!this.selectedTab.actorSheetA && this.selectedTab.actorSheetB) {
      this.selectedTab.actorSheetA = this.selectedTab.actorSheetB;
      this.selectedTab.actorSheetB = null;
    }
    if (!this.selectedTab.actorSheetA) return;

    // Render Actor A
    const screenWidth = this.element.clientWidth;
    const actorAWidth = this.selectedTab.actorSheetA.position.width;
    const options = {
      position: {
        left: screenWidth - actorAWidth - 5,
        top: 60,
      },
    }

    this.selectedTab.actorSheetA.render(true, foundry.utils.deepClone(options));
    const elementA = await waitForRender(this.selectedTab.actorSheetA);
    if (elementA.classList) {
      elementA.classList.add("gm-screen-embeded");
    }
    else {
      elementA.addClass("gm-screen-embeded");
      this.selectedTab.actorSheetA.setPosition(options.position);
    }

    // Render Actor B
    if (!this.selectedTab.renderActorB) return;
    const actorBWidth = this.selectedTab.actorSheetB.position.width;
    options.position.left -= (actorBWidth + 45);

    this.selectedTab.actorSheetB.render(true, foundry.utils.deepClone(options));
    const elementB = await waitForRender(this.selectedTab.actorSheetB);
    if (elementB.classList) {
      elementB.classList.add("gm-screen-embeded");
    }
    else {
      elementB.addClass("gm-screen-embeded");
      this.selectedTab.actorSheetB.setPosition(options.position);
    }
  }

  async _renderJournals() {
    if (!this.element) return;

    const journals = []
    const cells = this.element.querySelectorAll(".cell");
    for (const cell of cells) {
      const [col, row] = cell.dataset.key.split("#");
      const uuid = this.selectedTab.grid[col][row];
      const journal = await fromUuid(uuid);
      if (!journal) continue;

      const rect = cell.getBoundingClientRect();
      const options = {
        position: {
          top: rect.top + 2,
          left: rect.left + 2,
          width: rect.width - 4,
          height: rect.height - 4
        }
      }
      journal.sheet.render(true, options);
      const element = await waitForRender(journal.sheet);
      if (element.classList) {
        journal.sheet.element.classList.add("gm-screen-embeded");
        journal.sheet.element.style.cssText += `min-width: ${rect.width - 4}px !important; min-height: ${rect.height - 4}px !important; max-width: ${rect.width - 4}px !important; max-height: ${rect.height - 4}px !important;`;
      }
      else {
        element.addClass("gm-screen-embeded");
        element[0].style.cssText += `min-width: ${rect.width - 4}px !important; min-height: ${rect.height - 4}px !important; max-width: ${rect.width - 4}px !important; max-height: ${rect.height - 4}px !important;`;
        journal.sheet.setPosition(options.position);
      }

      journals.push(journal);
    }

    this.selectedTab.journals = journals
  }

  async close() {
    this._closeTab();
    game.settings.set("pgt", "gmScreenTabs", this.tabs);
    return super.close();
  }

  _closeTab() {
    if (this.selectedTab.type === "actor") {
      if (this.selectedTab.actorSheetA) {
        this.selectedTab.actorSheetA.close();
        if (game.system.id === "pf2e") this.selectedTab.actorSheetA = null;
      }
      if (this.selectedTab.actorSheetB) {
        this.selectedTab.actorSheetB.close();
        if (game.system.id === "pf2e") this.selectedTab.actorSheetB = null;
      }
    }
    if (this.selectedTab.type === "journal") {
      this.selectedTab.journals.forEach(journal => journal.sheet.close());
    }
  }
}

let gmScreenWindow;
export function gmScreen() {
  if (!gmScreenWindow) {
    gmScreenWindow = new GmScreen();
  }
  if (gmScreenWindow.rendered) gmScreenWindow.close();
  else gmScreenWindow.render(true);
}

function waitForRender(app) {
  return new Promise(resolve => {
    const hook = Hooks.on("render" + app.constructor.name, (app2, html) => {
      if (app === app2) {
        Hooks.off("render" + app.constructor.name, hook);
        resolve(html);
      }
    });
  });
}