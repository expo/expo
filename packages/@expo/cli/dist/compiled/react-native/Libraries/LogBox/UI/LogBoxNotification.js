var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _View = _interopRequireDefault(require("../../Components/View/View"));
var _Image = _interopRequireDefault(require("../../Image/Image"));
var _StyleSheet = _interopRequireDefault(require("../../StyleSheet/StyleSheet"));
var _Text = _interopRequireDefault(require("../../Text/Text"));
var LogBoxData = _interopRequireWildcard(require("../Data/LogBoxData"));
var _LogBoxLog = _interopRequireDefault(require("../Data/LogBoxLog"));
var _LogBoxButton = _interopRequireDefault(require("./LogBoxButton"));
var _LogBoxMessage = _interopRequireDefault(require("./LogBoxMessage"));
var LogBoxStyle = _interopRequireWildcard(require("./LogBoxStyle"));
var React = _interopRequireWildcard(require("react"));
var _jsxRuntime = require("react/jsx-runtime");
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
function LogBoxLogNotification(props) {
  var totalLogCount = props.totalLogCount,
    level = props.level,
    log = props.log;
  React.useEffect(function () {
    LogBoxData.symbolicateLogLazy(log);
  }, [log]);
  return (0, _jsxRuntime.jsx)(_View.default, {
    style: toastStyles.container,
    children: (0, _jsxRuntime.jsx)(_LogBoxButton.default, {
      onPress: props.onPressOpen,
      style: toastStyles.press,
      backgroundColor: {
        default: LogBoxStyle.getBackgroundColor(1),
        pressed: LogBoxStyle.getBackgroundColor(0.9)
      },
      children: (0, _jsxRuntime.jsxs)(_View.default, {
        style: toastStyles.content,
        children: [(0, _jsxRuntime.jsx)(CountBadge, {
          count: totalLogCount,
          level: level
        }), (0, _jsxRuntime.jsx)(Message, {
          message: log.message
        }), (0, _jsxRuntime.jsx)(DismissButton, {
          onPress: props.onPressDismiss
        })]
      })
    })
  });
}
function CountBadge(props) {
  return (0, _jsxRuntime.jsx)(_View.default, {
    style: countStyles.outside,
    children: (0, _jsxRuntime.jsx)(_View.default, {
      style: [countStyles.inside, countStyles[props.level]],
      children: (0, _jsxRuntime.jsx)(_Text.default, {
        style: countStyles.text,
        children: props.count <= 1 ? '!' : props.count
      })
    })
  });
}
function Message(props) {
  return (0, _jsxRuntime.jsx)(_View.default, {
    style: messageStyles.container,
    children: (0, _jsxRuntime.jsx)(_Text.default, {
      numberOfLines: 1,
      style: messageStyles.text,
      children: props.message && (0, _jsxRuntime.jsx)(_LogBoxMessage.default, {
        plaintext: true,
        message: props.message,
        style: messageStyles.substitutionText
      })
    })
  });
}
function DismissButton(props) {
  return (0, _jsxRuntime.jsx)(_View.default, {
    style: dismissStyles.container,
    children: (0, _jsxRuntime.jsx)(_LogBoxButton.default, {
      backgroundColor: {
        default: LogBoxStyle.getTextColor(0.3),
        pressed: LogBoxStyle.getTextColor(0.5)
      },
      hitSlop: {
        top: 12,
        right: 10,
        bottom: 12,
        left: 10
      },
      onPress: props.onPress,
      style: dismissStyles.press,
      children: (0, _jsxRuntime.jsx)(_Image.default, {
        source: require('./LogBoxImages/close.png'),
        style: dismissStyles.image
      })
    })
  });
}
var countStyles = _StyleSheet.default.create({
  warn: {
    backgroundColor: LogBoxStyle.getWarningColor(1)
  },
  error: {
    backgroundColor: LogBoxStyle.getErrorColor(1)
  },
  log: {
    backgroundColor: LogBoxStyle.getLogColor(1)
  },
  outside: {
    padding: 2,
    borderRadius: 25,
    backgroundColor: '#fff',
    marginRight: 8
  },
  inside: {
    minWidth: 18,
    paddingLeft: 4,
    paddingRight: 4,
    borderRadius: 25,
    fontWeight: '600'
  },
  text: {
    color: LogBoxStyle.getTextColor(1),
    fontSize: 14,
    lineHeight: 18,
    textAlign: 'center',
    fontWeight: '600',
    textShadowColor: LogBoxStyle.getBackgroundColor(0.4),
    textShadowOffset: {
      width: 0,
      height: 0
    },
    textShadowRadius: 3
  }
});
var messageStyles = _StyleSheet.default.create({
  container: {
    alignSelf: 'stretch',
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 'auto',
    borderLeftColor: LogBoxStyle.getTextColor(0.2),
    borderLeftWidth: 1,
    paddingLeft: 8
  },
  text: {
    color: LogBoxStyle.getTextColor(1),
    flex: 1,
    fontSize: 14,
    lineHeight: 22
  },
  substitutionText: {
    color: LogBoxStyle.getTextColor(0.6)
  }
});
var dismissStyles = _StyleSheet.default.create({
  container: {
    alignSelf: 'center',
    flexDirection: 'row',
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: 'auto',
    marginLeft: 5
  },
  press: {
    height: 20,
    width: 20,
    borderRadius: 25,
    alignSelf: 'flex-end',
    alignItems: 'center',
    justifyContent: 'center'
  },
  image: {
    height: 8,
    width: 8,
    tintColor: LogBoxStyle.getBackgroundColor(1)
  }
});
var toastStyles = _StyleSheet.default.create({
  container: {
    height: 48,
    position: 'relative',
    width: '100%',
    justifyContent: 'center',
    marginTop: 0.5,
    backgroundColor: LogBoxStyle.getTextColor(1)
  },
  press: {
    height: 48,
    position: 'relative',
    width: '100%',
    justifyContent: 'center',
    marginTop: 0.5,
    paddingHorizontal: 12
  },
  content: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    borderRadius: 8,
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: 'auto'
  }
});
var _default = LogBoxLogNotification;
exports.default = _default;
//# sourceMappingURL=LogBoxNotification.js.map