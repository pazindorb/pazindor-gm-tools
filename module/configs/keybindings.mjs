import { openAdventurersRegister } from "../dialog/adventurers-register.mjs";
import { openConditionManager } from "../dialog/condition-manager.mjs";
import { gmScreen } from "../dialog/gm-screen.mjs";
import { openRestRequest, openRollRequest } from "../dialog/request-dialog.mjs";

export function registerKeybindings() {

  game.keybindings.register("pgt", "rollRequest", {
    name: "PGT.MENU.ROLL",
    editable: [{key: "KeyR", modifiers: ['Shift']}],
    onDown: () => {if (PGT.onRollRequest) openRollRequest()},
    precedence: CONST.KEYBINDING_PRECEDENCE.NORMAL,
  });

  game.keybindings.register("pgt", "restRequest", {
    name: "PGT.MENU.REST",
    editable: [{key: "KeyY", modifiers: ['Shift']}],
    onDown: () => {if (PGT.onRestRequest) openRestRequest()},
    precedence: CONST.KEYBINDING_PRECEDENCE.NORMAL,
  });

  game.keybindings.register("pgt", "condition", {
    name: "PGT.MENU.CONDITION",
    editable: [{key: "KeyH", modifiers: []}],
    onDown: () => {if (PGT.applyCondition) openConditionManager()},
    precedence: CONST.KEYBINDING_PRECEDENCE.NORMAL,
  });

  game.keybindings.register("pgt", "adventurers", {
    name: "PGT.MENU.ADVENTURERS",
    editable: [{key: "KeyJ", modifiers: []}],
    onDown: () => openAdventurersRegister(),
    precedence: CONST.KEYBINDING_PRECEDENCE.NORMAL,
  });

  game.keybindings.register("pgt", "gmScreen", {
    name: "PGT.MENU.GM_SCREEN",
    editable: [{key: "KeyG", modifiers: []}],
    onDown: () => gmScreen(),
    precedence: CONST.KEYBINDING_PRECEDENCE.NORMAL,
  });
}