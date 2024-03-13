"use strict";
'use client';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ExpoRoot = ExpoRoot;
function _expoConstants() {
  const data = _interopRequireDefault(require("expo-constants"));
  _expoConstants = function () {
    return data;
  };
  return data;
}
function _expoStatusBar() {
  const data = require("expo-status-bar");
  _expoStatusBar = function () {
    return data;
  };
  return data;
}
function _react() {
  const data = _interopRequireWildcard(require("react"));
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
function _reactNativeSafeAreaContext() {
  const data = require("react-native-safe-area-context");
  _reactNativeSafeAreaContext = function () {
    return data;
  };
  return data;
}
function _NavigationContainer() {
  const data = _interopRequireDefault(require("./fork/NavigationContainer"));
  _NavigationContainer = function () {
    return data;
  };
  return data;
}
function _routerStore() {
  const data = require("./global-state/router-store");
  _routerStore = function () {
    return data;
  };
  return data;
}
function _serverLocationContext() {
  const data = require("./global-state/serverLocationContext");
  _serverLocationContext = function () {
    return data;
  };
  return data;
}
function _Splash() {
  const data = require("./views/Splash");
  _Splash = function () {
    return data;
  };
  return data;
}
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function _extends() { _extends = Object.assign ? Object.assign.bind() : function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }
const isTestEnv = process.env.NODE_ENV === 'test';
const INITIAL_METRICS = _Platform().default.OS === 'web' || isTestEnv ? {
  frame: {
    x: 0,
    y: 0,
    width: 0,
    height: 0
  },
  insets: {
    top: 0,
    left: 0,
    right: 0,
    bottom: 0
  }
} : undefined;
const hasViewControllerBasedStatusBarAppearance = _Platform().default.OS === 'ios' && !!_expoConstants().default.expoConfig?.ios?.infoPlist?.UIViewControllerBasedStatusBarAppearance;
function ExpoRoot({
  wrapper: ParentWrapper = _react().Fragment,
  ...props
}) {
  /*
   * Due to static rendering we need to wrap these top level views in second wrapper
   * View's like <SafeAreaProvider /> generate a <div> so if the parent wrapper
   * is a HTML document, we need to ensure its inside the <body>
   */
  const wrapper = ({
    children
  }) => {
    return /*#__PURE__*/_react().default.createElement(ParentWrapper, null, /*#__PURE__*/_react().default.createElement(_reactNativeSafeAreaContext().SafeAreaProvider
    // SSR support
    , {
      initialMetrics: INITIAL_METRICS
    }, children, !hasViewControllerBasedStatusBarAppearance && /*#__PURE__*/_react().default.createElement(_expoStatusBar().StatusBar, {
      style: "auto"
    })));
  };
  return /*#__PURE__*/_react().default.createElement(ContextNavigator, _extends({}, props, {
    wrapper: wrapper
  }));
}
const initialUrl = _Platform().default.OS === 'web' && typeof window !== 'undefined' ? new URL(window.location.href) : undefined;
function ContextNavigator({
  context,
  location: initialLocation = initialUrl,
  wrapper: WrapperComponent = _react().Fragment
}) {
  const store = (0, _routerStore().useInitializeExpoRouter)(context, initialLocation);
  if (store.shouldShowTutorial()) {
    _Splash().SplashScreen.hideAsync();
    if (process.env.NODE_ENV === 'development') {
      const Tutorial = require('./onboard/Tutorial').Tutorial;
      return /*#__PURE__*/_react().default.createElement(WrapperComponent, null, /*#__PURE__*/_react().default.createElement(Tutorial, null));
    } else {
      // Ensure tutorial styles are stripped in production.
      return null;
    }
  }
  const Component = store.rootComponent;
  return /*#__PURE__*/_react().default.createElement(_NavigationContainer().default, {
    ref: store.navigationRef,
    initialState: store.initialState,
    linking: store.linking,
    onUnhandledAction: onUnhandledAction,
    documentTitle: {
      enabled: false
    }
  }, /*#__PURE__*/_react().default.createElement(_serverLocationContext().ServerLocationContext.Provider, {
    value: initialLocation
  }, /*#__PURE__*/_react().default.createElement(WrapperComponent, null, /*#__PURE__*/_react().default.createElement(Component, null))));
}
let onUnhandledAction;
if (process.env.NODE_ENV !== 'production') {
  onUnhandledAction = action => {
    const payload = action.payload;
    let message = `The action '${action.type}'${payload ? ` with payload ${JSON.stringify(action.payload)}` : ''} was not handled by any navigator.`;
    switch (action.type) {
      case 'NAVIGATE':
      case 'PUSH':
      case 'REPLACE':
      case 'JUMP_TO':
        if (payload?.name) {
          message += `\n\nDo you have a route named '${payload.name}'?`;
        } else {
          message += `\n\nYou need to pass the name of the screen to navigate to. This may be a bug.`;
        }
        break;
      case 'GO_BACK':
      case 'POP':
      case 'POP_TO_TOP':
        message += `\n\nIs there any screen to go back to?`;
        break;
      case 'OPEN_DRAWER':
      case 'CLOSE_DRAWER':
      case 'TOGGLE_DRAWER':
        message += `\n\nIs your screen inside a Drawer navigator?`;
        break;
    }
    message += `\n\nThis is a development-only warning and won't be shown in production.`;
    if (process.env.NODE_ENV === 'test') {
      throw new Error(message);
    }
    console.error(message);
  };
} else {
  onUnhandledAction = function () {};
}
//# sourceMappingURL=ExpoRoot.js.map