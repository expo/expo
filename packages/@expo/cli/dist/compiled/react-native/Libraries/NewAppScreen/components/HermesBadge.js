var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _View = _interopRequireDefault(require("../../Components/View/View"));
var _StyleSheet = _interopRequireDefault(require("../../StyleSheet/StyleSheet"));
var _Text = _interopRequireDefault(require("../../Text/Text"));
var _useColorScheme = _interopRequireDefault(require("../../Utilities/useColorScheme"));
var _Colors = _interopRequireDefault(require("./Colors"));
var _react = _interopRequireDefault(require("react"));
var _jsxRuntime = require("react/jsx-runtime");
var HermesBadge = function HermesBadge() {
  var _global$HermesInterna, _global$HermesInterna2;
  var isDarkMode = (0, _useColorScheme.default)() === 'dark';
  var version = (_global$HermesInterna = (_global$HermesInterna2 = global.HermesInternal) == null ? void 0 : _global$HermesInterna2.getRuntimeProperties == null ? void 0 : _global$HermesInterna2.getRuntimeProperties()['OSS Release Version']) != null ? _global$HermesInterna : '';
  return global.HermesInternal ? (0, _jsxRuntime.jsx)(_View.default, {
    style: styles.badge,
    children: (0, _jsxRuntime.jsx)(_Text.default, {
      style: [styles.badgeText, {
        color: isDarkMode ? _Colors.default.light : _Colors.default.dark
      }],
      children: `Engine: Hermes ${version}`
    })
  }) : null;
};
var styles = _StyleSheet.default.create({
  badge: {
    position: 'absolute',
    top: 8,
    right: 12
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right'
  }
});
var _default = HermesBadge;
exports.default = _default;