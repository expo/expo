var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _View = _interopRequireDefault(require("../../Components/View/View"));
var _StyleSheet = _interopRequireDefault(require("../../StyleSheet/StyleSheet"));
var _Text = _interopRequireDefault(require("../../Text/Text"));
var _Platform = _interopRequireDefault(require("../../Utilities/Platform"));
var _LogBoxButton = _interopRequireDefault(require("./LogBoxButton"));
var LogBoxStyle = _interopRequireWildcard(require("./LogBoxStyle"));
var React = _interopRequireWildcard(require("react"));
var _jsxRuntime = require("react/jsx-runtime");
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
function LogBoxInspectorStackFrame(props) {
  var frame = props.frame,
    onPress = props.onPress;
  var column = frame.column != null && parseInt(frame.column, 10);
  var location = getFileName(frame.file) + (frame.lineNumber != null ? ':' + frame.lineNumber + (column && !isNaN(column) ? ':' + (column + 1) : '') : '');
  return (0, _jsxRuntime.jsx)(_View.default, {
    style: styles.frameContainer,
    children: (0, _jsxRuntime.jsxs)(_LogBoxButton.default, {
      backgroundColor: {
        default: 'transparent',
        pressed: onPress ? LogBoxStyle.getBackgroundColor(1) : 'transparent'
      },
      onPress: onPress,
      style: styles.frame,
      children: [(0, _jsxRuntime.jsx)(_Text.default, {
        style: [styles.name, frame.collapse === true && styles.dim],
        children: frame.methodName
      }), (0, _jsxRuntime.jsx)(_Text.default, {
        ellipsizeMode: "middle",
        numberOfLines: 1,
        style: [styles.location, frame.collapse === true && styles.dim],
        children: location
      })]
    })
  });
}
function getFileName(file) {
  if (file == null) {
    return '<unknown>';
  }
  var queryIndex = file.indexOf('?');
  return file.substring(file.lastIndexOf('/') + 1, queryIndex === -1 ? file.length : queryIndex);
}
var styles = _StyleSheet.default.create({
  frameContainer: {
    flexDirection: 'row',
    paddingHorizontal: 15
  },
  frame: {
    flex: 1,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 5
  },
  lineLocation: {
    flexDirection: 'row'
  },
  name: {
    color: LogBoxStyle.getTextColor(1),
    fontSize: 14,
    includeFontPadding: false,
    lineHeight: 18,
    fontWeight: '400',
    fontFamily: _Platform.default.select({
      android: 'monospace',
      ios: 'Menlo'
    })
  },
  location: {
    color: LogBoxStyle.getTextColor(0.8),
    fontSize: 12,
    fontWeight: '300',
    includeFontPadding: false,
    lineHeight: 16,
    paddingLeft: 10
  },
  dim: {
    color: LogBoxStyle.getTextColor(0.4),
    fontWeight: '300'
  },
  line: {
    color: LogBoxStyle.getTextColor(0.8),
    fontSize: 12,
    fontWeight: '300',
    includeFontPadding: false,
    lineHeight: 16
  }
});
var _default = LogBoxInspectorStackFrame;
exports.default = _default;