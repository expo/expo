"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNormalizedStatePath = exports.getRouteInfoFromState = void 0;
const getStateFromPath_1 = require("./fork/getStateFromPath");
function getRouteInfoFromState(getPathFromState, state, baseUrl) {
    const { path } = getPathFromState(state, false);
    const qualified = getPathFromState(state, true);
    return {
        // TODO: This may have a predefined origin attached in the future.
        unstable_globalHref: path,
        pathname: (0, getStateFromPath_1.stripBaseUrl)(path, baseUrl).split('?')['0'],
        ...getNormalizedStatePath(qualified, baseUrl),
    };
}
exports.getRouteInfoFromState = getRouteInfoFromState;
// TODO: Split up getPathFromState to return all this info at once.
function getNormalizedStatePath({ path: statePath, params, }, baseUrl) {
    const [pathname] = statePath.split('?');
    return {
        // Strip empty path at the start
        segments: (0, getStateFromPath_1.stripBaseUrl)(pathname, baseUrl).split('/').filter(Boolean).map(decodeURIComponent),
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