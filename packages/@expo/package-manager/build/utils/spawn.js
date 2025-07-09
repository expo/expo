"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPendingSpawnAsync = createPendingSpawnAsync;
function createPendingSpawnAsync(actionAsync, spawnAsync) {
    // Manually rsolve the child promise whenever the prepending async action is resolved.
    // Avoid `childReject` to prevent "unhandled promise rejection" for one of the two promises.
    let childResolve;
    const child = new Promise((resolve, reject) => {
        childResolve = resolve;
    });
    const pendingPromise = new Promise((spawnResolve, spawnReject) => {
        actionAsync()
            .then((result) => {
            const spawnPromise = spawnAsync(result);
            childResolve(spawnPromise.child);
            spawnPromise.then(spawnResolve).catch(spawnReject);
        })
            .catch((error) => {
            childResolve(null);
            spawnReject(error);
        });
    });
    pendingPromise.child = child;
    return pendingPromise;
}
//# sourceMappingURL=spawn.js.map