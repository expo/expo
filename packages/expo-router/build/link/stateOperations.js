"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEarliestMismatchedRoute = exports.getQualifiedStateForTopOfTargetState = exports.isMovingToSiblingRoute = exports.findTopRouteForTarget = void 0;
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
/** Return the absolute last route to move to. */
function findTopRouteForTarget(state) {
    const nextState = findTopStateForTarget(state);
    // Ensure we get the last route to prevent returning the initial route.
    return nextState.routes?.[nextState.routes.length - 1];
}
exports.findTopRouteForTarget = findTopRouteForTarget;
/** @returns true if moving to a sibling inside the same navigator. */
function isMovingToSiblingRoute(currentState, targetState) {
    if (!currentState || !targetState) {
        return false;
    }
    // Need to type this, as the current types are not compaitble with the `find`
    const targetRoute = targetState.routes[0];
    // Make sure we're in the same navigator
    if (!currentState.routeNames?.includes(targetRoute.name)) {
        return false;
    }
    // If there's no state, we're at the end of the path
    if (!targetRoute.state) {
        return true;
    }
    // Coerce the types into a more common form
    const currentRoutes = currentState?.routes;
    const locatedState = currentRoutes?.find((r) => r.name === targetRoute.name);
    if (!locatedState) {
        return false;
    }
    return isMovingToSiblingRoute(locatedState.state, targetRoute.state);
}
exports.isMovingToSiblingRoute = isMovingToSiblingRoute;
// Given the root state and a target state from `getStateFromPath`,
// return the root state containing the highest target route matching the root state.
// This can be used to determine what type of navigator action should be used.
function getQualifiedStateForTopOfTargetState(rootState, targetState) {
    let current = targetState;
    let currentRoot = rootState;
    while (current?.routes?.[current?.routes?.length - 1].state != null) {
        const nextRoute = current?.routes?.[current?.routes?.length - 1];
        const nextCurrentRoot = currentRoot?.routes?.find((route) => route.name === nextRoute.name)?.state;
        if (nextCurrentRoot == null) {
            return currentRoot;
            // Not sure what to do -- we're tracking against the assumption that
            // all routes in the target state are in the root state
            // currentRoot = undefined;
        }
        else {
            currentRoot = nextCurrentRoot;
        }
        current = nextRoute.state;
    }
    return currentRoot;
}
exports.getQualifiedStateForTopOfTargetState = getQualifiedStateForTopOfTargetState;
// Given the root state and a target state from `getStateFromPath`,
// return the root state containing the highest target route matching the root state.
// This can be used to determine what type of navigator action should be used.
function getEarliestMismatchedRoute(rootState, actionParams) {
    const actionName = actionParams.name ?? actionParams.screen;
    if (!rootState?.routes || rootState.index == null) {
        // This should never happen where there's more action than state.
        return {
            name: actionName,
            type: 'stack',
        };
    }
    const nextCurrentRoot = rootState.routes[rootState.index];
    if (actionName === nextCurrentRoot.name) {
        if (!actionParams.params) {
            // All routes match all the way up, no change required.
            return null;
        }
        return getEarliestMismatchedRoute(
        // @react-navigation/native types this as NavigationState | Partial<NavigationState> | undefined
        // In our usage, it's always a NavigationState | undefined
        nextCurrentRoot.state, actionParams.params);
    }
    // There's a selected state but it doesn't match the action state
    // this is now the lowest point of change.
    return {
        name: actionName,
        params: actionParams.params,
        type: rootState.type,
    };
}
exports.getEarliestMismatchedRoute = getEarliestMismatchedRoute;
//# sourceMappingURL=stateOperations.js.map