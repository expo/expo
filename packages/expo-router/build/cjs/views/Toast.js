"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CODE_FONT = void 0;
exports.Toast = Toast;
exports.ToastWrapper = ToastWrapper;
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
function _ActivityIndicator() {
  const data = _interopRequireDefault(require("react-native-web/dist/exports/ActivityIndicator"));
  _ActivityIndicator = function () {
    return data;
  };
  return data;
}
function _Animated() {
  const data = _interopRequireDefault(require("react-native-web/dist/exports/Animated"));
  _Animated = function () {
    return data;
  };
  return data;
}
function _Image() {
  const data = _interopRequireDefault(require("react-native-web/dist/exports/Image"));
  _Image = function () {
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
function _reactNativeSafeAreaContext() {
  const data = require("react-native-safe-area-context");
  _reactNativeSafeAreaContext = function () {
    return data;
  };
  return data;
}
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const CODE_FONT = exports.CODE_FONT = _Platform().default.select({
  default: 'Courier',
  ios: 'Courier New',
  android: 'monospace'
});
function useFadeIn() {
  // Returns a React Native Animated value for fading in
  const [value] = _react().default.useState(() => new (_Animated().default.Value)(0));
  _react().default.useEffect(() => {
    _Animated().default.timing(value, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true
    }).start();
  }, []);
  return value;
}
function ToastWrapper({
  children
}) {
  const inTabBar = _react().default.useContext(_bottomTabs().BottomTabBarHeightContext);
  const Wrapper = inTabBar ? _View().default : _reactNativeSafeAreaContext().SafeAreaView;
  return /*#__PURE__*/_react().default.createElement(Wrapper, {
    collapsable: false,
    style: {
      flex: 1
    }
  }, children);
}
function Toast({
  children,
  filename,
  warning
}) {
  const filenamePretty = _react().default.useMemo(() => {
    if (!filename) return undefined;
    return 'app' + filename.replace(/^\./, '');
  }, [filename]);
  const value = useFadeIn();
  return /*#__PURE__*/_react().default.createElement(_View().default, {
    style: styles.container
  }, /*#__PURE__*/_react().default.createElement(_Animated().default.View, {
    style: [styles.toast,
    // @ts-expect-error: fixed is supported on web.
    {
      position: _Platform().default.select({
        web: 'fixed',
        default: 'absolute'
      }),
      opacity: value
    }]
  }, !warning && /*#__PURE__*/_react().default.createElement(_ActivityIndicator().default, {
    color: "white"
  }), warning && /*#__PURE__*/_react().default.createElement(_Image().default, {
    source: require('expo-router/assets/error.png'),
    style: styles.icon
  }), /*#__PURE__*/_react().default.createElement(_View().default, {
    style: {
      marginLeft: 8
    }
  }, /*#__PURE__*/_react().default.createElement(_Text().default, {
    style: styles.text
  }, children), filenamePretty && /*#__PURE__*/_react().default.createElement(_Text().default, {
    style: styles.filename
  }, filenamePretty))));
}
const styles = _StyleSheet().default.create({
  container: {
    backgroundColor: 'transparent',
    flex: 1
  },
  icon: {
    width: 20,
    height: 20,
    resizeMode: 'contain'
  },
  toast: {
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    flexDirection: 'row',
    bottom: 8,
    left: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
    backgroundColor: 'black'
  },
  text: {
    color: 'white',
    fontSize: 16
  },
  filename: {
    fontFamily: CODE_FONT,
    opacity: 0.8,
    color: 'white',
    fontSize: 12
  },
  code: {
    fontFamily: CODE_FONT
  }
});
//# sourceMappingURL=Toast.js.map