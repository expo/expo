Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = getFocusedRouteNameFromRoute;
var _useRouteCache = require("./useRouteCache");
function getFocusedRouteNameFromRoute(route) {
  var _route$CHILD_STATE, _state$index;
  var state = (_route$CHILD_STATE = route[_useRouteCache.CHILD_STATE]) != null ? _route$CHILD_STATE : route.state;
  var params = route.params;
  var routeName = state ? state.routes[(_state$index = state.index) != null ? _state$index : typeof state.type === 'string' && state.type !== 'stack' ? 0 : state.routes.length - 1].name : typeof (params == null ? void 0 : params.screen) === 'string' ? params.screen : undefined;
  return routeName;
}