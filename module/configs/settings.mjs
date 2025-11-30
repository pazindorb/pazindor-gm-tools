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

  game.settings.register("pgt", "gmScreenTabs", {
    scope: "user",
    config: false,
    default: [{
      name: "Main Actors",
      type: "actor",
      records: []
    },
    {
      name: "Main Journals",
      type: "journal",
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