import { openRestRequest, openRollRequest } from "./dialog/request-dialog.mjs";
import { registerModuleSocket } from "./socket.mjs";
import { dnd5eRestOptions, dnd5eRestRequest, dnd5eRollOptions, dnd5eRollRequest } from "./systems/dnd5e.mjs";

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
      PGT.rollOptions = dnd5eRollOptions();
      PGT.restOptions = dnd5eRestOptions();
      PGT.onRollRequest = dnd5eRollRequest;
      PGT.onRestRequest = dnd5eRestRequest;
      PGT.actorTypes = ["character"]
      break;

    case "pf2": 

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