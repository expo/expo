var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _StyleSheet = _interopRequireDefault(require("../../StyleSheet/StyleSheet"));
var _Text = _interopRequireDefault(require("../../Text/Text"));
var _Platform = _interopRequireDefault(require("../../Utilities/Platform"));
var _react = _interopRequireDefault(require("react"));
var _jsxRuntime = require("react/jsx-runtime");
var styles = _StyleSheet.default.create({
  highlight: {
    fontWeight: '700'
  }
});
var DebugInstructions = _Platform.default.select({
  ios: function ios() {
    return (0, _jsxRuntime.jsxs)(_Text.default, {
      children: ["Press ", (0, _jsxRuntime.jsx)(_Text.default, {
        style: styles.highlight,
        children: "Cmd + D"
      }), " in the simulator or", ' ', (0, _jsxRuntime.jsx)(_Text.default, {
        style: styles.highlight,
        children: "Shake"
      }), " your device to open the React Native debug menu."]
    });
  },
  default: function _default() {
    return (0, _jsxRuntime.jsxs)(_Text.default, {
      children: ["Press ", (0, _jsxRuntime.jsx)(_Text.default, {
        style: styles.highlight,
        children: "Cmd or Ctrl + M"
      }), " or", ' ', (0, _jsxRuntime.jsx)(_Text.default, {
        style: styles.highlight,
        children: "Shake"
      }), " your device to open the React Native debug menu."]
    });
  }
});
var _default2 = DebugInstructions;
exports.default = _default2;
//# sourceMappingURL=DebugInstructions.js.map