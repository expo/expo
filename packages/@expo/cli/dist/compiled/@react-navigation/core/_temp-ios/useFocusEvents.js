var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = useFocusEvents;
var React = _interopRequireWildcard(require("react"));
var _NavigationContext = _interopRequireDefault(require("./NavigationContext"));
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
function useFocusEvents(_ref) {
  var state = _ref.state,
    emitter = _ref.emitter;
  var navigation = React.useContext(_NavigationContext.default);
  var lastFocusedKeyRef = React.useRef();
  var currentFocusedKey = state.routes[state.index].key;
  React.useEffect(function () {
    return navigation == null ? void 0 : navigation.addListener('focus', function () {
      lastFocusedKeyRef.current = currentFocusedKey;
      emitter.emit({
        type: 'focus',
        target: currentFocusedKey
      });
    });
  }, [currentFocusedKey, emitter, navigation]);
  React.useEffect(function () {
    return navigation == null ? void 0 : navigation.addListener('blur', function () {
      lastFocusedKeyRef.current = undefined;
      emitter.emit({
        type: 'blur',
        target: currentFocusedKey
      });
    });
  }, [currentFocusedKey, emitter, navigation]);
  React.useEffect(function () {
    var lastFocusedKey = lastFocusedKeyRef.current;
    lastFocusedKeyRef.current = currentFocusedKey;
    if (lastFocusedKey === undefined && !navigation) {
      emitter.emit({
        type: 'focus',
        target: currentFocusedKey
      });
    }
    if (lastFocusedKey === currentFocusedKey || !(navigation ? navigation.isFocused() : true)) {
      return;
    }
    if (lastFocusedKey === undefined) {
      return;
    }
    emitter.emit({
      type: 'blur',
      target: lastFocusedKey
    });
    emitter.emit({
      type: 'focus',
      target: currentFocusedKey
    });
  }, [currentFocusedKey, emitter, navigation]);
}