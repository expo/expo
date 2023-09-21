var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = useOnAction;
var React = _interopRequireWildcard(require("react"));
var _NavigationBuilderContext = _interopRequireDefault(require("./NavigationBuilderContext"));
var _useOnPreventRemove = _interopRequireWildcard(require("./useOnPreventRemove"));
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
function useOnAction(_ref) {
  var router = _ref.router,
    getState = _ref.getState,
    setState = _ref.setState,
    key = _ref.key,
    actionListeners = _ref.actionListeners,
    beforeRemoveListeners = _ref.beforeRemoveListeners,
    routerConfigOptions = _ref.routerConfigOptions,
    emitter = _ref.emitter;
  var _React$useContext = React.useContext(_NavigationBuilderContext.default),
    onActionParent = _React$useContext.onAction,
    onRouteFocusParent = _React$useContext.onRouteFocus,
    addListenerParent = _React$useContext.addListener,
    onDispatchAction = _React$useContext.onDispatchAction;
  var routerConfigOptionsRef = React.useRef(routerConfigOptions);
  React.useEffect(function () {
    routerConfigOptionsRef.current = routerConfigOptions;
  });
  var onAction = React.useCallback(function (action) {
    var visitedNavigators = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : new Set();
    var state = getState();
    if (visitedNavigators.has(state.key)) {
      return false;
    }
    visitedNavigators.add(state.key);
    if (typeof action.target !== 'string' || action.target === state.key) {
      var result = router.getStateForAction(state, action, routerConfigOptionsRef.current);
      result = result === null && action.target === state.key ? state : result;
      if (result !== null) {
        onDispatchAction(action, state === result);
        if (state !== result) {
          var isPrevented = (0, _useOnPreventRemove.shouldPreventRemove)(emitter, beforeRemoveListeners, state.routes, result.routes, action);
          if (isPrevented) {
            return true;
          }
          setState(result);
        }
        if (onRouteFocusParent !== undefined) {
          var shouldFocus = router.shouldActionChangeFocus(action);
          if (shouldFocus && key !== undefined) {
            onRouteFocusParent(key);
          }
        }
        return true;
      }
    }
    if (onActionParent !== undefined) {
      if (onActionParent(action, visitedNavigators)) {
        return true;
      }
    }
    for (var i = actionListeners.length - 1; i >= 0; i--) {
      var listener = actionListeners[i];
      if (listener(action, visitedNavigators)) {
        return true;
      }
    }
    return false;
  }, [actionListeners, beforeRemoveListeners, emitter, getState, key, onActionParent, onDispatchAction, onRouteFocusParent, router, setState]);
  (0, _useOnPreventRemove.default)({
    getState: getState,
    emitter: emitter,
    beforeRemoveListeners: beforeRemoveListeners
  });
  React.useEffect(function () {
    return addListenerParent == null ? void 0 : addListenerParent('action', onAction);
  }, [addListenerParent, onAction]);
  return onAction;
}