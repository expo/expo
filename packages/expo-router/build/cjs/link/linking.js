"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.addEventListener = addEventListener;
exports.getInitialURL = getInitialURL;
Object.defineProperty(exports, "getPathFromState", {
  enumerable: true,
  get: function () {
    return _getPathFromState().default;
  }
});
exports.getRootURL = getRootURL;
Object.defineProperty(exports, "getStateFromPath", {
  enumerable: true,
  get: function () {
    return _getStateFromPath().default;
  }
});
function Linking() {
  const data = _interopRequireWildcard(require("expo-linking"));
  Linking = function () {
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
function _extractPathFromURL() {
  const data = require("../fork/extractPathFromURL");
  _extractPathFromURL = function () {
    return data;
  };
  return data;
}
function _getPathFromState() {
  const data = _interopRequireDefault(require("../fork/getPathFromState"));
  _getPathFromState = function () {
    return data;
  };
  return data;
}
function _getStateFromPath() {
  const data = _interopRequireDefault(require("../fork/getStateFromPath"));
  _getStateFromPath = function () {
    return data;
  };
  return data;
}
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
const isExpoGo = typeof expo !== 'undefined' && globalThis.expo?.modules?.ExpoGo;
function getInitialURLWithTimeout() {
  return Promise.race([Linking().getInitialURL(), new Promise(resolve =>
  // Timeout in 150ms if `getInitialState` doesn't resolve
  // Workaround for https://github.com/facebook/react-native/issues/25675
  setTimeout(() => resolve(null), 150))]);
}

// A custom getInitialURL is used on native to ensure the app always starts at
// the root path if it's launched from something other than a deep link.
// This helps keep the native functionality working like the web functionality.
// For example, if you had a root navigator where the first screen was `/settings` and the second was `/index`
// then `/index` would be used on web and `/settings` would be used on native.
function getInitialURL() {
  if (_Platform().default.OS === 'web') {
    if (typeof window === 'undefined') {
      return '';
    } else if (window.location?.href) {
      return window.location.href;
    }
  }
  return getInitialURLWithTimeout().then(url => parseExpoGoUrlFromListener(url) ??
  // The path will be nullish in bare apps when the app is launched from the home screen.
  // TODO(EvanBacon): define some policy around notifications.
  getRootURL());
}
let _rootURL;
function getRootURL() {
  if (_rootURL === undefined) {
    _rootURL = Linking().createURL('/');
  }
  return _rootURL;
}

// Expo Go is weird and requires the root path to be `/--/`
function parseExpoGoUrlFromListener(url) {
  if (!url || !isExpoGo) {
    return url;
  }
  const {
    pathname,
    queryString
  } = (0, _extractPathFromURL().parsePathAndParamsFromExpoGoLink)(url);
  // If the URL is defined (default in Expo Go dev apps) and the URL has no path:
  // `exp://192.168.87.39:19000/` then use the default `exp://192.168.87.39:19000/--/`
  if (!pathname || pathname === '/') {
    return getRootURL() + queryString;
  }
  return url;
}
function addEventListener(nativeLinking) {
  return listener => {
    let callback;
    if (isExpoGo) {
      // This extra work is only done in the Expo Go app.
      callback = async ({
        url
      }) => {
        url = parseExpoGoUrlFromListener(url);
        if (url && nativeLinking?.redirectSystemPath) {
          url = await nativeLinking.redirectSystemPath({
            path: url,
            initial: false
          });
        }
        listener(url);
      };
    } else {
      callback = async ({
        url
      }) => {
        if (url && nativeLinking?.redirectSystemPath) {
          url = await nativeLinking.redirectSystemPath({
            path: url,
            initial: false
          });
        }
        listener(url);
      };
    }
    const subscription = Linking().addEventListener('url', callback);
    return () => {
      // https://github.com/facebook/react-native/commit/6d1aca806cee86ad76de771ed3a1cc62982ebcd7
      subscription?.remove?.();
    };
  };
}
//# sourceMappingURL=linking.js.map