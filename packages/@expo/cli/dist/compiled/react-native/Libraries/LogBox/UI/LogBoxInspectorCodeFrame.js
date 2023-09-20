var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _ScrollView = _interopRequireDefault(require("../../Components/ScrollView/ScrollView"));
var _View = _interopRequireDefault(require("../../Components/View/View"));
var _openFileInEditor = _interopRequireDefault(require("../../Core/Devtools/openFileInEditor"));
var _StyleSheet = _interopRequireDefault(require("../../StyleSheet/StyleSheet"));
var _Text = _interopRequireDefault(require("../../Text/Text"));
var _Platform = _interopRequireDefault(require("../../Utilities/Platform"));
var LogBoxData = _interopRequireWildcard(require("../Data/LogBoxData"));
var _AnsiHighlight = _interopRequireDefault(require("./AnsiHighlight"));
var _LogBoxButton = _interopRequireDefault(require("./LogBoxButton"));
var _LogBoxInspectorSection = _interopRequireDefault(require("./LogBoxInspectorSection"));
var LogBoxStyle = _interopRequireWildcard(require("./LogBoxStyle"));
var React = _interopRequireWildcard(require("react"));
var _jsxRuntime = require("react/jsx-runtime");
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
function LogBoxInspectorCodeFrame(props) {
  var codeFrame = props.codeFrame;
  if (codeFrame == null) {
    return null;
  }
  function getFileName() {
    var matches = /[^/]*$/.exec(codeFrame.fileName);
    if (matches && matches.length > 0) {
      return matches[0];
    }
    return codeFrame.fileName;
  }
  function getLocation() {
    var location = codeFrame.location;
    if (location != null) {
      return ` (${location.row}:${location.column + 1})`;
    }
    return null;
  }
  return (0, _jsxRuntime.jsx)(_LogBoxInspectorSection.default, {
    heading: "Source",
    action: (0, _jsxRuntime.jsx)(AppInfo, {}),
    children: (0, _jsxRuntime.jsxs)(_View.default, {
      style: styles.box,
      children: [(0, _jsxRuntime.jsx)(_View.default, {
        style: styles.frame,
        children: (0, _jsxRuntime.jsx)(_ScrollView.default, {
          horizontal: true,
          children: (0, _jsxRuntime.jsx)(_AnsiHighlight.default, {
            style: styles.content,
            text: codeFrame.content
          })
        })
      }), (0, _jsxRuntime.jsx)(_LogBoxButton.default, {
        backgroundColor: {
          default: 'transparent',
          pressed: LogBoxStyle.getBackgroundDarkColor(1)
        },
        style: styles.button,
        onPress: function onPress() {
          var _codeFrame$location$r, _codeFrame$location;
          (0, _openFileInEditor.default)(codeFrame.fileName, (_codeFrame$location$r = (_codeFrame$location = codeFrame.location) == null ? void 0 : _codeFrame$location.row) != null ? _codeFrame$location$r : 0);
        },
        children: (0, _jsxRuntime.jsxs)(_Text.default, {
          style: styles.fileText,
          children: [getFileName(), getLocation()]
        })
      })]
    })
  });
}
function AppInfo() {
  var appInfo = LogBoxData.getAppInfo();
  if (appInfo == null) {
    return null;
  }
  return (0, _jsxRuntime.jsx)(_LogBoxButton.default, {
    backgroundColor: {
      default: 'transparent',
      pressed: appInfo.onPress ? LogBoxStyle.getBackgroundColor(1) : 'transparent'
    },
    style: appInfoStyles.buildButton,
    onPress: appInfo.onPress,
    children: (0, _jsxRuntime.jsxs)(_Text.default, {
      style: appInfoStyles.text,
      children: [appInfo.appVersion, " (", appInfo.engine, ")"]
    })
  });
}
var appInfoStyles = _StyleSheet.default.create({
  text: {
    color: LogBoxStyle.getTextColor(0.4),
    fontSize: 12,
    lineHeight: 12
  },
  buildButton: {
    flex: 0,
    flexGrow: 0,
    paddingVertical: 4,
    paddingHorizontal: 5,
    borderRadius: 5,
    marginRight: -8
  }
});
var styles = _StyleSheet.default.create({
  box: {
    backgroundColor: LogBoxStyle.getBackgroundColor(),
    marginLeft: 10,
    marginRight: 10,
    marginTop: 5,
    borderRadius: 3
  },
  frame: {
    padding: 10,
    borderBottomColor: LogBoxStyle.getTextColor(0.1),
    borderBottomWidth: 1
  },
  button: {
    paddingTop: 10,
    paddingBottom: 10
  },
  content: {
    color: LogBoxStyle.getTextColor(1),
    fontSize: 12,
    includeFontPadding: false,
    lineHeight: 20,
    fontFamily: _Platform.default.select({
      android: 'monospace',
      ios: 'Menlo'
    })
  },
  fileText: {
    color: LogBoxStyle.getTextColor(0.5),
    textAlign: 'center',
    flex: 1,
    fontSize: 12,
    includeFontPadding: false,
    lineHeight: 16,
    fontFamily: _Platform.default.select({
      android: 'monospace',
      ios: 'Menlo'
    })
  }
});
var _default = LogBoxInspectorCodeFrame;
exports.default = _default;
//# sourceMappingURL=LogBoxInspectorCodeFrame.js.map