import { prepareConstants } from "./constant.mjs";
import { openAdventurersRegister } from "./dialog/adventurers-register.mjs";
import { openConditionManager } from "./dialog/condition-manager.mjs";
import { openRestRequest, openRollRequest } from "./dialog/request-dialog.mjs";
import { registerHandlebarsHelpers } from "./configs/handlebars.mjs";
import { registerModuleSettings } from "./configs/settings.mjs";
import { registerModuleSocket } from "./socket.mjs";
import { pf2eConfig } from "./systems/pf2e.mjs";
import { dnd5eConfig } from "./systems/dnd5e.mjs";
import { registerKeybindings } from "./configs/keybindings.mjs";
import { keybindToText } from "./utils.mjs";

Hooks.once("init", async function() {
  registerModuleSettings();
  registerHandlebarsHelpers();
  registerKeybindings();
  window.PGT = {
    rollOptions: {},
    restOptions: {},
    onRollRequest: null,
    onRestRequest: null,
    conditions: {},
    applyCondition: null,
    conditionRollKeys: null,
    adventurersTabs: null,
    actorTypes: ["character"],
    systemId: null,
  }
  PGT.CONST = prepareConstants();
});

Hooks.once("ready", async function() {
  registerModuleSocket();

  switch (game.system.id) {
    case "dnd5e": dnd5eConfig(); break;
    case "pf2e": pf2eConfig(); break;
  }
  // Refresh controls
  ui.controls.render({reset:true});
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
    visible: game.user.isGM,
    activeTool: "init",
    tools: {
      request: {
        name: "request",
        title: `${game.i18n.localize("PGT.MENU.ROLL")} (${keybindToText(game.keybindings.get("pgt", "rollRequest"))})`,
        icon: "fas fa-dice",
        button: true,
        onChange: () => openRollRequest(),
        visible: !!PGT.onRollRequest
      },
      rest: {
        name: "rest",
        title: `${game.i18n.localize("PGT.MENU.REST")} (${keybindToText(game.keybindings.get("pgt", "restRequest"))})`,
        icon: "fas fa-bed",
        button: true,
        onChange: () => openRestRequest(),
        visible: !!PGT.onRestRequest
      },
      condition: {
        name: "condition",
        title: `${game.i18n.localize("PGT.MENU.CONDITION")} (${keybindToText(game.keybindings.get("pgt", "condition"))})`,
        icon: "fas fa-bolt",
        button: true,
        onChange: () => openConditionManager(),
        visible: !!PGT.applyCondition
      },
      adventurers: {
        name: "adventurers",
        title: `${game.i18n.localize("PGT.MENU.ADVENTURERS")} (${keybindToText(game.keybindings.get("pgt", "adventurers"))})`,
        icon: "fas fa-book-open-cover",
        button: true,
        onChange: () => openAdventurersRegister(),
        visible: true
      },
      gmScreen: {
        name: "gmScreen",
        title: `${game.i18n.localize("PGT.MENU.GM_SCREEN")} (${keybindToText(game.keybindings.get("pgt", "gmScreen"))})`,
        icon: "fas fa-screencast",
        button: true,
        onChange: () => console.log("GM_SCREEN"),
        visible: false
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