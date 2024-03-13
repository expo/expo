"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ErrorBoundary = ErrorBoundary;
function _bottomTabs() {
  const data = require("@react-navigation/bottom-tabs");
  _bottomTabs = function () {
    return data;
  };
  return data;
}
function _react() {
  const data = _interopRequireDefault(require("react"));
  _react = function () {
    return data;
  };
  return data;
}
function _StyleSheet() {
  const data = _interopRequireDefault(require("react-native-web/dist/exports/StyleSheet"));
  _StyleSheet = function () {
    return data;
  };
  return data;
}
function _Text() {
  const data = _interopRequireDefault(require("react-native-web/dist/exports/Text"));
  _Text = function () {
    return data;
  };
  return data;
}
function _View() {
  const data = _interopRequireDefault(require("react-native-web/dist/exports/View"));
  _View = function () {
    return data;
  };
  return data;
}
function _Platform() {
  const data = _interopRequireDefault(require("react-native-web/dist/exports/Platform"));
  _Platform = function () {
    return data;
  };
  return data;
}
function _ScrollView() {
  const data = _interopRequireDefault(require("react-native-web/dist/exports/ScrollView"));
  _ScrollView = function () {
    return data;
  };
  return data;
}
function _reactNativeSafeAreaContext() {
  const data = require("react-native-safe-area-context");
  _reactNativeSafeAreaContext = function () {
    return data;
  };
  return data;
}
function _Pressable() {
  const data = require("./Pressable");
  _Pressable = function () {
    return data;
  };
  return data;
}
function _Link() {
  const data = require("../link/Link");
  _Link = function () {
    return data;
  };
  return data;
}
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
let useMetroSymbolication;
if (process.env.NODE_ENV === 'development') {
  const {
    LogBoxLog,
    parseErrorStack
  } = require('@expo/metro-runtime/symbolicate');
  useMetroSymbolication = function (error) {
    const [logBoxLog, setLogBoxLog] = _react().default.useState(null);
    _react().default.useEffect(() => {
      let isMounted = true;
      const stack = parseErrorStack(error.stack);
      const log = new LogBoxLog({
        level: 'error',
        message: {
          content: error.message,
          substitutions: []
        },
        isComponentError: false,
        stack,
        category: error.message,
        componentStack: []
      });
      log.symbolicate('stack', symbolicatedLog => {
        if (isMounted) {
          setLogBoxLog(log);
        }
      });
      return () => {
        isMounted = false;
      };
    }, [error]);
    return logBoxLog;
  };
} else {
  useMetroSymbolication = function () {
    return null;
  };
}
let StackTrace;
if (process.env.NODE_ENV === 'development') {
  const {
    LogContext
  } = require('@expo/metro-runtime/build/error-overlay/Data/LogContext');
  const {
    LogBoxInspectorStackFrames
  } = require('@expo/metro-runtime/build/error-overlay/overlay/LogBoxInspectorStackFrames');
  StackTrace = function ({
    logData
  }) {
    if (!logData?.symbolicated?.stack?.stack) {
      return null;
    }
    return /*#__PURE__*/_react().default.createElement(_ScrollView().default, {
      style: {
        flex: 1
      }
    }, /*#__PURE__*/_react().default.createElement(LogContext.Provider, {
      value: {
        isDisabled: false,
        logs: [logData],
        selectedLogIndex: 0
      }
    }, /*#__PURE__*/_react().default.createElement(LogBoxInspectorStackFrames, {
      onRetry: function () {},
      type: "stack"
    })));
  };
} else {
  StackTrace = function () {
    return /*#__PURE__*/_react().default.createElement(_View().default, {
      style: {
        flex: 1
      }
    });
  };
}
function ErrorBoundary({
  error,
  retry
}) {
  const logBoxLog = useMetroSymbolication(error);
  const inTabBar = _react().default.useContext(_bottomTabs().BottomTabBarHeightContext);
  const Wrapper = inTabBar ? _View().default : _reactNativeSafeAreaContext().SafeAreaView;
  return /*#__PURE__*/_react().default.createElement(_View().default, {
    style: styles.container
  }, /*#__PURE__*/_react().default.createElement(Wrapper, {
    style: {
      flex: 1,
      gap: 8,
      maxWidth: 720,
      marginHorizontal: 'auto'
    }
  }, /*#__PURE__*/_react().default.createElement(_View().default, {
    style: {
      marginBottom: 12,
      gap: 4,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/_react().default.createElement(_Text().default, {
    role: "heading",
    "aria-level": 1,
    style: styles.title
  }, "Something went wrong"), /*#__PURE__*/_react().default.createElement(_Text().default, {
    role: "heading",
    "aria-level": 2,
    style: styles.errorMessage
  }, "Error: ", error.message)), /*#__PURE__*/_react().default.createElement(StackTrace, {
    logData: logBoxLog
  }), process.env.NODE_ENV === 'development' && /*#__PURE__*/_react().default.createElement(_Link().Link, {
    href: "/_sitemap",
    style: styles.link
  }, "Sitemap"), /*#__PURE__*/_react().default.createElement(_Pressable().Pressable, {
    onPress: retry
  }, ({
    hovered,
    pressed
  }) => /*#__PURE__*/_react().default.createElement(_View().default, {
    style: [styles.buttonInner, (hovered || pressed) && {
      backgroundColor: 'white'
    }]
  }, /*#__PURE__*/_react().default.createElement(_Text().default, {
    style: [styles.buttonText, {
      color: hovered || pressed ? 'black' : 'white'
    }]
  }, "Retry")))));
}
const styles = _StyleSheet().default.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    padding: 24,
    alignItems: 'stretch',
    justifyContent: 'center'
  },
  title: {
    color: 'white',
    fontSize: _Platform().default.select({
      web: 32,
      default: 24
    }),
    fontWeight: 'bold'
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'black',
    ..._Platform().default.select({
      web: {
        transitionDuration: '100ms'
      }
    })
  },
  buttonInner: {
    ..._Platform().default.select({
      web: {
        transitionDuration: '100ms'
      }
    }),
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderColor: 'white',
    borderWidth: 2,
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center'
  },
  code: {
    fontFamily: _Platform().default.select({
      default: 'Courier',
      ios: 'Courier New',
      android: 'monospace'
    }),
    fontWeight: '500'
  },
  errorMessage: {
    color: 'white',
    fontSize: 16
  },
  subtitle: {
    color: 'white',
    fontSize: 14,
    marginBottom: 12
    // textAlign: "center",
  },
  link: {
    color: 'rgba(255,255,255,0.4)',
    textDecorationStyle: 'solid',
    textDecorationLine: 'underline',
    fontSize: 14,
    textAlign: 'center'
  }
});
//# sourceMappingURL=ErrorBoundary.js.map