var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _StatusBar = _interopRequireDefault(require("../../Components/StatusBar/StatusBar"));
var _View = _interopRequireDefault(require("../../Components/View/View"));
var _Image = _interopRequireDefault(require("../../Image/Image"));
var _StyleSheet = _interopRequireDefault(require("../../StyleSheet/StyleSheet"));
var _Text = _interopRequireDefault(require("../../Text/Text"));
var _Platform = _interopRequireDefault(require("../../Utilities/Platform"));
var _LogBoxButton = _interopRequireDefault(require("./LogBoxButton"));
var LogBoxStyle = _interopRequireWildcard(require("./LogBoxStyle"));
var React = _interopRequireWildcard(require("react"));
var _jsxRuntime = require("react/jsx-runtime");
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
function LogBoxInspectorHeader(props) {
  if (props.level === 'syntax') {
    return (0, _jsxRuntime.jsx)(_View.default, {
      style: [styles.safeArea, styles[props.level]],
      children: (0, _jsxRuntime.jsx)(_View.default, {
        style: styles.header,
        children: (0, _jsxRuntime.jsx)(_View.default, {
          style: styles.title,
          children: (0, _jsxRuntime.jsx)(_Text.default, {
            style: styles.titleText,
            children: "Failed to compile"
          })
        })
      })
    });
  }
  var prevIndex = props.selectedIndex - 1 < 0 ? props.total - 1 : props.selectedIndex - 1;
  var nextIndex = props.selectedIndex + 1 > props.total - 1 ? 0 : props.selectedIndex + 1;
  var titleText = `Log ${props.selectedIndex + 1} of ${props.total}`;
  return (0, _jsxRuntime.jsx)(_View.default, {
    style: [styles.safeArea, styles[props.level]],
    children: (0, _jsxRuntime.jsxs)(_View.default, {
      style: styles.header,
      children: [(0, _jsxRuntime.jsx)(LogBoxInspectorHeaderButton, {
        disabled: props.total <= 1,
        level: props.level,
        image: require('./LogBoxImages/chevron-left.png'),
        onPress: function onPress() {
          return props.onSelectIndex(prevIndex);
        }
      }), (0, _jsxRuntime.jsx)(_View.default, {
        style: styles.title,
        children: (0, _jsxRuntime.jsx)(_Text.default, {
          style: styles.titleText,
          children: titleText
        })
      }), (0, _jsxRuntime.jsx)(LogBoxInspectorHeaderButton, {
        disabled: props.total <= 1,
        level: props.level,
        image: require('./LogBoxImages/chevron-right.png'),
        onPress: function onPress() {
          return props.onSelectIndex(nextIndex);
        }
      })]
    })
  });
}
var backgroundForLevel = function backgroundForLevel(level) {
  return {
    warn: {
      default: 'transparent',
      pressed: LogBoxStyle.getWarningDarkColor()
    },
    error: {
      default: 'transparent',
      pressed: LogBoxStyle.getErrorDarkColor()
    },
    fatal: {
      default: 'transparent',
      pressed: LogBoxStyle.getFatalDarkColor()
    },
    syntax: {
      default: 'transparent',
      pressed: LogBoxStyle.getFatalDarkColor()
    }
  }[level];
};
function LogBoxInspectorHeaderButton(props) {
  return (0, _jsxRuntime.jsx)(_LogBoxButton.default, {
    backgroundColor: backgroundForLevel(props.level),
    onPress: props.disabled ? null : props.onPress,
    style: headerStyles.button,
    children: props.disabled ? null : (0, _jsxRuntime.jsx)(_Image.default, {
      source: props.image,
      style: headerStyles.buttonImage
    })
  });
}
var headerStyles = _StyleSheet.default.create({
  button: {
    alignItems: 'center',
    aspectRatio: 1,
    justifyContent: 'center',
    marginTop: 5,
    marginRight: 6,
    marginLeft: 6,
    marginBottom: -8,
    borderRadius: 3
  },
  buttonImage: {
    height: 14,
    width: 8,
    tintColor: LogBoxStyle.getTextColor()
  }
});
var styles = _StyleSheet.default.create({
  syntax: {
    backgroundColor: LogBoxStyle.getFatalColor()
  },
  fatal: {
    backgroundColor: LogBoxStyle.getFatalColor()
  },
  warn: {
    backgroundColor: LogBoxStyle.getWarningColor()
  },
  error: {
    backgroundColor: LogBoxStyle.getErrorColor()
  },
  header: {
    flexDirection: 'row',
    height: _Platform.default.select({
      android: 48,
      ios: 44
    })
  },
  title: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center'
  },
  titleText: {
    color: LogBoxStyle.getTextColor(),
    fontSize: 16,
    fontWeight: '600',
    includeFontPadding: false,
    lineHeight: 20
  },
  safeArea: {
    paddingTop: _Platform.default.OS === 'android' ? _StatusBar.default.currentHeight : 40
  }
});
var _default = LogBoxInspectorHeader;
exports.default = _default;
//# sourceMappingURL=LogBoxInspectorHeader.js.map