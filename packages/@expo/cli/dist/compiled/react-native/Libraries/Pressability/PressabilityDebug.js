var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.PressabilityDebugView = PressabilityDebugView;
exports.isEnabled = isEnabled;
exports.setEnabled = setEnabled;
var _View = _interopRequireDefault(require("../Components/View/View"));
var _normalizeColor = _interopRequireDefault(require("../StyleSheet/normalizeColor"));
var _Rect = require("../StyleSheet/Rect");
var React = _interopRequireWildcard(require("react"));
var _jsxRuntime = require("react/jsx-runtime");
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
function PressabilityDebugView(props) {
  if (__DEV__) {
    if (isEnabled()) {
      var _hitSlop$bottom, _hitSlop$left, _hitSlop$right, _hitSlop$top;
      var normalizedColor = (0, _normalizeColor.default)(props.color);
      if (typeof normalizedColor !== 'number') {
        return null;
      }
      var baseColor = '#' + (normalizedColor != null ? normalizedColor : 0).toString(16).padStart(8, '0');
      var hitSlop = (0, _Rect.normalizeRect)(props.hitSlop);
      return (0, _jsxRuntime.jsx)(_View.default, {
        pointerEvents: "none",
        style: {
          backgroundColor: baseColor.slice(0, -2) + '0F',
          borderColor: baseColor.slice(0, -2) + '55',
          borderStyle: 'dashed',
          borderWidth: 1,
          bottom: -((_hitSlop$bottom = hitSlop == null ? void 0 : hitSlop.bottom) != null ? _hitSlop$bottom : 0),
          left: -((_hitSlop$left = hitSlop == null ? void 0 : hitSlop.left) != null ? _hitSlop$left : 0),
          position: 'absolute',
          right: -((_hitSlop$right = hitSlop == null ? void 0 : hitSlop.right) != null ? _hitSlop$right : 0),
          top: -((_hitSlop$top = hitSlop == null ? void 0 : hitSlop.top) != null ? _hitSlop$top : 0)
        }
      });
    }
  }
  return null;
}
var isDebugEnabled = false;
function isEnabled() {
  if (__DEV__) {
    return isDebugEnabled;
  }
  return false;
}
function setEnabled(value) {
  if (__DEV__) {
    isDebugEnabled = value;
  }
}
//# sourceMappingURL=PressabilityDebug.js.map