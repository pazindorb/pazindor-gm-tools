export function registerModuleSocket() {
  game.socket.on("module.pazindor-gm-tools", async (data, emmiterId) => {
    const { actorId, selected } = data.payload;
    const actor = game.actors.get(actorId);
    if (!actor.isOwner) return;

    const emitTypes = PGT.CONST.SOCKET.EMIT;
    switch (data.type) {
      case emitTypes.ROLL_REQUEST:
        handleRollRequest(actor, selected, emmiterId);
        break;

      case emitTypes.REST_REQUEST:
        PGT.onRestRequest(actor, selected);
        break;
    }
  });
}

async function handleRollRequest(actor, selected, emmiterId) {
  let roll = await PGT.onRollRequest(actor, selected);
  if (!roll) roll = {};
  emitEvent(PGT.CONST.SOCKET.RESPONSE.ROLL_RESULT, {
    payload: {...roll},
    emmiterId: emmiterId,
    actorId: actor.id
  });
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