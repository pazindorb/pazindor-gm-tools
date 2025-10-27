import { getValueFromPath } from "../utils.mjs";

export function registerHandlebarsHelpers() {

  Handlebars.registerHelper('ifCond', function (v1, operator, v2, options) {
    switch (operator) {
      case '==':
        return (v1 == v2) ? options.fn(this) : options.inverse(this);
      case '===':
        return (v1 === v2) ? options.fn(this) : options.inverse(this);
      case '!=':
        return (v1 != v2) ? options.fn(this) : options.inverse(this);
      case '!==':
        return (v1 !== v2) ? options.fn(this) : options.inverse(this);
      case '<':
        return (v1 < v2) ? options.fn(this) : options.inverse(this);
      case '<=':
        return (v1 <= v2) ? options.fn(this) : options.inverse(this);
      case '>':
        return (v1 > v2) ? options.fn(this) : options.inverse(this);
      case '>=':
        return (v1 >= v2) ? options.fn(this) : options.inverse(this);
      case '&&':
        return (v1 && v2) ? options.fn(this) : options.inverse(this);
      case '||':
        return (v1 || v2) ? options.fn(this) : options.inverse(this);
      case '%':
        return (v1 % v2 === 0) ? options.fn(this) : options.inverse(this);
      default:
        return options.inverse(this);
    }
  });

  Handlebars.registerHelper('adventurers-table', (adventurers, tabConfig, activeGroup) => {
    let colgroup = "";

    // HEADER AND COLGROUP
    let header = "";
    if (tabConfig.direction === "row") {
      for (const field of tabConfig.fields) {
        header += `<th>${_headerField(field.label, field.icon , field.short, false)}</th>`;
        colgroup += _colgroup(field.type);
      }
    }
    else {
      // First row is for field label so we leave it empty
      header += `<th>${_headerField("", "", "", false)}</th>`; 
      colgroup += _colgroup("label");

      // In column direction we need to set column limit
      let colNo = 0; 
      for (const actor of adventurers) {
        if (colNo > 10) break;
        header += `<th>${_headerField(actor.name, actor.img, "", true)}</th>`;
        colgroup += _colgroup("value");
        colNo++;
      }
    }
    header = `<tr>${header}</tr>`;

    // ROWS
    let rows = "";
    if (tabConfig.direction === "row") {
      for (const actor of adventurers) {
        let row = "";
        for (const field of tabConfig.fields) {
          row += `<td>${_rowField(actor, field, activeGroup)}</td>`;
        }
        rows += `<tr class="large">${row}</tr>`;
      }
    }
    else {
      for (const field of tabConfig.fields) {
        let row = `<td><input class="label" type="text" value="${game.i18n.localize(field.label)}" readonly/> </td>`;
        
        // In column direction we need to set column limit
        let colNo = 0; 
        for (const actor of adventurers) {
          if (colNo > 8) break;
          row += `<td>${_rowField(actor, field)}</td>`;
          colNo++;
        }
        rows += `<tr>${row}</tr>`;
      }
    }

    // Full Table
    return `<table class="scrollable">
      <colgroup>${colgroup}</colgroup>
      <thead>${header}</thead>
      <tbody>${rows}</tbody>
    </table>`
  });
}

function _headerField(tooltip, icon, short, isImg) {
  if (isImg) return `<img src="${icon}" data-tooltip="${tooltip}">`;

  const iconContent = icon ? `<i class="${icon}" ${short ? "style='margin-right: 4px;'" : ""}></i>` : "";
  const shortContent = short ? `<span>${short}</span>` : "";
  return `<div class="header-field" data-tooltip="${game.i18n.localize(tooltip)}">${iconContent}${shortContent}</div>`;
}

function _rowField(actor, field, activeGroup) {
  switch (field.type) {
    case "name-icon": 
      return _nameIconField(actor, activeGroup);

    case "label": case "value":
      return _valueField(actor, field);  

    case "current-max":
      return _currentMax(actor, field);
  }
}

function _nameIconField(actor, activeGroup) {
  const removeFromGroup = `<a class="centered" data-action="removeFromGroup" data-actor-id="${actor.id}" data-tooltip="${game.i18n.localize("PGT.ADVENTURERS.REMOVE_FROM_GROUP")}"><i class="fa-solid fa-minus"></i></a>`;
  const addToGroup = `<a class="centered" data-action="addToGroup" data-actor-id="${actor.id}" data-tooltip="${game.i18n.localize("PGT.ADVENTURERS.ADD_TO_GROUP")}"><i class="fa-solid fa-plus"></i></a>`;

  return `<div class="actor-wrapper">
            ${activeGroup ? removeFromGroup : addToGroup}
            <div class="actor" data-action="sheet" data-actor-id="${actor.id}" data-tooltip='${game.i18n.localize("PGT.ADVENTURERS.OPEN_SHEET")}'>
              <img src="${actor.img}"/>
              <label>${actor.name}</label>
            </div>
          </div>`;        
}

function _valueField(actor, field) {
  const value = getValueFromPath(actor, field.path);
  if (value  == null) {
    return `<input type="text" value="?" data-tooltip='${game.i18n.localize("PGT.ADVENTURERS.VALUE_NOT_FOUND")}'/>`;
  }
  const rollableContent = field.rollKey ? `data-action=roll data-roll-key=${field.rollKey} data-actor-id="${actor.id}" data-tooltip="${game.i18n.localize("PGT.ADVENTURERS.ROLL")}"` : "";
  const editableContent = field.editable ? `data-cType=${field.editable} data-actor-id=${actor.id} data-path="${field.path}"` : "readonly";

  if ('boolean' === typeof value) {
    return `<i class="${value ? 'fa-solid fa-check' : ''}" ${rollableContent}></i>`;
  }
  return `<input class="${field.type}" type="text" value="${value}" ${rollableContent}  ${editableContent}/>`;
}

function _currentMax(actor, field) {
  const current = getValueFromPath(actor, field.pathCurrent);
  const max = getValueFromPath(actor, field.pathMax);
  if (current == null || max == null) {
    return `<input type="text" value="?" data-tooltip='${game.i18n.localize("PGT.ADVENTURERS.VALUE_NOT_FOUND")}'/>`;
  }
  const editableContent = field.editable ? `data-cType=${field.editable} data-actor-id=${actor.id} data-path="${field.pathCurrent}"` : "readonly";

  return `<div class="centered">
            <input type="text" value="${current}" ${editableContent}/>
            <span>/</span>
            <input type="text" value="${max}" readonly/>
          </div>`;
}

function _colgroup(type) {
  switch (type) {
    case "value":
      return '<col style="width: 40px;">';

    case "current-max":
      return '<col style="width: 80px;">';

    case "label": case "name-icon":
      return '<col style="width: auto;">';
  }
}