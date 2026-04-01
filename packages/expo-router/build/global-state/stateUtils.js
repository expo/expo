"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPayloadFromStateRoute = getPayloadFromStateRoute;
exports.findDivergentState = findDivergentState;
const matchers_1 = require("../matchers");
/**
 * React Navigation uses params to store information about the screens, rather then create new state for each level.
 * This function traverses the action state that will not be part of state and returns a payload that can be used in action.
 */
function getPayloadFromStateRoute(_actionStateRoute) {
    const rootPayload = { params: {} };
    let payload = rootPayload;
    let params = payload.params;
    let actionStateRoute = _actionStateRoute;
    while (actionStateRoute) {
        Object.assign(params, { ...payload.params, ...actionStateRoute.params });
        // Assign the screen name to the payload
        payload.screen = actionStateRoute.name;
        // Merge the params, ensuring that we create a new object
        payload.params = { ...params };
        // Params don't include the screen, thats a separate attribute
        delete payload.params['screen'];
        // Continue down the payload tree
        // Initially these values are separate, but React Nav merges them after the first layer
        payload = payload.params;
        params = payload;
        actionStateRoute = actionStateRoute.state?.routes[actionStateRoute.state?.routes.length - 1];
    }
    return rootPayload;
}
/**
 * Traverse the state tree comparing the current state and the action state until we find where they diverge.
 *
 * @returns An object with:
 *  - `actionState` — the remaining action state at the point of divergence
 *  - `navigationState` — the navigator that should be targeted for the dispatched action
 *  - `actionStateRoute` — the specific route in the action state where divergence was detected
 *  - `navigationRoutes` — navigation routes that matched before divergence (used for tab targeting)
 *
 * @private
 */
function findDivergentState(_actionState, _navigationState, 
// If true, look through all tabs to find the target state, rather then just the current tab
lookThroughAllTabs = false) {
    let actionState = _actionState;
    let navigationState = _navigationState;
    let actionStateRoute;
    const navigationRoutes = [];
    while (actionState && navigationState) {
        actionStateRoute = actionState.routes[actionState.routes.length - 1];
        const stateRoute = (() => {
            if (navigationState.type === 'tab' && lookThroughAllTabs) {
                return (navigationState.routes.find((route) => route.name === actionStateRoute?.name) ||
                    navigationState.routes[navigationState.index ?? 0]);
            }
            return navigationState.routes[navigationState.index ?? 0];
        })();
        const childState = actionStateRoute.state;
        const nextNavigationState = stateRoute.state;
        const dynamicName = (0, matchers_1.matchDynamicName)(actionStateRoute.name);
        const didActionAndCurrentStateDiverge = actionStateRoute.name !== stateRoute.name ||
            !childState ||
            !nextNavigationState ||
            (dynamicName &&
                // @ts-expect-error: TODO(@kitten): This isn't properly typed, so the index access fails
                actionStateRoute.params?.[dynamicName.name] !== stateRoute.params?.[dynamicName.name]);
        if (didActionAndCurrentStateDiverge) {
            // If we are looking through all tabs, we need to add new tab id if this is the last route
            // Otherwise we wouldn't be able to change the tab
            if (navigationState.type === 'tab' && lookThroughAllTabs) {
                navigationRoutes.push(stateRoute);
            }
            break;
        }
        navigationRoutes.push(stateRoute);
        actionState = childState;
        navigationState = nextNavigationState;
    }
    return {
        actionState,
        navigationState,
        actionStateRoute,
        navigationRoutes,
    };
}
//# sourceMappingURL=stateUtils.js.map