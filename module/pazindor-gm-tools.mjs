import { prepareConstants } from "./configs/constant.mjs";
import { openAdventurersRegister } from "./dialog/adventurers-register.mjs";
import { openConditionManager } from "./dialog/condition-manager.mjs";
import { openRestRequest, openRollRequest } from "./dialog/request-dialog.mjs";
import { registerHandlebarsHelpers } from "./configs/handlebars.mjs";
import { registerModuleSettings } from "./configs/settings.mjs";
import { registerModuleSocket } from "./configs/socket.mjs";
import { pf2eConfig } from "./systems/pf2e.mjs";
import { dnd5eConfig } from "./systems/dnd5e.mjs";
import { registerKeybindings } from "./configs/keybindings.mjs";
import { keybindToText } from "./utils.mjs";
import { gmScreen } from "./dialog/gm-screen.mjs";
import { openProgressTracker } from "./dialog/progress-tracker.mjs";
import { dc20Config } from "./systems/dc20.mjs";

Hooks.once("init", async function() {
  registerModuleSettings();
  registerHandlebarsHelpers();
  registerKeybindings();
  window.PGT = {
    // TODO: Add system specific tools
    rollOptions: {},
    restOptions: {},
    onRollRequest: null,
    onRestRequest: null,
    requestFields: {},
    conditions: {},
    applyCondition: null,
    conditionRollKeys: null,
    conditionExtraFields: null,
    adventurersConfig: null,
    pcActorTypes: ["character"],
    systemId: null,
  }
  PGT.CONST = prepareConstants();
});

Hooks.once("ready", async function() {
  registerModuleSocket();

  switch (game.system.id) {
    case "dnd5e": dnd5eConfig(); break;
    case "pf2e": pf2eConfig(); break;
    case "dc20rpg": dc20Config(); break;
  }
  // Refresh controls
  ui.controls.render({reset:true});

  // Resize GM Screen
  window.onresize = () => {
    const gmScreen = foundry.applications.instances.get("gm-screen");
    if (!gmScreen) return;
    if (!gmScreen.rendered) return;
    gmScreen.render();
  }
  return _preloadHandlebarsTemplates();
});

Hooks.on("gameReady", () => {
  if (!PGT.systemId) ui.notifications.warn(game.i18n.localize("PGT.ERROR.NO_SYSTEM"));
})

Hooks.on("getSceneControlButtons", (controls) => {
  controls.pazindorGmTools = {
    name: "pazindorGmTools",
    title: "PGT.MENU.TITLE",
    layer: null,
    icon: "fas fa-screwdriver-wrench",
    activeTool: "init",
    tools: {
      request: {
        name: "request",
        title: `${game.i18n.localize("PGT.MENU.ROLL")} (${keybindToText(game.keybindings.get("pazindor-gm-tools", "rollRequest"))})`,
        icon: "fas fa-dice",
        button: true,
        onChange: () => openRollRequest(),
        visible: !!PGT.onRollRequest && game.user.isGM 
      },
      rest: {
        name: "rest",
        title: `${game.i18n.localize("PGT.MENU.REST")} (${keybindToText(game.keybindings.get("pazindor-gm-tools", "restRequest"))})`,
        icon: "fas fa-bed",
        button: true,
        onChange: () => openRestRequest(),
        visible: !!PGT.onRestRequest && game.user.isGM
      },
      condition: {
        name: "condition",
        title: `${game.i18n.localize("PGT.MENU.CONDITION")} (${keybindToText(game.keybindings.get("pazindor-gm-tools", "condition"))})`,
        icon: "fas fa-bolt",
        button: true,
        onChange: () => openConditionManager(),
        visible: !!PGT.applyCondition && game.user.isGM
      },
      tracker: {
        name: "tracker",
        title: `${game.i18n.localize("PGT.MENU.TRACKER")} (${keybindToText(game.keybindings.get("pazindor-gm-tools", "tracker"))})`,
        icon: "fas fa-bars-progress",
        button: true,
        onChange: () => openProgressTracker(),
        visible:  true
      },
      adventurers: {
        name: "adventurers",
        title: `${game.i18n.localize("PGT.MENU.ADVENTURERS")} (${keybindToText(game.keybindings.get("pazindor-gm-tools", "adventurers"))})`,
        icon: "fas fa-book-open-cover",
        button: true,
        onChange: () => openAdventurersRegister(),
        visible: game.user.isGM
      },
      gmScreen: {
        name: "gmScreen",
        title: `${game.i18n.localize("PGT.MENU.GM_SCREEN")} (${keybindToText(game.keybindings.get("pazindor-gm-tools", "gmScreen"))})`,
        icon: "fas fa-screencast",
        button: true,
        onChange: () => gmScreen(),
        visible: game.user.isGM
      },
      init: {
        name: "init",
        title: "",
        icon: "hidden",
        button: true,
        onChange: () => {}
      }
    },
    onChange: (event, active) => {},
    onToolChange: () => {},
  }
});

function _preloadHandlebarsTemplates() {
  return foundry.applications.handlebars.loadTemplates([
    "modules/pazindor-gm-tools/templates/partials/extra-field.hbs"
  ]);
}