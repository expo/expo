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
var ReloadInstructions = _Platform.default.select({
  ios: function ios() {
    return (0, _jsxRuntime.jsxs)(_Text.default, {
      children: ["Press ", (0, _jsxRuntime.jsx)(_Text.default, {
        style: styles.highlight,
        children: "Cmd + R"
      }), " in the simulator to reload your app's code."]
    });
  },
  default: function _default() {
    return (0, _jsxRuntime.jsxs)(_Text.default, {
      children: ["Double tap ", (0, _jsxRuntime.jsx)(_Text.default, {
        style: styles.highlight,
        children: "R"
      }), " on your keyboard to reload your app's code."]
    });
  }
});
var _default2 = ReloadInstructions;
exports.default = _default2;