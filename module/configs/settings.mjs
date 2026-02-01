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
      name: "Main Actors",
      type: "actor",
      records: []
    },
    {
      name: "Main",
      type: "basic",
      grid: {
        col1: {
          row1: "",
          row2: "",
          width1: 1,
          width2: 1,
          height: 1,
        },
        col2: {
          row1: "",
          row2: "",
          width1: 1,
          width2: 1,
          height: 1,
        },
        col3: {
          row1: "",
          row2: "",
          width1: 1,
          width2: 1,
          height: 1,
        }
      }
    }],
    type: Array
  });
}