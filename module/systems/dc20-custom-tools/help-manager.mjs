import { BaseDialog } from "/modules/pazindor-dev-essentials/module/dialog/base-dialog.mjs";

class HelpManager extends BaseDialog {

  constructor(options={}) {
    super(options);
    canvas.tokens.activate();
    this.dice = "";
    this.duration = "";
  }

  /** @override */
  static PARTS = {
    root: {
      template: "modules/pazindor-gm-tools/templates/dc20-custom-tools/help-manager.hbs",
    }
  };

  _initializeApplicationOptions(options) {
    const initialized = super._initializeApplicationOptions(options);
    initialized.window.title = "dc20rpg.dialog.help.title";
    initialized.window.icon = "fa-solid fa-dice-d8";
    initialized.position.width = 500;
    initialized.actions.apply = this._onApply;
    return initialized;
  }

  async _prepareContext(options) {
    const context = await super._prepareContext(options);

    context.dices = {
      8: "d8", 6: "d6", 4: "d4", 10: "d10", 12: "d12",
      [-8]: "-d8", [-6]: "-d6", [-4]: "-d4", [-10]: "-d10", [-12]: "-d12",
    }
    context.durations = CONFIG.DC20RPG.DROPDOWN_DATA.helpDiceDuration;
    context.dice = this.dice;
    context.duration = this.duration;
    return context;
  }

  async _onApply(event, target) {
    event.preventDefault();

    const tokens = PDE.utils.getSelectedTokens();
    for (const token of tokens) {
      const actor = token.actor;
      if (!actor) continue;
      const value = parseInt(this.dice);
      actor.help.prepare({diceValue: Math.abs(value), subtract: value < 0, duration: this.duration});
    }
  }
}

let helpManagerWindow;
export function openHelpManager() {
  if (!helpManagerWindow) {
    helpManagerWindow = new HelpManager();
  }
  if (helpManagerWindow.rendered) helpManagerWindow.close();
  else helpManagerWindow.render(true);
}