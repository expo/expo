"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getNormalizedStatePath = getNormalizedStatePath;
exports.getRouteInfoFromState = getRouteInfoFromState;
function _getStateFromPath() {
  const data = require("./fork/getStateFromPath");
  _getStateFromPath = function () {
    return data;
  };
  return data;
}
function getRouteInfoFromState(getPathFromState, state, baseUrl) {
  const {
    path
  } = getPathFromState(state, false);
  const qualified = getPathFromState(state, true);
  return {
    // TODO: This may have a predefined origin attached in the future.
    unstable_globalHref: path,
    pathname: (0, _getStateFromPath().stripBaseUrl)(path, baseUrl).split('?')['0'],
    isIndex: isIndexPath(state),
    ...getNormalizedStatePath(qualified, baseUrl)
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
  if (route.name.match(/.+\/index$/)) return true;

  // The state will either have params (because there are multiple _layout) or it will be hoisted with a name
  // If we don't match the above cases, then it's not an index route

  return false;
}

// TODO: Split up getPathFromState to return all this info at once.
function getNormalizedStatePath({
  path: statePath,
  params
}, baseUrl) {
  const [pathname] = statePath.split('?');
  return {
    // Strip empty path at the start
    segments: (0, _getStateFromPath().stripBaseUrl)(pathname, baseUrl).split('/').filter(Boolean).map(decodeURIComponent),
    // TODO: This is not efficient, we should generate based on the state instead
    // of converting to string then back to object
    params: Object.entries(params).reduce((prev, [key, value]) => {
      if (Array.isArray(value)) {
        prev[key] = value.map(v => {
          try {
            return decodeURIComponent(v);
          } catch {
            return v;
          }
        });
      } else {
        try {
          prev[key] = decodeURIComponent(value);
        } catch {
          prev[key] = value;
        }
      }
      return prev;
    }, {})
  };
}
//# sourceMappingURL=LocationProvider.js.map