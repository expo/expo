"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
function _core() {
  const data = require("@react-navigation/core");
  _core = function () {
    return data;
  };
  return data;
}
function _native() {
  const data = require("@react-navigation/native");
  _native = function () {
    return data;
  };
  return data;
}
function _useBackButton() {
  const data = _interopRequireDefault(require("@react-navigation/native/src/useBackButton"));
  _useBackButton = function () {
    return data;
  };
  return data;
}
function _useDocumentTitle() {
  const data = _interopRequireDefault(require("@react-navigation/native/src/useDocumentTitle"));
  _useDocumentTitle = function () {
    return data;
  };
  return data;
}
function _useThenable() {
  const data = _interopRequireDefault(require("@react-navigation/native/src/useThenable"));
  _useThenable = function () {
    return data;
  };
  return data;
}
function React() {
  const data = _interopRequireWildcard(require("react"));
  React = function () {
    return data;
  };
  return data;
}
function _useLinking() {
  const data = _interopRequireDefault(require("./useLinking"));
  _useLinking = function () {
    return data;
  };
  return data;
}
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function _extends() { _extends = Object.assign ? Object.assign.bind() : function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); } // Forked from React Navigation in order to use a custom `useLinking` -> `extractPathFromURL` function.
// https://github.com/react-navigation/react-navigation/blob/main/packages/native/src/NavigationContainer.tsx
global.REACT_NAVIGATION_DEVTOOLS = new WeakMap();
/**
 * Container component which holds the navigation state designed for React Native apps.
 * This should be rendered at the root wrapping the whole app.
 *
 * @param props.initialState Initial state object for the navigation tree. When deep link handling is enabled, this will override deep links when specified. Make sure that you don't specify an `initialState` when there's a deep link (`Linking.getInitialURL()`).
 * @param props.onReady Callback which is called after the navigation tree mounts.
 * @param props.onStateChange Callback which is called with the latest navigation state when it changes.
 * @param props.theme Theme object for the navigators.
 * @param props.linking Options for deep linking. Deep link handling is enabled when this prop is provided, unless `linking.enabled` is `false`.
 * @param props.fallback Fallback component to render until we have finished getting initial state when linking is enabled. Defaults to `null`.
 * @param props.documentTitle Options to configure the document title on Web. Updating document title is handled by default unless `documentTitle.enabled` is `false`.
 * @param props.children Child elements to render the content.
 * @param props.ref Ref object which refers to the navigation object containing helper methods.
 */
function NavigationContainerInner({
  theme = _native().DefaultTheme,
  linking,
  fallback = null,
  documentTitle,
  onReady,
  ...rest
}, ref) {
  const isLinkingEnabled = linking ? linking.enabled !== false : false;
  if (linking?.config) {
    (0, _core().validatePathConfig)(linking.config);
  }
  const refContainer = React().useRef(null);
  (0, _useBackButton().default)(refContainer);
  (0, _useDocumentTitle().default)(refContainer, documentTitle);
  const {
    getInitialState
  } = (0, _useLinking().default)(refContainer, {
    // independent: rest.independent,
    enabled: isLinkingEnabled,
    prefixes: [],
    ...linking
  });

  // Add additional linking related info to the ref
  // This will be used by the devtools
  React().useEffect(() => {
    if (refContainer.current) {
      REACT_NAVIGATION_DEVTOOLS.set(refContainer.current, {
        get linking() {
          return {
            ...linking,
            enabled: isLinkingEnabled,
            prefixes: linking?.prefixes ?? [],
            getStateFromPath: linking?.getStateFromPath ?? _core().getStateFromPath,
            getPathFromState: linking?.getPathFromState ?? _core().getPathFromState,
            getActionFromState: linking?.getActionFromState ?? _core().getActionFromState
          };
        }
      });
    }
  });
  const [isResolved, initialState] = (0, _useThenable().default)(getInitialState);
  React().useImperativeHandle(ref, () => refContainer.current);
  const linkingContext = React().useMemo(() => ({
    options: linking
  }), [linking]);
  const isReady = rest.initialState != null || !isLinkingEnabled || isResolved;
  const onReadyRef = React().useRef(onReady);
  React().useEffect(() => {
    onReadyRef.current = onReady;
  });
  React().useEffect(() => {
    if (isReady) {
      onReadyRef.current?.();
    }
  }, [isReady]);
  if (!isReady) {
    // This is temporary until we have Suspense for data-fetching
    // Then the fallback will be handled by a parent `Suspense` component
    return fallback;
  }
  return /*#__PURE__*/React().createElement(_native().LinkingContext.Provider, {
    value: linkingContext
  }, /*#__PURE__*/React().createElement(_native().ThemeProvider, {
    value: theme
  }, /*#__PURE__*/React().createElement(_core().BaseNavigationContainer, _extends({}, rest, {
    initialState: rest.initialState == null ? initialState : rest.initialState,
    ref: refContainer
  }))));
}
const NavigationContainer = /*#__PURE__*/React().forwardRef(NavigationContainerInner);
var _default = exports.default = NavigationContainer;
//# sourceMappingURL=NavigationContainer.native.js.map