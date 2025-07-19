export function registerModuleSocket() {
  game.socket.on("module.pazindor-gm-tools", async (data) => {
    const { actorId, selected } = data.payload;
    const actor = game.actors.get(actorId);
    if (!actor.isOwner) return;

    switch (data.type) {
      case "ROLL_REQUEST":
        PGT.onRollRequest(actor, selected);
        break;

      case "REST_REQUEST":
        PGT.onRestRequest(actor, selected);
        break;
    }
  });
}

export function emitEvent(type, payload) {
  game.socket.emit('module.pazindor-gm-tools', {
    type: type,
    payload: payload
  });
}