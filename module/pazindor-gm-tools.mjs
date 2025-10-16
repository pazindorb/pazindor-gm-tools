import { prepareConstants } from "./constant.mjs";
import { openRestRequest, openRollRequest } from "./dialog/request-dialog.mjs";
import { registerModuleSocket } from "./socket.mjs";
import * as dnd5e from "./systems/dnd5e.mjs";
import * as pf2e from "./systems/pf2e.mjs";

Hooks.once("init", async function() {
  window.PGT = {
    rollOptions: {},
    restOptions: {},
    onRollRequest: null,
    onRestRequest: null,
    actorTypes: ["character"],
    systemId: null,
  }
  PGT.CONST = prepareConstants()
});

Hooks.once("ready", async function() {
  registerModuleSocket();

  switch (game.system.id) {
    case "dnd5e":
      PGT.rollOptions = dnd5e.rollOptions();
      PGT.restOptions = dnd5e.restOptions();
      PGT.onRollRequest = dnd5e.rollRequest;
      PGT.onRestRequest = dnd5e.restRequest;
      PGT.actorTypes = ["character"];
      PGT.systemId = "dnd5e";
      break;

    case "pf2e": 
      PGT.rollOptions = pf2e.rollOptions();
      // PGT.restOptions = pf2e.restOptions(); // Check how pathfinder rest work
      PGT.onRollRequest = pf2e.rollRequest;
      // PGT.onRestRequest = pf2e.restRequest; // Check how pathfinder rest work
      PGT.actorTypes = ["character"];
      PGT.systemId = "pf2e";
      break;
  }

  // Refresh controls
  ui.controls.render({reset:true})
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
        title: "PGT.MENU.ROLL",
        icon: "fas fa-dice",
        button: true,
        onChange: () => openRollRequest(),
        visible: !!PGT.onRollRequest
      },
      rest: {
        name: "rest",
        title: "PGT.MENU.REST",
        icon: "fas fa-bed",
        button: true,
        onChange: () => openRestRequest(),
        visible: !!PGT.onRestRequest
      },
      gmScreen: {
        name: "gmScreen",
        title: "PGT.MENU.GM_SCREEN",
        icon: "fas fa-screencast",
        button: true,
        onChange: () => console.log("GM_SCREEN")
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