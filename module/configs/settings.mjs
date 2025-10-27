export function registerModuleSettings() {
  game.settings.register("pgt", "adventurersGroups", {
    scope: "user",
    config: false,
    default: [],
    type: Array
  });

  game.settings.register("pgt", "mainAdventurersGroup", {
    scope: "user",
    config: false,
    default: "",
    type: String
  });
}