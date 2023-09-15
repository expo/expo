"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Get the last state for a given target state (generated from a path).
function findTopStateForTarget(state) {
    let current = state;
    let previous = state;
    while (current?.routes?.[current?.routes?.length - 1].state != null) {
        previous = current;
        current = current?.routes[current?.routes.length - 1].state;
    }
    // If the last route in the target state is an index route, return the previous state (parent).
    // NOTE: This may need to be updated to support initial route name being a non-standard value.
    if (previous && current?.routes?.[current.routes.length - 1].name === 'index') {
        return previous;
    }
    return current;
}
//# sourceMappingURL=stateOperations.js.map