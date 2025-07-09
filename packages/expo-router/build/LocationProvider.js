"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRouteInfoFromState = getRouteInfoFromState;
exports.getNormalizedStatePath = getNormalizedStatePath;
const getStateFromPath_forks_1 = require("./fork/getStateFromPath-forks");
function getRouteInfoFromState(getPathFromState, state, baseUrl) {
    const { path } = getPathFromState(state, false);
    const qualified = getPathFromState(state, true);
    return {
        // TODO: This may have a predefined origin attached in the future.
        unstable_globalHref: path,
        pathname: (0, getStateFromPath_forks_1.stripBaseUrl)(path, baseUrl).split('?')['0'],
        isIndex: isIndexPath(state),
        ...getNormalizedStatePath(qualified, baseUrl),
    };
}
function isIndexPath(state) {
    const route = state.routes[state.index ?? state.routes.length - 1];
    if (route.state) {
        return isIndexPath(route.state);
    }
    // Index routes on the same level as a layout do not have `index` in their name
    if (route.params && 'screen' in route.params) {
        return route.params.screen === 'index';
    }
    // The `params` key will not exist if there are no params
    // So we need to do a positive lookahead to check if the route ends with /index
    // Nested routes that are hoisted will have a name ending with /index
    // e.g name could be /user/[id]/index
    if (route.name.match(/.+\/index$/))
        return true;
    // The state will either have params (because there are multiple _layout) or it will be hoisted with a name
    // If we don't match the above cases, then it's not an index route
    return false;
}
// TODO: Split up getPathFromState to return all this info at once.
function getNormalizedStatePath({ path: statePath, params, }, baseUrl) {
    const [pathname] = statePath.split('?');
    return {
        // Strip empty path at the start
        segments: (0, getStateFromPath_forks_1.stripBaseUrl)(pathname, baseUrl).split('/').filter(Boolean).map(decodeURIComponent),
        // TODO: This is not efficient, we should generate based on the state instead
        // of converting to string then back to object
        params: decodeParams(params),
    };
}
function decodeParams(params) {
    const parsed = {};
    for (const [key, value] of Object.entries(params)) {
        try {
            if (key === 'params' && typeof value === 'object') {
                parsed[key] = decodeParams(value);
            }
            else if (Array.isArray(value)) {
                parsed[key] = value.map((v) => decodeURIComponent(v));
            }
            else {
                parsed[key] = decodeURIComponent(value);
            }
        }
        catch {
            parsed[key] = value;
        }
    }
    return parsed;
}
//# sourceMappingURL=LocationProvider.js.map