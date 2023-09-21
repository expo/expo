var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _View = _interopRequireDefault(require("../../Components/View/View"));
var _StyleSheet = _interopRequireDefault(require("../../StyleSheet/StyleSheet"));
var _Text = _interopRequireDefault(require("../../Text/Text"));
var _DeviceInfo = _interopRequireDefault(require("../../Utilities/DeviceInfo"));
var _LogBoxButton = _interopRequireDefault(require("./LogBoxButton"));
var LogBoxStyle = _interopRequireWildcard(require("./LogBoxStyle"));
var React = _interopRequireWildcard(require("react"));
var _jsxRuntime = require("react/jsx-runtime");
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
function LogBoxInspectorFooter(props) {
  if (props.level === 'syntax') {
    return (0, _jsxRuntime.jsx)(_View.default, {
      style: styles.root,
      children: (0, _jsxRuntime.jsx)(_View.default, {
        style: styles.button,
        children: (0, _jsxRuntime.jsx)(_Text.default, {
          style: styles.syntaxErrorText,
          children: "This error cannot be dismissed."
        })
      })
    });
  }
  return (0, _jsxRuntime.jsxs)(_View.default, {
    style: styles.root,
    children: [(0, _jsxRuntime.jsx)(FooterButton, {
      text: "Dismiss",
      onPress: props.onDismiss
    }), (0, _jsxRuntime.jsx)(FooterButton, {
      text: "Minimize",
      onPress: props.onMinimize
    })]
  });
}
function FooterButton(props) {
  return (0, _jsxRuntime.jsx)(_LogBoxButton.default, {
    backgroundColor: {
      default: 'transparent',
      pressed: LogBoxStyle.getBackgroundDarkColor()
    },
    onPress: props.onPress,
    style: buttonStyles.safeArea,
    children: (0, _jsxRuntime.jsx)(_View.default, {
      style: buttonStyles.content,
      children: (0, _jsxRuntime.jsx)(_Text.default, {
        style: buttonStyles.label,
        children: props.text
      })
    })
  });
}
var buttonStyles = _StyleSheet.default.create({
  safeArea: {
    flex: 1,
    paddingBottom: _DeviceInfo.default.getConstants().isIPhoneX_deprecated ? 30 : 0
  },
  content: {
    alignItems: 'center',
    height: 48,
    justifyContent: 'center'
  },
  label: {
    color: LogBoxStyle.getTextColor(1),
    fontSize: 14,
    includeFontPadding: false,
    lineHeight: 20
  }
});
var styles = _StyleSheet.default.create({
  root: {
    backgroundColor: LogBoxStyle.getBackgroundColor(1),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2
    },
    shadowRadius: 2,
    shadowOpacity: 0.5,
    flexDirection: 'row'
  },
  button: {
    flex: 1
  },
  syntaxErrorText: {
    textAlign: 'center',
    width: '100%',
    height: 48,
    fontSize: 14,
    lineHeight: 20,
    paddingTop: 20,
    paddingBottom: 50,
    fontStyle: 'italic',
    color: LogBoxStyle.getTextColor(0.6)
  }
});
var _default = LogBoxInspectorFooter;
exports.default = _default;