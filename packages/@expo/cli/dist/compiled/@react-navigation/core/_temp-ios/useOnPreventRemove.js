var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = useOnPreventRemove;
exports.shouldPreventRemove = void 0;
var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));
var React = _interopRequireWildcard(require("react"));
var _NavigationBuilderContext = _interopRequireDefault(require("./NavigationBuilderContext"));
var _NavigationRouteContext = _interopRequireDefault(require("./NavigationRouteContext"));
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
var VISITED_ROUTE_KEYS = Symbol('VISITED_ROUTE_KEYS');
var shouldPreventRemove = function shouldPreventRemove(emitter, beforeRemoveListeners, currentRoutes, nextRoutes, action) {
  var _action$VISITED_ROUTE;
  var nextRouteKeys = nextRoutes.map(function (route) {
    return route.key;
  });
  var removedRoutes = currentRoutes.filter(function (route) {
    return !nextRouteKeys.includes(route.key);
  }).reverse();
  var visitedRouteKeys = (_action$VISITED_ROUTE = action[VISITED_ROUTE_KEYS]) != null ? _action$VISITED_ROUTE : new Set();
  var beforeRemoveAction = Object.assign({}, action, (0, _defineProperty2.default)({}, VISITED_ROUTE_KEYS, visitedRouteKeys));
  for (var route of removedRoutes) {
    var _beforeRemoveListener;
    if (visitedRouteKeys.has(route.key)) {
      continue;
    }
    var isPrevented = (_beforeRemoveListener = beforeRemoveListeners[route.key]) == null ? void 0 : _beforeRemoveListener.call(beforeRemoveListeners, beforeRemoveAction);
    if (isPrevented) {
      return true;
    }
    visitedRouteKeys.add(route.key);
    var event = emitter.emit({
      type: 'beforeRemove',
      target: route.key,
      data: {
        action: beforeRemoveAction
      },
      canPreventDefault: true
    });
    if (event.defaultPrevented) {
      return true;
    }
  }
  return false;
};
exports.shouldPreventRemove = shouldPreventRemove;
function useOnPreventRemove(_ref) {
  var getState = _ref.getState,
    emitter = _ref.emitter,
    beforeRemoveListeners = _ref.beforeRemoveListeners;
  var _React$useContext = React.useContext(_NavigationBuilderContext.default),
    addKeyedListener = _React$useContext.addKeyedListener;
  var route = React.useContext(_NavigationRouteContext.default);
  var routeKey = route == null ? void 0 : route.key;
  React.useEffect(function () {
    if (routeKey) {
      return addKeyedListener == null ? void 0 : addKeyedListener('beforeRemove', routeKey, function (action) {
        var state = getState();
        return shouldPreventRemove(emitter, beforeRemoveListeners, state.routes, [], action);
      });
    }
  }, [addKeyedListener, beforeRemoveListeners, emitter, getState, routeKey]);
}