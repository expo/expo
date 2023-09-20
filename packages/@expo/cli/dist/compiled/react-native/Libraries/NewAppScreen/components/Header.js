var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _ImageBackground = _interopRequireDefault(require("../../Image/ImageBackground"));
var _StyleSheet = _interopRequireDefault(require("../../StyleSheet/StyleSheet"));
var _Text = _interopRequireDefault(require("../../Text/Text"));
var _useColorScheme = _interopRequireDefault(require("../../Utilities/useColorScheme"));
var _Colors = _interopRequireDefault(require("./Colors"));
var _HermesBadge = _interopRequireDefault(require("./HermesBadge"));
var _react = _interopRequireDefault(require("react"));
var _jsxRuntime = require("react/jsx-runtime");
var Header = function Header() {
  var isDarkMode = (0, _useColorScheme.default)() === 'dark';
  return (0, _jsxRuntime.jsxs)(_ImageBackground.default, {
    accessibilityRole: "image",
    testID: "new-app-screen-header",
    source: require("./logo.png"),
    style: [styles.background, {
      backgroundColor: isDarkMode ? _Colors.default.darker : _Colors.default.lighter
    }],
    imageStyle: styles.logo,
    children: [(0, _jsxRuntime.jsx)(_HermesBadge.default, {}), (0, _jsxRuntime.jsxs)(_Text.default, {
      style: [styles.text, {
        color: isDarkMode ? _Colors.default.white : _Colors.default.black
      }],
      children: ["Welcome to", '\n', "React Native"]
    })]
  });
};
var styles = _StyleSheet.default.create({
  background: {
    paddingBottom: 40,
    paddingTop: 96,
    paddingHorizontal: 32
  },
  logo: {
    opacity: 0.2,
    overflow: 'visible',
    resizeMode: 'cover',
    marginLeft: -128,
    marginBottom: -192
  },
  text: {
    fontSize: 40,
    fontWeight: '700',
    textAlign: 'center'
  }
});
var _default = Header;
exports.default = _default;
//# sourceMappingURL=Header.js.map