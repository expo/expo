"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.renderRootComponent = renderRootComponent;
function _expo() {
  const data = require("expo");
  _expo = function () {
    return data;
  };
  return data;
}
function SplashScreen() {
  const data = _interopRequireWildcard(require("expo-splash-screen"));
  SplashScreen = function () {
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
function _Platform() {
  const data = _interopRequireDefault(require("react-native-web/dist/exports/Platform"));
  _Platform = function () {
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
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
function isBaseObject(obj) {
  if (Object.prototype.toString.call(obj) !== '[object Object]') {
    return false;
  }
  const proto = Object.getPrototypeOf(obj);
  if (proto === null) {
    return true;
  }
  return proto === Object.prototype;
}
function isErrorShaped(error) {
  return error && typeof error === 'object' && typeof error.name === 'string' && typeof error.message === 'string';
}

/**
 * After we throw this error, any number of tools could handle it.
 * This check ensures the error is always in a reason state before surfacing it to the runtime.
 */
function convertError(error) {
  if (isErrorShaped(error)) {
    return error;
  }
  if (process.env.NODE_ENV === 'development') {
    if (error == null) {
      return new Error('A null/undefined error was thrown.');
    }
  }
  if (isBaseObject(error)) {
    return new Error(JSON.stringify(error));
  }
  return new Error(String(error));
}

/**
 * Register and mount the root component using the predefined rendering
 * method. This function ensures the Splash Screen and errors are handled correctly.
 */
function renderRootComponent(Component) {
  try {
    // This must be delayed so the user has a chance to call it first.
    setTimeout(() => {
      // @ts-expect-error: This function is native-only and for internal-use only.
      SplashScreen()._internal_preventAutoHideAsync?.();
    });
    if (process.env.NODE_ENV !== 'production') {
      const {
        withErrorOverlay
      } = require('@expo/metro-runtime/error-overlay');
      (0, _expo().registerRootComponent)(withErrorOverlay(Component));
    } else {
      (0, _expo().registerRootComponent)(Component);
    }
  } catch (e) {
    // Hide the splash screen if there was an error so the user can see it.
    SplashScreen().hideAsync();
    const error = convertError(e);
    // Prevent the app from throwing confusing:
    //  ERROR  Invariant Violation: "main" has not been registered. This can happen if:
    // * Metro (the local dev server) is run from the wrong folder. Check if Metro is running, stop it and restart it in the current project.
    // * A module failed to load due to an error and `AppRegistry.registerComponent` wasn't called.
    (0, _expo().registerRootComponent)(() => /*#__PURE__*/_react().default.createElement(_View().default, null));

    // Console is pretty useless on native, on web you get interactive stack traces.
    if (_Platform().default.OS === 'web') {
      console.error(error);
      console.error(`A runtime error has occurred while rendering the root component.`);
    }

    // Give React a tick to render before throwing.
    setTimeout(() => {
      throw error;
    });

    // TODO: Render a production-only error screen.
  }
}
//# sourceMappingURL=renderRootComponent.js.map