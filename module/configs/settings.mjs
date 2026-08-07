export function registerModuleSettings() {
  game.settings.register("pazindor-gm-tools", "adventurersGroups", {
    scope: "user",
    config: false,
    default: [],
    type: Array
  });

  game.settings.register("pazindor-gm-tools", "mainAdventurersGroup", {
    scope: "user",
    config: false,
    default: "",
    type: String
  });

  game.settings.register("pazindor-gm-tools", "gmScreenTabs", {
    scope: "user",
    config: false,
    default: [{
      name: "Main",
      type: "basic",
      gridColumns: 3,
      cells: [
        {id: "main-1", x: 1, y: 1, width: 1, height: 1, uuid: ""},
        {id: "main-2", x: 2, y: 1, width: 1, height: 1, uuid: ""},
        {id: "main-3", x: 3, y: 1, width: 1, height: 1, uuid: ""},
        {id: "main-4", x: 1, y: 2, width: 1, height: 1, uuid: ""},
        {id: "main-5", x: 2, y: 2, width: 1, height: 1, uuid: ""},
        {id: "main-6", x: 3, y: 2, width: 1, height: 1, uuid: ""}
      ]
    }],
    type: Array
  });

  game.settings.register("pazindor-gm-tools", "gmScreenMigrationVersion", {
    scope: "user",
    config: false,
    default: 0,
    type: Number
  });

  game.settings.register("pazindor-gm-tools", "progressTracker", {
    scope: "world",
    config: false,
    default: {
      trackers: {}
    },
    type: Object
  });
}
