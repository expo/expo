"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNormalizedStatePath = exports.getRouteInfoFromState = void 0;
const getStateFromPath_1 = require("./fork/getStateFromPath");
function getRouteInfoFromState(getPathFromState, state, basePath) {
    const { path } = getPathFromState(state, false);
    const qualified = getPathFromState(state, true);
    return {
        // TODO: This may have a predefined origin attached in the future.
        unstable_globalHref: path,
        isIndex: isIndexPath(state),
        pathname: (0, getStateFromPath_1.stripBasePath)(path, basePath).split('?')['0'],
        ...getNormalizedStatePath(qualified, basePath),
    };
}
exports.getRouteInfoFromState = getRouteInfoFromState;
function isIndexPath(state) {
    const route = state.routes[state.index ?? state.routes.length - 1];
    if (route.state) {
        return isIndexPath(route.state);
    }
    // router.params is typed as 'object', so this usual syntax is to please TypeScript
    if (route.params && 'screen' in route.params) {
        return route.params.screen === 'index';
    }
    return false;
}
// TODO: Split up getPathFromState to return all this info at once.
function getNormalizedStatePath({ path: statePath, params, }, basePath) {
    const [pathname] = statePath.split('?');
    return {
        // Strip empty path at the start
        segments: (0, getStateFromPath_1.stripBasePath)(pathname, basePath).split('/').filter(Boolean).map(decodeURIComponent),
        // TODO: This is not efficient, we should generate based on the state instead
        // of converting to string then back to object
        params: Object.entries(params).reduce((prev, [key, value]) => {
            if (Array.isArray(value)) {
                prev[key] = value.map(decodeURIComponent);
            }
            else {
                prev[key] = decodeURIComponent(value);
            }
            return prev;
        }, {}),
    };
}
exports.getNormalizedStatePath = getNormalizedStatePath;
//# sourceMappingURL=LocationProvider.js.map