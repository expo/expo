var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _View = _interopRequireDefault(require("../../Components/View/View"));
var _StyleSheet = _interopRequireDefault(require("../../StyleSheet/StyleSheet"));
var _Text = _interopRequireDefault(require("../../Text/Text"));
var LogBoxStyle = _interopRequireWildcard(require("./LogBoxStyle"));
var React = _interopRequireWildcard(require("react"));
var _jsxRuntime = require("react/jsx-runtime");
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
function LogBoxInspectorSection(props) {
  return (0, _jsxRuntime.jsxs)(_View.default, {
    style: styles.section,
    children: [(0, _jsxRuntime.jsxs)(_View.default, {
      style: styles.heading,
      children: [(0, _jsxRuntime.jsx)(_Text.default, {
        style: styles.headingText,
        children: props.heading
      }), props.action]
    }), (0, _jsxRuntime.jsx)(_View.default, {
      style: styles.body,
      children: props.children
    })]
  });
}
var styles = _StyleSheet.default.create({
  section: {
    marginTop: 15
  },
  heading: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: 12,
    marginBottom: 10
  },
  headingText: {
    color: LogBoxStyle.getTextColor(1),
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    includeFontPadding: false,
    lineHeight: 20
  },
  body: {
    paddingBottom: 10
  }
});
var _default = LogBoxInspectorSection;
exports.default = _default;