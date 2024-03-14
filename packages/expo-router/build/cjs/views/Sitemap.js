"use strict";
// Copyright © 2024 650 Industries.
'use client';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Sitemap = Sitemap;
exports.getNavOptions = getNavOptions;
function _react() {
  const data = _interopRequireDefault(require("react"));
  _react = function () {
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
function _ScrollView() {
  const data = _interopRequireDefault(require("react-native-web/dist/exports/ScrollView"));
  _ScrollView = function () {
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
function _useWindowDimensions() {
  const data = _interopRequireDefault(require("react-native-web/dist/exports/useWindowDimensions"));
  _useWindowDimensions = function () {
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
function _routerStore() {
  const data = require("../global-state/router-store");
  _routerStore = function () {
    return data;
  };
  return data;
}
function _imperativeApi() {
  const data = require("../imperative-api");
  _imperativeApi = function () {
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
function _matchers() {
  const data = require("../matchers");
  _matchers = function () {
    return data;
  };
  return data;
}
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const INDENT = 24;
function getNavOptions() {
  return {
    title: 'sitemap',
    headerShown: false,
    presentation: 'modal',
    animation: 'default',
    headerLargeTitle: false,
    headerTitleStyle: {
      color: 'white'
    },
    headerTintColor: 'white',
    headerLargeTitleStyle: {
      color: 'white'
    },
    headerStyle: {
      backgroundColor: 'black',
      // @ts-expect-error: mistyped
      borderBottomColor: '#323232'
    }
  };
}
function Sitemap() {
  const {
    top,
    bottom
  } = (0, _reactNativeSafeAreaContext().useSafeAreaInsets)();
  const {
    width
  } = (0, _useWindowDimensions().default)();
  return /*#__PURE__*/_react().default.createElement(_View().default, {
    style: styles.container
  }, /*#__PURE__*/_react().default.createElement(_StatusBar().default, {
    barStyle: "light-content"
  }), /*#__PURE__*/_react().default.createElement(_View().default, {
    style: [styles.main, {
      minWidth: Math.min(960, width * 0.9)
    }]
  }, /*#__PURE__*/_react().default.createElement(_ScrollView().default, {
    contentContainerStyle: [styles.scroll, {
      paddingTop: top + 12,
      paddingBottom: bottom + 12
    }],
    style: {
      flex: 1
    }
  }, /*#__PURE__*/_react().default.createElement(FileSystemView, null))));
}
function FileSystemView() {
  const routes = (0, _routerStore().useExpoRouter)().getSortedRoutes();
  return /*#__PURE__*/_react().default.createElement(_react().default.Fragment, null, routes.map(child => /*#__PURE__*/_react().default.createElement(_View().default, {
    key: child.contextKey,
    style: styles.itemContainer
  }, /*#__PURE__*/_react().default.createElement(FileItem, {
    route: child
  }))));
}
function FileItem({
  route,
  level = 0,
  parents = [],
  isInitial = false
}) {
  const disabled = route.children.length > 0;
  const segments = _react().default.useMemo(() => [...parents, ...route.route.split('/')], [parents, route.route]);
  const href = _react().default.useMemo(() => {
    return '/' + segments.map(v => {
      // add an extra layer of entropy to the url for deep dynamic routes
      if ((0, _matchers().matchDeepDynamicRouteName)(v)) {
        return v + '/' + Date.now();
      }
      // index must be erased but groups can be preserved.
      return v === 'index' ? '' : v;
    }).filter(Boolean).join('/');
  }, [segments, route.route]);
  const filename = _react().default.useMemo(() => {
    const segments = route.contextKey.split('/');
    // join last two segments for layout routes
    if (route.contextKey.match(/_layout\.[jt]sx?$/)) {
      return segments[segments.length - 2] + '/' + segments[segments.length - 1];
    }
    const segmentCount = route.route.split('/').length;

    // Join the segment count in reverse order
    // This presents files without layout routes as children with all relevant segments.
    return segments.slice(-segmentCount).join('/');
  }, [route]);
  const info = isInitial ? 'Initial' : route.generated ? 'Virtual' : '';
  return /*#__PURE__*/_react().default.createElement(_react().default.Fragment, null, !route.internal && /*#__PURE__*/_react().default.createElement(_Link().Link, {
    accessibilityLabel: route.contextKey,
    href: href,
    onPress: () => {
      if (_Platform().default.OS !== 'web' && _imperativeApi().router.canGoBack()) {
        // Ensure the modal pops
        _imperativeApi().router.back();
      }
    },
    style: {
      flex: 1,
      display: 'flex'
    },
    disabled: disabled,
    asChild: true
    // Ensure we replace the history so you can't go back to this page.
    ,
    replace: true
  }, /*#__PURE__*/_react().default.createElement(_Pressable().Pressable, {
    style: {
      flex: 1
    }
  }, ({
    pressed,
    hovered
  }) => /*#__PURE__*/_react().default.createElement(_View().default, {
    style: [styles.itemPressable, {
      paddingLeft: INDENT + level * INDENT,
      backgroundColor: hovered ? 'rgba(255,255,255,0.1)' : 'transparent'
    }, pressed && {
      backgroundColor: '#323232'
    }, disabled && {
      opacity: 0.4
    }]
  }, /*#__PURE__*/_react().default.createElement(_View().default, {
    style: {
      flexDirection: 'row',
      alignItems: 'center'
    }
  }, route.children.length ? /*#__PURE__*/_react().default.createElement(PkgIcon, null) : /*#__PURE__*/_react().default.createElement(FileIcon, null), /*#__PURE__*/_react().default.createElement(_Text().default, {
    style: styles.filename
  }, filename)), /*#__PURE__*/_react().default.createElement(_View().default, {
    style: {
      flexDirection: 'row',
      alignItems: 'center'
    }
  }, !!info && /*#__PURE__*/_react().default.createElement(_Text().default, {
    style: [styles.virtual, !disabled && {
      marginRight: 8
    }]
  }, info), !disabled && /*#__PURE__*/_react().default.createElement(ForwardIcon, null))))), route.children.map(child => /*#__PURE__*/_react().default.createElement(FileItem, {
    key: child.contextKey,
    route: child,
    isInitial: route.initialRouteName === child.route,
    parents: segments,
    level: level + (route.generated ? 0 : 1)
  })));
}
function FileIcon() {
  return /*#__PURE__*/_react().default.createElement(_Image().default, {
    style: styles.image,
    source: require('expo-router/assets/file.png')
  });
}
function PkgIcon() {
  return /*#__PURE__*/_react().default.createElement(_Image().default, {
    style: styles.image,
    source: require('expo-router/assets/pkg.png')
  });
}
function ForwardIcon() {
  return /*#__PURE__*/_react().default.createElement(_Image().default, {
    style: styles.image,
    source: require('expo-router/assets/forward.png')
  });
}
const styles = _StyleSheet().default.create({
  container: {
    backgroundColor: 'black',
    flex: 1,
    alignItems: 'stretch'
  },
  main: {
    marginHorizontal: 'auto',
    flex: 1,
    alignItems: 'stretch'
  },
  scroll: {
    paddingHorizontal: 12,
    // flex: 1,
    // paddingTop: top + 12,
    alignItems: 'stretch'
  },
  itemContainer: {
    borderWidth: 1,
    borderColor: '#323232',
    borderRadius: 19,
    marginBottom: 12,
    overflow: 'hidden'
  },
  itemPressable: {
    paddingHorizontal: INDENT,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ..._Platform().default.select({
      web: {
        transitionDuration: '100ms'
      }
    })
  },
  filename: {
    color: 'white',
    fontSize: 20,
    marginLeft: 12
  },
  virtual: {
    textAlign: 'right',
    color: 'white'
  },
  image: {
    width: 24,
    height: 24,
    resizeMode: 'contain'
  }
});
//# sourceMappingURL=Sitemap.js.map