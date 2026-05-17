import { openProgressTracker } from "../dialog/progress-tracker.mjs";

export function registerModuleSocket() {
  game.socket.on("module.pazindor-gm-tools", async (data, emmiterId) => {
    const emitTypes = PGT.CONST.SOCKET.EMIT;
    switch (data.type) {
      case emitTypes.ROLL_REQUEST:
        handleRollRequest(data.payload, emmiterId);
        break;

      case emitTypes.REST_REQUEST:
        handleRestRequest(data.payload);
        break;

      case emitTypes.UPDATE_TRACKER:
        handleUpdateTracker();
        break;

      case emitTypes.OPEN_TRACKER:
        handleOpenTracker();
        break;
    }
  });
}

async function handleRollRequest(payload, emmiterId) {
  const { actorId, selected } = payload;
  const actor = game.actors.get(actorId);
  if (!actor.isOwner) return;

  let roll = await PGT.onRollRequest(actor, selected);
  if (!roll) roll = {};
  emitEvent(PGT.CONST.SOCKET.RESPONSE.ROLL_RESULT, {
    payload: {...roll},
    emmiterId: emmiterId,
    actorId: actor.id
  });
}

async function handleRestRequest(payload) {
  const { actorId, selected } = payload;
  const actor = game.actors.get(actorId);
  if (!actor.isOwner) return;

  PGT.onRestRequest(actor, selected);
}

function handleUpdateTracker() {
  if (!window.trackerWindow) return;
  window.trackerWindow.refresh();
}

function handleOpenTracker() {
  openProgressTracker(true);
}

//=======================================
//      EMIT AND WAIT FOR RESPONSE      =
//=======================================
export function emitEvent(type, payload) {
  game.socket.emit('module.pazindor-gm-tools', {
    type: type,
    payload: payload
  });
}

export async function responseListener(type, validationData={}) {
  return new Promise((resolve) => {
    game.socket.once('module.pazindor-gm-tools', (response) => {
      if (response.type !== type) {
        resolve(responseListener(type, validationData));
      }
      else if (!_validatePayload(response.payload, validationData)) {
        resolve(responseListener(type, validationData));
      }
      else {
        resolve(response.payload);
      }
    });
  });
}

function _validatePayload(response, validationData) {
  for (const [key, expectedValue] of Object.entries(validationData)) {
    if (response[key]) {
      if (response[key] !== expectedValue) return false;
    }
  }
  return true;
}
