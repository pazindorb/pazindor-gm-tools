const MODULE_ID = "pazindor-gm-tools";
const MIGRATION_VERSION = 1;

export async function migrateGmScreenTabs() {
  const currentVersion = game.settings.get(MODULE_ID, "gmScreenMigrationVersion");
  if (currentVersion >= MIGRATION_VERSION) return;

  const sourceTabs = game.settings.get(MODULE_ID, "gmScreenTabs");
  const tabs = (sourceTabs ?? [])
    .filter(tab => tab.type === "basic")
    .map(tab => migrateTab(tab));

  if (!tabs.length) tabs.push(createBasicTab("Main"));

  await game.settings.set(MODULE_ID, "gmScreenTabs", tabs);
  await game.settings.set(MODULE_ID, "gmScreenMigrationVersion", MIGRATION_VERSION);
}

function migrateTab(sourceTab) {
  const tab = foundry.utils.deepClone(sourceTab);
  let cells = Array.isArray(tab.cells) ? tab.cells : migrateGrid(tab.grid, tab.gridUnits);
  if (tab.gridColumns !== 3) cells = migrateCellsToThreeColumns(cells);

  return {
    name: tab.name,
    type: "basic",
    gridColumns: 3,
    cells
  };
}

function migrateGrid(sourceGrid, gridUnits = 3) {
  if (!sourceGrid) return createDefaultCells();

  const multiplier = gridUnits === 6 ? 1 : 2;
  const grid = Object.values(sourceGrid);
  const cells = [];
  let counter = 0;

  for (const column of grid) {
    const width = column.width1 * multiplier;
    if (counter < 6) cells.push(createCell(counter + 1, 1, width, column.height, column.row1));
    counter += width;
  }

  counter = 0;
  for (const column of grid) {
    const width = (column.height === 2 ? column.width1 : column.width2) * multiplier;
    if (counter < 6 && column.height === 1) cells.push(createCell(counter + 1, 2, width, 1, column.row2));
    counter += width;
  }

  return cells;
}

function migrateCellsToThreeColumns(cells) {
  const aligned = cells.every(cell => (cell.x - 1) % 2 === 0 && cell.width % 2 === 0);
  if (aligned) return cells.map(cell => scaleCellToThreeColumns(cell));

  const documents = cells
    .filter(cell => cell.uuid)
    .sort((a, b) => a.y - b.y || a.x - b.x)
    .map(cell => cell.uuid);
  const migrated = createDefaultCells();
  for (const [index, uuid] of documents.slice(0, migrated.length).entries()) migrated[index].uuid = uuid;
  if (documents.length > migrated.length) {
    console.warn("[Pazindor GM Tools] Some documents could not fit while migrating the GM Screen to a 3x2 grid.");
  }
  return migrated;
}

function scaleCellToThreeColumns(cell) {
  const scaled = {
    ...foundry.utils.deepClone(cell),
    x: ((cell.x - 1) / 2) + 1,
    width: cell.width / 2
  };
  if (scaled.children?.length) {
    const aligned = scaled.children.every(child => (child.x - 1) % 2 === 0 && child.width % 2 === 0);
    if (aligned) scaled.children = scaled.children.map(child => scaleCellToThreeColumns(child));
    else delete scaled.children;
  }
  return scaled;
}

function createBasicTab(name) {
  return {
    name: name,
    type: "basic",
    gridColumns: 3,
    cells: createDefaultCells()
  };
}

function createDefaultCells() {
  return [
    createCell(1, 1), createCell(2, 1), createCell(3, 1),
    createCell(1, 2), createCell(2, 2), createCell(3, 2)
  ];
}

function createCell(x, y, width = 1, height = 1, uuid = "") {
  return {id: foundry.utils.randomID(), x, y, width, height, uuid};
}
