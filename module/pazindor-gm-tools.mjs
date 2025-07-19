import { openRestRequest, openRollRequest } from "./dialog/request-dialog.mjs";
import { registerModuleSocket } from "./socket.mjs";
import * as dnd5e from "./systems/dnd5e.mjs";
import * as pf2e from "./systems/pf2e.mjs";

Hooks.once("init", async function() {
  window.PGT = {
    rollOptions: {placeholder: "No system detected"},
    restOptions: {placeholder: "No system detected"},
    onRollRequest: (actor, selected) => {console.log("Pazindor's GM Tools[Roll Request]: NO SYSTEM DETECTED")},
    onRestRequest: (actor, selected) => {console.log("Pazindor's GM Tools[Rest Request]: NO SYSTEM DETECTED")},
    actorTypes: ["character"]
  }
});

Hooks.once("ready", async function() {
  registerModuleSocket();

  switch (game.system.id) {
    case "dnd5e":
      PGT.rollOptions = dnd5e.rollOptions();
      PGT.restOptions = dnd5e.restOptions();
      PGT.onRollRequest = dnd5e.rollRequest;
      PGT.onRestRequest = dnd5e.restRequest;
      PGT.actorTypes = ["character"]
      break;

    case "pf2e": 
      PGT.rollOptions = pf2e.rollOptions();
      PGT.restOptions = pf2e.restOptions();
      PGT.onRollRequest = pf2e.rollRequest;
      PGT.onRestRequest = pf2e.restRequest;
      PGT.actorTypes = ["character"]
      break;
  }


});

Hooks.on("getSceneControlButtons", (controls) => {
  controls.pazindorGmTools = {
    name: "pazindorGmTools",
    title: "PGMT.title",
    layer: null,
    icon: "fas fa-screwdriver-wrench",
    visible: game.user.isGM,
    activeTool: "hiddenTool",
    tools: {
      request: {
        name: "request",
        title: "PGMT.roll",
        icon: "fas fa-dice",
        button: true,
        onChange: () => openRollRequest()
      },
      rest: {
        name: "rest",
        title: "PGMT.rest",
        icon: "fas fa-bed",
        button: true,
        onChange: () => openRestRequest()
      },
      gmScreen: {
        name: "gmScreen",
        title: "PGMT.gmScreen",
        icon: "fas fa-screencast",
        button: true,
        onChange: () => console.log("GM_SCREEN")
      },
      hiddenTool: {
        name: "hiddenTool",
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