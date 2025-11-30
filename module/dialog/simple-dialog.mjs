import { PgtDialog } from "./dialog.mjs";

/**
 * Possible type examples:
 * 
 * "popupType": "info"
 * "data": {
 *  "header": String,
 *  "message": String,
 *  "information": Array[String],
 *  "hideButtons": Boolean
 * }
 * @return null
 * 
 * "popupType": "confirm"
 * "data": {
 *  "header": String,
 *  "message": String,
 *  "information": Array[String],
 *  "confirmLabel": String,
 *  "denyLabel": String
 * }
 * @return Boolean
 * 
 * "popupType": "input"
 * "data": {
 *  "header": String,
 *  "message": String,
 *  "information": Array[String],
 *  "inputs": [
 *    {
 *      "type": select/input/checkbox,
 *      "label": String,
 *      "hint": String,
 *      "options": Object[only for select type],
 *      "preselected": String/Boolean/Number
 *    }
 *  ]
 * }
 * @return Array[of output Strings]
 * 
 * "popupType": "drop"
 * "data": {
 *  "header": String,
 *  "message": String,
 *  "information": Array[String],
 * }
 * @return Array[dropped]
 */
export class SimpleDialog extends PgtDialog {

  static async create(popupType, data={}, options={}) {
    const prompt = new SimpleDialog(popupType, data, options);
    return new Promise((resolve) => {
      prompt.promiseResolve = resolve;
      prompt.render(true);
    });
  }

  static PARTS = {
    root: {
      template: "modules/pazindor-gm-tools/templates/simple-dialog.hbs",
    }
  };

  constructor(popupType, data, options = {}) {
    super(options);
    this.popupType = popupType;
    this.data = data;
    if (popupType === "drop") {
      this.data.dropData = [];
    }
    this._prepareInputs();
    this._prepareButtonLabels();
  }

  _prepareInputs() {
    if (this.popupType !== "input") return;
    for (const input of this.data.inputs) {
      if (input.preselected) input.value = input.preselected;
      else if (input.type === "checkbox") input.value = false;
      else input.value = "";
    }
  }

  _prepareButtonLabels() {
    if (this.popupType === "confirm") {
      this.data.confirmLabel = this.data.confirmLabel || game.i18n.localize("PGT.YES");
      this.data.denyLabel = this.data.denyLabel || game.i18n.localize("PGT.NO");
    }
    else {
      this.data.confirmLabel = this.data.confirmLabel || game.i18n.localize("PGT.CONFIRM");
    }
  }

  _initializeApplicationOptions(options) {
    const initialized = super._initializeApplicationOptions(options);
    initialized.window.title = "Dialog";
    initialized.window.icon = "fa-solid fa-comment-dots";
    initialized.position.width = 500;
    initialized.classes.push("force-top");

    initialized.actions.confirm = this._onConfirm;
    return initialized;
  }

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.popupType = this.popupType;
    return {
      ...context,
      ...this.data
    };
  }

  _onConfirm(event, target) {
    event.preventDefault();
    switch (this.popupType) {
      case "input": 
        const values = this.data.inputs.map(input => input.value);
        this.promiseResolve(values);
        break;

      case "confirm": 
        this.promiseResolve(target.dataset.option === "confirm"); 
        break;

      case "drop":
        this.promiseResolve(this.data.dropData); 
        break;
    }
    this.close();
  }

  /** @override */
  close(options) {
    if (this.promiseResolve) this.promiseResolve(null);
    super.close(options);
  }

  async _onDrop(event) {
    if (this.popupType !== "drop") return;

    const object = await super._onDrop(event);
    if (object?.uuid) {
      this.data.dropData.push(object?.uuid);
      this.render();
    }
  }
}