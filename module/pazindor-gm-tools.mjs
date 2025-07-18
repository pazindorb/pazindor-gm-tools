import { openRestRequest, openRollRequest } from "./request-dialog.mjs";

Hooks.once("init", async function() {
  window.PGT = {
    rollOptions: {placeholder: "No system detected", X: "NoXcted"},
    restOptions: {placeholder: "No system detected"},
    onRestRequest: (actors, selected) => {console.log("Pazindor's GM Tools[Roll Request]: NO SYSTEM DETECTED")},
    onRestRequest: (actors, selected) => {console.log("Pazindor's GM Tools[Rest Request]: NO SYSTEM DETECTED")}
  }
})

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