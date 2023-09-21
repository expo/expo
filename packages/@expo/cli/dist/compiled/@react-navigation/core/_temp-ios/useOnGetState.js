var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = useOnGetState;
var React = _interopRequireWildcard(require("react"));
var _isArrayEqual = _interopRequireDefault(require("./isArrayEqual"));
var _NavigationBuilderContext = _interopRequireDefault(require("./NavigationBuilderContext"));
var _NavigationRouteContext = _interopRequireDefault(require("./NavigationRouteContext"));
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
function useOnGetState(_ref) {
  var getState = _ref.getState,
    getStateListeners = _ref.getStateListeners;
  var _React$useContext = React.useContext(_NavigationBuilderContext.default),
    addKeyedListener = _React$useContext.addKeyedListener;
  var route = React.useContext(_NavigationRouteContext.default);
  var key = route ? route.key : 'root';
  var getRehydratedState = React.useCallback(function () {
    var state = getState();
    var routes = state.routes.map(function (route) {
      var _getStateListeners$ro;
      var childState = (_getStateListeners$ro = getStateListeners[route.key]) == null ? void 0 : _getStateListeners$ro.call(getStateListeners);
      if (route.state === childState) {
        return route;
      }
      return Object.assign({}, route, {
        state: childState
      });
    });
    if ((0, _isArrayEqual.default)(state.routes, routes)) {
      return state;
    }
    return Object.assign({}, state, {
      routes: routes
    });
  }, [getState, getStateListeners]);
  React.useEffect(function () {
    return addKeyedListener == null ? void 0 : addKeyedListener('getState', key, getRehydratedState);
  }, [addKeyedListener, getRehydratedState, key]);
}