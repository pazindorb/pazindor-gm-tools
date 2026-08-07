import { BaseDialog } from "/modules/pazindor-dev-essentials/module/dialog/base-dialog.mjs";

export class GmScreen extends BaseDialog {
  SUPPORTED_DOCUMENT_TYPES = ["JournalEntry", "RollTable", "JournalEntryPage", "Cards",  "Item"]

  constructor(options = {}) {
    super(options);
    this.tabs = game.settings.get("pazindor-gm-tools", "gmScreenTabs");
    this.editable = false;
    this.index = 0;
    this._basicRenderId = 0;
    this._closing = false;
    this.configuring = false;
    this.#prepareTabs();
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
      template: "modules/pazindor-gm-tools/templates/gm-screen.hbs"
    }
  };

  #prepareTabs() {
    if (!this.tabs.length) this.tabs.push(this.#createBasicTab("Main"));
    for (const tab of this.tabs) tab.basic = [];
  }

  #createBasicTab(name) {
    return {
      name,
      type: "basic",
      gridColumns: 3,
      basic: [],
      cells: this.#createDefaultCells()
    };
  }

  #getPersistentTabs() {
    const tabs = [];
    for (const tab of this.tabs) {
      tabs.push({
        name: tab.name,
        type: tab.type,
        gridColumns: 3,
        cells: foundry.utils.deepClone(tab.cells)
      });
    }
    return tabs;
  }

  #saveTabs() {
    return game.settings.set("pazindor-gm-tools", "gmScreenTabs", this.#getPersistentTabs());
  }

  _initializeApplicationOptions(options) {
    const initialized = super._initializeApplicationOptions(options);
    initialized.actions.activateTab = this._onActivateTab;
    initialized.actions.addTab = this._onAddTab;
    initialized.actions.configTab = this._onTabConfig;
    initialized.actions.deleteTab = this._onTabDelete;
    initialized.actions.clearTab = this._onClearTab;
    initialized.actions.editMode = this._onEditMode;
    initialized.actions.mergeCell = this._onMergeCell;
    initialized.actions.unmergeCell = this._onUnmergeCell;
    initialized.actions.finishLayout = this._onFinishLayout;
    return initialized;
  }

  //=====================
  //       CONTEXT      =
  //=====================
  async _prepareContext(options) {
    const context = await super._prepareContext(options);

    context.editable = this.editable;
    context.tabs = foundry.utils.deepClone(this.tabs);
    context.selectedIndex = this.index;
    context.selectedTab = foundry.utils.deepClone(this.selectedTab);
    context.configuring = this.configuring;
    this.#prepareBasicTab(context);

    return context;
  }

  #prepareBasicTab(context) {
    context.selectedTab.cells = this.selectedTab.cells.map(cell => ({
      ...foundry.utils.deepClone(cell),
      key: cell.id,
      columnStart: cell.x,
      rowStart: cell.y,
      colspan: cell.width,
      rowspan: cell.height,
      occupied: Boolean(cell.uuid),
      mergeRight: Boolean(this.#getMergeGroup(cell, "right")),
      mergeDown: Boolean(this.#getMergeGroup(cell, "down")),
      canUnmerge: Boolean(cell.children?.length || cell.width > 1 || cell.height > 1)
    }));
  }

  //=====================
  //       ACTIONS      =
  //=====================
  _onActivateTab(event, target) {
    const index = parseInt(target.dataset.index);
    if (isNaN(index)) return;

    if (this.index === index) return;
    this.#closeTab();
    if (this.configuring) this.#saveTabs();
    this.configuring = false;
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
        }
      ]
    });
    if (!answers) return;
    this.tabs.push(this.#createBasicTab(answers[0] || game.i18n.localize("PGT.GM_SCREEN.UNTITLED_TAB")));
    this.#saveTabs();
    this.render();
  }

  async _onTabConfig() {
    this.#closeTab();
    this.configuring = true;
    this.render();
  }

  _onFinishLayout() {
    this.configuring = false;
    this.#saveTabs();
    this.render();
  }

  _onMergeCell(event, target) {
    const cell = this.selectedTab.cells.find(item => item.id === target.dataset.cellId);
    const direction = target.dataset.direction;
    const neighbors = this.#getMergeGroup(cell, direction);
    if (!cell || !neighbors?.length) return;

    const group = [cell, ...neighbors];
    if (group.filter(item => item.uuid).length > 1) {
      ui.notifications.warn(game.i18n.localize("PGT.GM_SCREEN.MERGE_OCCUPIED"));
      return;
    }

    const children = foundry.utils.deepClone(group);
    const merged = {
      id: cell.id,
      x: Math.min(...group.map(item => item.x)),
      y: Math.min(...group.map(item => item.y)),
      width: direction === "right" ? cell.width + neighbors[0].width : cell.width,
      height: direction === "down" ? cell.height + neighbors[0].height : cell.height,
      uuid: group.find(item => item.uuid)?.uuid ?? "",
      children
    };
    const removedIds = new Set(group.map(item => item.id));
    this.selectedTab.cells = this.selectedTab.cells.filter(item => !removedIds.has(item.id));
    this.selectedTab.cells.push(merged);
    this.render();
  }

  _onUnmergeCell(event, target) {
    const cell = this.selectedTab.cells.find(item => item.id === target.dataset.cellId);
    if (!cell) return;

    let children = foundry.utils.deepClone(cell.children ?? []);
    if (!children.length) children = this.#splitCell(cell);
    if (!children.length) return;
    if (cell.uuid && !children.some(item => item.uuid)) children[0].uuid = cell.uuid;

    this.selectedTab.cells = this.selectedTab.cells.filter(item => item.id !== cell.id);
    this.selectedTab.cells.push(...children);
    this.render();
  }

  #getMergeGroup(cell, direction) {
    if (!cell) return null;
    const cells = this.selectedTab.cells;
    let neighbors;
    if (direction === "right") {
      neighbors = cells.filter(item => item.x === cell.x + cell.width
        && item.y >= cell.y && item.y + item.height <= cell.y + cell.height);
      if (!neighbors.length || new Set(neighbors.map(item => item.width)).size > 1) return null;
      const covered = neighbors.reduce((sum, item) => sum + item.height, 0);
      return covered === cell.height ? neighbors : null;
    }
    if (direction === "down") {
      neighbors = cells.filter(item => item.y === cell.y + cell.height
        && item.x >= cell.x && item.x + item.width <= cell.x + cell.width);
      if (!neighbors.length || new Set(neighbors.map(item => item.height)).size > 1) return null;
      const covered = neighbors.reduce((sum, item) => sum + item.width, 0);
      return covered === cell.width ? neighbors : null;
    }
    return null;
  }

  #splitCell(cell) {
    if (cell.height > 1) {
      return [
        this.#createCell(cell.x, cell.y, cell.width, 1, cell.uuid),
        this.#createCell(cell.x, cell.y + 1, cell.width, cell.height - 1)
      ];
    }
    if (cell.width > 1) {
      const leftWidth = Math.floor(cell.width / 2);
      return [
        this.#createCell(cell.x, cell.y, leftWidth, cell.height, cell.uuid),
        this.#createCell(cell.x + leftWidth, cell.y, cell.width - leftWidth, cell.height)
      ];
    }
    return [];
  }

  _onClearTab() {
    this.#closeTab();
    for (const cell of this.selectedTab.cells) this.#setCellUuid(cell, "");
    this.#saveTabs();
    this.render();
  }

  _onEditMode() {
    this.editable = !this.editable;
    this.#closeTab();
    this.render();
  }

  _onTabDelete() {
    this.#closeTab();
    this.tabs.splice(this.index, 1);
    this.index = 0;
    this.#saveTabs();
    this.render();
  }

  async _onDrop(event) {
    const object = await super._onDrop(event);

    if (this.SUPPORTED_DOCUMENT_TYPES.includes(object.type)) {
      const key = this.#getBasicDropKey(event);
      if (!key) return;
      this.#removeUuidIfAlreadyExist(object.uuid);
      const cell = this.selectedTab.cells.find(item => item.id === key);
      if (!cell) return;
      this.#setCellUuid(cell, object.uuid);
      this.#saveTabs();
      this.render();
    }
  }

  #getBasicDropKey(event) {
    const directCell = event.target?.closest?.(".cell");
    if (directCell?.dataset?.key) return directCell.dataset.key;

    const x = event.clientX;
    const y = event.clientY;
    if (typeof x !== "number" || typeof y !== "number") return null;

    const cells = this.element?.querySelectorAll(".cell") ?? [];
    for (const cell of cells) {
      const rect = cell.getBoundingClientRect();
      if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) return cell.dataset.key;
    }

    return null;
  }

  #activateBasicSheetClearButton(sheetElement, key) {
    if (!sheetElement) return;

    sheetElement.querySelector(".gm-screen-clear-document")?.remove();
    const button = document.createElement("button");
    button.type = "button";
    button.classList.add("gm-screen-clear-document");
    button.dataset.tooltip = game.i18n.localize("PGT.GM_SCREEN.CLEAR_DOCUMENT");
    button.innerHTML = '<i class="fa-solid fa-trash"></i>';
    button.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();
      button.remove();
      this.#clearBasicDocument(key);
    });
    sheetElement.appendChild(button);
  }

  #clearBasicDocument(key) {
    const cell = this.selectedTab.cells.find(item => item.id === key);
    if (!cell) return;
    const uuid = cell.uuid;
    const droppedDocument = this.selectedTab.basic.find(document => document.uuid === uuid);
    if (droppedDocument?.sheet) this.#closeEmbeddedSheet(droppedDocument.sheet);
    this.#setCellUuid(cell, "");
    this.#saveTabs();
    this.render();
  }

  #removeUuidIfAlreadyExist(uuid) {
    for (const cell of this.selectedTab.cells) {
      if (cell.uuid === uuid) this.#setCellUuid(cell, "");
    }
  }

  #setCellUuid(cell, uuid) {
    const previousUuid = cell.uuid;
    cell.uuid = uuid;
    if (!cell.children?.length) return;

    const target = cell.children.find(child => child.uuid === previousUuid) ?? cell.children[0];
    for (const child of cell.children) this.#setCellUuid(child, child === target ? uuid : "");
  }

  //=====================
  //       RENDER       =
  //=====================
  async render(force=false, options={}) {
    this.#prepareRender();
    const app = await super.render(force, options);
    if (!this.configuring) this.#renderBasic();
    return app;
  }

  #prepareRender() {
    this.selectedTab = this.tabs[this.index];
    if (!this.selectedTab) {
      this.selectedTab = this.tabs[0];
      this.index = 0;

      if (!this.selectedTab) {
        this.tabs.push(this.#createBasicTab("Main"));
        this.selectedTab = this.tabs[0];
      }
    }
  }

  async #renderBasic() {
    if (!this.element) return;

    const renderId = ++this._basicRenderId;
    const tab = this.selectedTab;
    const basic = []
    const cells = this.element.querySelectorAll(".cell");
    for (const cell of cells) {
      const cellConfig = tab.cells.find(item => item.id === cell.dataset.key);
      const uuid = cellConfig?.uuid;
      const document = await fromUuid(uuid);
      if (!document) {
        if (uuid) this.#setBasicCellStatus(cell, "unavailable");
        continue;
      }

      const rect = cell.getBoundingClientRect();
      const options = {
        position: {
          top: rect.top + 2,
          left: rect.left + 2,
          width: rect.width - 4,
          height: rect.height - 4
        }
      }
      const element = await renderAndWait(document.sheet, options);
      if (!element) {
        this.#setBasicCellStatus(cell, "failed");
        continue;
      }
      if (renderId !== this._basicRenderId || this.selectedTab !== tab) {
        if (this.configuring || !this.#tabContainsUuid(this.selectedTab, document.uuid)) {
          this.#closeEmbeddedSheet(document.sheet);
        }
        continue;
      }
      const sheetElement = element.classList ? element : element[0];
      if (!sheetElement) continue;
      sheetElement.classList.remove("gm-screen-sheet-closing");
      sheetElement.classList.add("gm-screen-basic-document");
      if (element.classList) {
        sheetElement.classList.add("gm-screen-embeded");
        sheetElement.classList.toggle("edit-locked", !this.editable);
      }
      else {
        element.addClass("gm-screen-embeded");
        element.toggleClass("edit-locked", !this.editable);
        document.sheet.setPosition(options.position);
      }
      sheetElement.style.setProperty("--gm-screen-document-width", `${rect.width - 4}px`);
      sheetElement.style.setProperty("--gm-screen-document-height", `${rect.height - 4}px`);
      this.#setBasicCellStatus(cell, "ready");
      this.#activateBasicSheetClearButton(sheetElement, cell.dataset.key);

      // Journal Page - disable editor
      if (!this.editable) {
        const proseMirror = sheetElement.querySelectorAll("prose-mirror");
        for (const editor of proseMirror) editor.disabled = true;
      }

      basic.push(document);
    }

    if (renderId === this._basicRenderId && this.selectedTab === tab) tab.basic = basic;
  }

  #setBasicCellStatus(cell, status) {
    if (!cell?.isConnected) return;
    cell.dataset.status = status;
    const loader = cell.querySelector(".cell-loading");
    if (!loader) return;

    const icon = loader.querySelector("i");
    const label = loader.querySelector("span");
    if (status === "ready") {
      loader.hidden = true;
      return;
    }

    loader.hidden = false;
    icon.className = status === "loading"
      ? "fa-solid fa-spinner fa-spin"
      : "fa-solid fa-triangle-exclamation";
    const localizationKey = status === "unavailable"
      ? "PGT.GM_SCREEN.DOCUMENT_UNAVAILABLE"
      : "PGT.GM_SCREEN.DOCUMENT_LOAD_FAILED";
    label.textContent = game.i18n.localize(localizationKey);
  }

  #tabContainsUuid(tab, uuid) {
    if (tab?.type !== "basic") return false;
    return tab.cells.some(cell => cell.uuid === uuid);
  }

  async close() {
    if (this._closing) return;
    this._closing = true;
    this.#showClosingOverlay();
    this._basicRenderId++;
    try {
      await this.#closeTab();
      await this.#saveTabs();
      return await super.close();
    }
    finally {
      this._closing = false;
    }
  }

  #showClosingOverlay() {
    const content = this.element?.querySelector("#gm-screen-content");
    if (!content) return;
    content.setAttribute("aria-busy", "true");
    const overlay = content.querySelector(".gm-screen-closing-overlay");
    if (overlay) overlay.hidden = false;
  }

  #closeTab() {
    this._basicRenderId++;
    const documents = this.selectedTab.basic ?? [];
    this.selectedTab.basic = [];
    return Promise.allSettled(documents.map(document => this.#closeEmbeddedSheet(document.sheet)));
  }

  #closeEmbeddedSheet(sheet) {
    const element = sheet?.element?.classList ? sheet.element : sheet?.element?.[0];
    element?.querySelector(".gm-screen-clear-document")?.remove();
    element?.classList.add("gm-screen-sheet-closing");
    try {
      return Promise.resolve(sheet?.close());
    }
    catch (error) {
      return Promise.reject(error);
    }
  }

  #createCell(x, y, width, height, uuid = "") {
    return {id: foundry.utils.randomID(), x, y, width, height, uuid};
  }

  #createDefaultCells() {
    return [
      this.#createCell(1, 1, 1, 1), this.#createCell(2, 1, 1, 1), this.#createCell(3, 1, 1, 1),
      this.#createCell(1, 2, 1, 1), this.#createCell(2, 2, 1, 1), this.#createCell(3, 2, 1, 1)
    ];
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

function renderAndWait(app, options) {
  return new Promise(resolve => {
    let settled = false;
    const finish = html => {
      if (settled) return;
      settled = true;
      Hooks.off("render" + app.constructor.name, hook);
      clearTimeout(timeout);
      resolve(html ?? app.element ?? null);
    };
    const hook = Hooks.on("render" + app.constructor.name, (app2, html) => {
      if (app === app2) finish(html);
    });
    const timeout = setTimeout(() => finish(app.element), 5000);
    try {
      const result = app.render(true, options);
      if (result?.then) result.then(() => {
        if (app.element) finish(app.element);
      }).catch(() => finish(null));
    }
    catch (error) {
      console.error("Pazindor GM Tools | Failed to render embedded sheet", error);
      finish(null);
    }
  });
}
