"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.useGlobalSearchParams = useGlobalSearchParams;
exports.useLocalSearchParams = useLocalSearchParams;
exports.useNavigationContainerRef = useNavigationContainerRef;
exports.usePathname = usePathname;
exports.useRootNavigation = useRootNavigation;
exports.useRootNavigationState = useRootNavigationState;
exports.useRouteInfo = useRouteInfo;
exports.useRouter = useRouter;
exports.useSegments = useSegments;
exports.useUnstableGlobalHref = useUnstableGlobalHref;
function _native() {
  const data = require("@react-navigation/native");
  _native = function () {
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
function _routerStore() {
  const data = require("./global-state/router-store");
  _routerStore = function () {
    return data;
  };
  return data;
}
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function useRootNavigationState() {
  return (0, _routerStore().useStoreRootState)();
}
function useRouteInfo() {
  return (0, _routerStore().useStoreRouteInfo)();
}

/** @deprecated use `useNavigationContainerRef()` instead, which returns a React ref. */
function useRootNavigation() {
  return _routerStore().store.navigationRef.current;
}

/** @return the root `<NavigationContainer />` ref for the app. The `ref.current` may be `null` if the `<NavigationContainer />` hasn't mounted yet. */
function useNavigationContainerRef() {
  return _routerStore().store.navigationRef;
}
function useRouter() {
  return _react().default.useMemo(() => ({
    push: _routerStore().store.push,
    dismiss: _routerStore().store.dismiss,
    dismissAll: _routerStore().store.dismissAll,
    canDismiss: _routerStore().store.canDismiss,
    back: _routerStore().store.goBack,
    replace: _routerStore().store.replace,
    setParams: _routerStore().store.setParams,
    canGoBack: _routerStore().store.canGoBack,
    navigate: _routerStore().store.navigate
    // TODO(EvanBacon): add `reload`
  }), []);
}

/**
 * @private
 * @returns the current global pathname with query params attached. This may change in the future to include the hostname from a predefined universal link, i.e. `/foobar?hey=world` becomes `https://acme.dev/foobar?hey=world`
 */
function useUnstableGlobalHref() {
  return (0, _routerStore().useStoreRouteInfo)().unstable_globalHref;
}

/**
 * Get a list of selected file segments for the currently selected route. Segments are not normalized, so they will be the same as the file path. e.g. /[id]?id=normal -> ["[id]"]
 *
 * `useSegments` can be typed using an abstract.
 * Consider the following file structure, and strictly typed `useSegments` function:
 *
 * ```md
 * - app
 *   - [user]
 *     - index.js
 *     - followers.js
 *   - settings.js
 * ```
 * This can be strictly typed using the following abstract:
 *
 * ```ts
 * const [first, second] = useSegments<['settings'] | ['[user]'] | ['[user]', 'followers']>()
 * ```
 */
function useSegments() {
  return (0, _routerStore().useStoreRouteInfo)().segments;
}

/** @returns global selected pathname without query parameters. */
function usePathname() {
  return (0, _routerStore().useStoreRouteInfo)().pathname;
}

/**
 * Get the globally selected query parameters, including dynamic path segments. This function will update even when the route is not focused.
 * Useful for analytics or other background operations that don't draw to the screen.
 *
 * When querying search params in a stack, opt-towards using `useLocalSearchParams` as these will only
 * update when the route is focused.
 *
 * @see `useLocalSearchParams`
 */
function useGlobalSearchParams() {
  return (0, _routerStore().useStoreRouteInfo)().params;
}

/**
 * Returns the URL search parameters for the contextually focused route. e.g. `/acme?foo=bar` -> `{ foo: "bar" }`.
 * This is useful for stacks where you may push a new screen that changes the query parameters.
 *
 * To observe updates even when the invoking route is not focused, use `useGlobalSearchParams()`.
 */
function useLocalSearchParams() {
  const params = _react().default.useContext(_native().NavigationRouteContext)?.params ?? {};
  return Object.fromEntries(Object.entries(params).map(([key, value]) => {
    if (Array.isArray(value)) {
      return [key, value.map(v => {
        try {
          return decodeURIComponent(v);
        } catch {
          return v;
        }
      })];
    } else {
      try {
        return [key, decodeURIComponent(value)];
      } catch {
        return [key, value];
      }
    }
  }));
}
//# sourceMappingURL=hooks.js.map