"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.store = exports.RouterStore = void 0;
exports.useExpoRouter = useExpoRouter;
exports.useInitializeExpoRouter = useInitializeExpoRouter;
exports.useStoreRootState = useStoreRootState;
exports.useStoreRouteInfo = useStoreRouteInfo;
function _native() {
  const data = require("@react-navigation/native");
  _native = function () {
    return data;
  };
  return data;
}
function _expoConstants() {
  const data = _interopRequireDefault(require("expo-constants"));
  _expoConstants = function () {
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
  const data = require("react");
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
function _routing() {
  const data = require("./routing");
  _routing = function () {
    return data;
  };
  return data;
}
function _sortRoutes() {
  const data = require("./sort-routes");
  _sortRoutes = function () {
    return data;
  };
  return data;
}
function _LocationProvider() {
  const data = require("../LocationProvider");
  _LocationProvider = function () {
    return data;
  };
  return data;
}
function _getPathFromState() {
  const data = require("../fork/getPathFromState");
  _getPathFromState = function () {
    return data;
  };
  return data;
}
function _getLinkingConfig() {
  const data = require("../getLinkingConfig");
  _getLinkingConfig = function () {
    return data;
  };
  return data;
}
function _getRoutes() {
  const data = require("../getRoutes");
  _getRoutes = function () {
    return data;
  };
  return data;
}
function _useScreens() {
  const data = require("../useScreens");
  _useScreens = function () {
    return data;
  };
  return data;
}
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
/**
 * This is the global state for the router. It is used to keep track of the current route, and to provide a way to navigate to other routes.
 *
 * There should only be one instance of this class and be initialized via `useInitializeExpoRouter`
 */
class RouterStore {
  hasAttemptedToHideSplash = false;
  rootStateSubscribers = new Set();
  storeSubscribers = new Set();
  linkTo = _routing().linkTo.bind(this);
  getSortedRoutes = _sortRoutes().getSortedRoutes.bind(this);
  goBack = _routing().goBack.bind(this);
  canGoBack = _routing().canGoBack.bind(this);
  push = _routing().push.bind(this);
  dismiss = _routing().dismiss.bind(this);
  replace = _routing().replace.bind(this);
  dismissAll = _routing().dismissAll.bind(this);
  canDismiss = _routing().canDismiss.bind(this);
  setParams = _routing().setParams.bind(this);
  navigate = _routing().navigate.bind(this);
  initialize(context, navigationRef, linkingConfigOptions = {}) {
    // Clean up any previous state
    this.initialState = undefined;
    this.rootState = undefined;
    this.nextState = undefined;
    this.linking = undefined;
    this.navigationRefSubscription?.();
    this.rootStateSubscribers.clear();
    this.storeSubscribers.clear();
    this.routeNode = (0, _getRoutes().getRoutes)(context, {
      ..._expoConstants().default.expoConfig?.extra?.router,
      ignoreEntryPoints: true,
      platform: _Platform().default.OS
    });

    // We always needs routeInfo, even if there are no routes. This can happen if:
    //  - there are no routes (we are showing the onboarding screen)
    //  - getInitialURL() is async
    this.routeInfo = {
      unstable_globalHref: '',
      pathname: '',
      isIndex: false,
      params: {},
      segments: []
    };
    if (this.routeNode) {
      // We have routes, so get the linking config and the root component
      this.linking = (0, _getLinkingConfig().getLinkingConfig)(this.routeNode, context, linkingConfigOptions);
      this.rootComponent = (0, _useScreens().getQualifiedRouteComponent)(this.routeNode);

      // By default React Navigation is async and does not render anything in the first pass as it waits for `getInitialURL`
      // This will cause static rendering to fail, which once performs a single pass.
      // If the initialURL is a string, we can preload the state and routeInfo, skipping React Navigation's async behavior.
      const initialURL = this.linking?.getInitialURL?.();
      if (typeof initialURL === 'string') {
        this.rootState = this.linking.getStateFromPath?.(initialURL, this.linking.config);
        this.initialState = this.rootState;
        if (this.rootState) {
          this.routeInfo = this.getRouteInfo(this.rootState);
        }
      }
    } else {
      // Only error in production, in development we will show the onboarding screen
      if (process.env.NODE_ENV === 'production') {
        throw new Error('No routes found');
      }

      // In development, we will show the onboarding screen
      this.rootComponent = _react().Fragment;
    }

    /**
     * Counter intuitively - this fires AFTER both React Navigation's state changes and the subsequent paint.
     * This poses a couple of issues for Expo Router,
     *   - Ensuring hooks (e.g. useSearchParams()) have data in the initial render
     *   - Reacting to state changes after a navigation event
     *
     * This is why the initial render renders a Fragment and we wait until `onReady()` is called
     * Additionally, some hooks compare the state from both the store and the navigationRef. If the store it stale,
     * that hooks will manually update the store.
     *
     */
    this.navigationRef = navigationRef;
    this.navigationRefSubscription = navigationRef.addListener('state', data => {
      const state = data.data.state;
      if (!this.hasAttemptedToHideSplash) {
        this.hasAttemptedToHideSplash = true;
        // NOTE(EvanBacon): `navigationRef.isReady` is sometimes not true when state is called initially.
        this.splashScreenAnimationFrame = requestAnimationFrame(() => {
          // @ts-expect-error: This function is native-only and for internal-use only.
          SplashScreen()._internal_maybeHideAsync?.();
        });
      }
      let shouldUpdateSubscribers = this.nextState === state;
      this.nextState = undefined;

      // This can sometimes be undefined when an error is thrown in the Root Layout Route.
      // Additionally that state may already equal the rootState if it was updated within a hook
      if (state && state !== this.rootState) {
        store.updateState(state, undefined);
        shouldUpdateSubscribers = true;
      }

      // If the state has changed, or was changed inside a hook we need to update the subscribers
      if (shouldUpdateSubscribers) {
        for (const subscriber of this.rootStateSubscribers) {
          subscriber();
        }
      }
    });
    for (const subscriber of this.storeSubscribers) {
      subscriber();
    }
  }
  updateState(state, nextState = state) {
    store.rootState = state;
    store.nextState = nextState;
    const nextRouteInfo = store.getRouteInfo(state);
    if (!(0, _getPathFromState().deepEqual)(this.routeInfo, nextRouteInfo)) {
      store.routeInfo = nextRouteInfo;
    }
  }
  getRouteInfo(state) {
    return (0, _LocationProvider().getRouteInfoFromState)((state, asPath) => {
      return (0, _getPathFromState().getPathDataFromState)(state, {
        screens: {},
        ...this.linking?.config,
        preserveDynamicRoutes: asPath,
        preserveGroups: asPath
      });
    }, state);
  }

  // This is only used in development, to show the onboarding screen
  // In production we should have errored during the initialization
  shouldShowTutorial() {
    return !this.routeNode && process.env.NODE_ENV === 'development';
  }

  /** Make sure these are arrow functions so `this` is correctly bound */
  subscribeToRootState = subscriber => {
    this.rootStateSubscribers.add(subscriber);
    return () => this.rootStateSubscribers.delete(subscriber);
  };
  subscribeToStore = subscriber => {
    this.storeSubscribers.add(subscriber);
    return () => this.storeSubscribers.delete(subscriber);
  };
  snapshot = () => {
    return this;
  };
  rootStateSnapshot = () => {
    return this.rootState;
  };
  routeInfoSnapshot = () => {
    return this.routeInfo;
  };
  cleanup() {
    if (this.splashScreenAnimationFrame) {
      cancelAnimationFrame(this.splashScreenAnimationFrame);
    }
  }
}
exports.RouterStore = RouterStore;
const store = exports.store = new RouterStore();
function useExpoRouter() {
  return (0, _react().useSyncExternalStore)(store.subscribeToStore, store.snapshot, store.snapshot);
}
function syncStoreRootState() {
  if (store.navigationRef.isReady()) {
    const currentState = store.navigationRef.getRootState();
    if (store.rootState !== currentState) {
      store.updateState(currentState);
    }
  }
}
function useStoreRootState() {
  syncStoreRootState();
  return (0, _react().useSyncExternalStore)(store.subscribeToRootState, store.rootStateSnapshot, store.rootStateSnapshot);
}
function useStoreRouteInfo() {
  syncStoreRootState();
  return (0, _react().useSyncExternalStore)(store.subscribeToRootState, store.routeInfoSnapshot, store.routeInfoSnapshot);
}
function useInitializeExpoRouter(context, options) {
  const navigationRef = (0, _native().useNavigationContainerRef)();
  (0, _react().useMemo)(() => store.initialize(context, navigationRef, options), [context]);
  useExpoRouter();
  return store;
}
//# sourceMappingURL=router-store.js.map