"use strict";
// Forked so we can access without importing any React Native code in Node.js environments.
Object.defineProperty(exports, "__esModule", { value: true });
exports.findFocusedRoute = findFocusedRoute;
function findFocusedRoute(state) {
    let current = state;
    while (current?.routes[current.index ?? 0].state != null) {
        current = current.routes[current.index ?? 0].state;
    }
    const route = current?.routes[current?.index ?? 0];
    return route;
}
//# sourceMappingURL=findFocusedRoute.js.map