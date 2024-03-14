"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Tutorial = Tutorial;
function _react() {
  const data = _interopRequireDefault(require("react"));
  _react = function () {
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
function _StatusBar() {
  const data = _interopRequireDefault(require("react-native-web/dist/exports/StatusBar"));
  _StatusBar = function () {
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
function _createEntryFile() {
  const data = require("./createEntryFile");
  _createEntryFile = function () {
    return data;
  };
  return data;
}
function _exports() {
  const data = require("../exports");
  _exports = function () {
    return data;
  };
  return data;
}
function _Pressable() {
  const data = require("../views/Pressable");
  _Pressable = function () {
    return data;
  };
  return data;
}
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
// TODO: Use openLinkFromBrowser thing
function Header() {
  return /*#__PURE__*/_react().default.createElement(_Pressable().Pressable, null, ({
    hovered
  }) => /*#__PURE__*/_react().default.createElement(_Text().default, {
    role: "heading",
    "aria-level": 1,
    style: [styles.title, _Platform().default.OS !== 'web' && {
      textAlign: 'left'
    }]
  }, "Welcome to", ' ', /*#__PURE__*/_react().default.createElement(_exports().Link, {
    href: "https://github.com/expo/expo-router/",
    style: [hovered && {
      textDecorationColor: 'white',
      textDecorationLine: 'underline'
    }]
  }, "Expo")));
}
const canAutoTouchFile = process.env.EXPO_ROUTER_APP_ROOT != null;
function Tutorial() {
  _react().default.useEffect(() => {
    if (_Platform().default.OS === 'web') {
      // Reset the route on web so the initial route isn't a 404 after
      // the user has created the entry file.
      // This is useful for cases where you are testing the tutorial.
      // To test: touch the new file, then navigate to a missing route `/foobar`, then delete the app folder.
      // you should see the tutorial again and be able to create the entry file once more.
      if (typeof location !== 'undefined' && location.pathname !== '/') {
        location.replace('/');
      }
      if (typeof window !== 'undefined' && typeof window.document !== 'undefined') {
        window.document.title = 'npx expo start';
      }
    }
  }, []);
  return /*#__PURE__*/_react().default.createElement(_View().default, {
    style: styles.background
  }, /*#__PURE__*/_react().default.createElement(_StatusBar().default, {
    barStyle: "light-content"
  }), /*#__PURE__*/_react().default.createElement(_reactNativeSafeAreaContext().SafeAreaView, {
    style: styles.safeArea
  }, /*#__PURE__*/_react().default.createElement(_View().default, {
    style: styles.container
  }, /*#__PURE__*/_react().default.createElement(Header, null), /*#__PURE__*/_react().default.createElement(_Text().default, {
    role: "heading",
    "aria-level": 2,
    style: styles.subtitle
  }, "Start by creating a file", '\n', "in the", ' ', /*#__PURE__*/_react().default.createElement(_Text().default, {
    style: {
      fontWeight: 'bold'
    }
  }, getRootDir()), " directory."), canAutoTouchFile && /*#__PURE__*/_react().default.createElement(Button, null))));
}
function getRootDir() {
  const dir = process.env.EXPO_ROUTER_ABS_APP_ROOT;
  if (dir.match(/\/src\/app$/)) {
    return 'src/app';
  } else if (dir.match(/\/app$/)) {
    return 'app';
  }
  return dir.split('/').pop() ?? dir;
}
function Button() {
  return /*#__PURE__*/_react().default.createElement(_Pressable().Pressable, {
    onPress: () => {
      (0, _createEntryFile().createEntryFileAsync)();
    },
    style: {
      ..._Platform().default.select({
        web: {
          // subtle white shadow
          boxShadow: 'rgba(255, 255, 255, 0.15) 0px 0px 20px 5px'
        },
        native: {
          position: 'absolute',
          bottom: 24,
          left: 24,
          right: 24,
          overflow: 'hidden'
        }
      })
    }
  }, ({
    pressed,
    hovered
  }) => /*#__PURE__*/_react().default.createElement(_View().default, {
    style: [styles.buttonContainer, hovered && {
      backgroundColor: 'white'
    }, pressed && {
      backgroundColor: 'rgba(255,255,255,0.7)'
    }]
  }, /*#__PURE__*/_react().default.createElement(_Text().default, {
    style: [styles.code, hovered && {
      color: 'black'
    }]
  }, /*#__PURE__*/_react().default.createElement(_Text().default, {
    style: {
      color: '#BCC3CD'
    }
  }, "$"), " touch ", getRootDir(), "/index.js")));
}
const styles = _StyleSheet().default.create({
  background: {
    ..._Platform().default.select({
      web: {
        backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)',
        backgroundPositionX: -3,
        backgroundPositionY: -3,
        backgroundSize: '40px 40px'
      }
    }),
    backgroundColor: 'black',
    flex: 1
  },
  safeArea: {
    flex: 1,
    maxWidth: 960,
    marginHorizontal: 'auto',
    alignItems: 'stretch'
  },
  container: {
    flex: 1,
    padding: 24,
    alignItems: 'flex-start',
    justifyContent: 'center'
  },
  title: {
    color: 'white',
    fontSize: 64,
    paddingBottom: 24,
    fontWeight: 'bold'
  },
  buttonContainer: {
    ..._Platform().default.select({
      web: {
        transitionDuration: '200ms',
        backgroundColor: 'transparent'
      },
      default: {
        backgroundColor: 'white'
      }
    }),
    borderColor: 'white',
    borderWidth: 2,
    paddingVertical: 12,
    paddingHorizontal: 24
  },
  buttonText: {
    color: 'black'
  },
  code: {
    ..._Platform().default.select({
      web: {
        transitionDuration: '200ms',
        color: 'white',
        fontFamily: 'Courier'
      },
      default: {
        color: 'black',
        fontFamily: _Platform().default.select({
          ios: 'Courier New',
          android: 'monospace'
        })
      }
    }),
    userSelect: 'none',
    fontSize: 18,
    fontWeight: 'bold'
  },
  subtitle: {
    color: '#BCC3CD',
    fontSize: 36,
    fontWeight: '100',
    paddingBottom: 36,
    maxWidth: 960
  }
});
//# sourceMappingURL=Tutorial.js.map