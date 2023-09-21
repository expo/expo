var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = useFocusedListenersChildrenAdapter;
var React = _interopRequireWildcard(require("react"));
var _NavigationBuilderContext = _interopRequireDefault(require("./NavigationBuilderContext"));
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
function useFocusedListenersChildrenAdapter(_ref) {
  var navigation = _ref.navigation,
    focusedListeners = _ref.focusedListeners;
  var _React$useContext = React.useContext(_NavigationBuilderContext.default),
    addListener = _React$useContext.addListener;
  var listener = React.useCallback(function (callback) {
    if (navigation.isFocused()) {
      for (var _listener of focusedListeners) {
        var _listener2 = _listener(callback),
          handled = _listener2.handled,
          result = _listener2.result;
        if (handled) {
          return {
            handled: handled,
            result: result
          };
        }
      }
      return {
        handled: true,
        result: callback(navigation)
      };
    } else {
      return {
        handled: false,
        result: null
      };
    }
  }, [focusedListeners, navigation]);
  React.useEffect(function () {
    return addListener == null ? void 0 : addListener('focus', listener);
  }, [addListener, listener]);
}