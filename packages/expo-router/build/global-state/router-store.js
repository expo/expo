"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useInitializeExpoRouter = exports.useStoreRouteInfo = exports.useStoreRootState = exports.useExpoRouter = exports.store = exports.RouterStore = void 0;
const native_1 = require("@react-navigation/native");
const SplashScreen = __importStar(require("expo-splash-screen"));
const react_1 = require("react");
const routing_1 = require("./routing");
const sort_routes_1 = require("./sort-routes");
const LocationProvider_1 = require("../LocationProvider");
const getPathFromState_1 = require("../fork/getPathFromState");
const getLinkingConfig_1 = require("../getLinkingConfig");
const getRoutes_1 = require("../getRoutes");
const useScreens_1 = require("../useScreens");
/**
 * This is the global state for the router. It is used to keep track of the current route, and to provide a way to navigate to other routes.
 *
 * There should only be one instance of this class and be initialized via `useInitializeExpoRouter`
 */
class RouterStore {
    routeNode;
    rootComponent;
    linking;
    hasAttemptedToHideSplash = false;
    initialState;
    rootState;
    nextState;
    routeInfo;
    navigationRef;
    navigationRefSubscription;
    rootStateSubscribers = new Set();
    storeSubscribers = new Set();
    linkTo = routing_1.linkTo.bind(this);
    getSortedRoutes = sort_routes_1.getSortedRoutes.bind(this);
    goBack = routing_1.goBack.bind(this);
    canGoBack = routing_1.canGoBack.bind(this);
    push = routing_1.push.bind(this);
    dismiss = routing_1.dismiss.bind(this);
    replace = routing_1.replace.bind(this);
    dismissAll = routing_1.dismissAll.bind(this);
    canDismiss = routing_1.canDismiss.bind(this);
    setParams = routing_1.setParams.bind(this);
    navigate = routing_1.navigate.bind(this);
    initialize(context, navigationRef, initialLocation) {
        // Clean up any previous state
        this.initialState = undefined;
        this.rootState = undefined;
        this.nextState = undefined;
        this.routeInfo = undefined;
        this.linking = undefined;
        this.navigationRefSubscription?.();
        this.rootStateSubscribers.clear();
        this.storeSubscribers.clear();
        this.routeNode = (0, getRoutes_1.getRoutes)(context, { ignoreEntryPoints: true });
        this.rootComponent = this.routeNode ? (0, useScreens_1.getQualifiedRouteComponent)(this.routeNode) : react_1.Fragment;
        // Only error in production, in development we will show the onboarding screen
        if (!this.routeNode && process.env.NODE_ENV === 'production') {
            throw new Error('No routes found');
        }
        this.navigationRef = navigationRef;
        if (this.routeNode) {
            this.linking = (0, getLinkingConfig_1.getLinkingConfig)(this.routeNode);
            if (initialLocation) {
                this.linking.getInitialURL = () => initialLocation.toString();
                this.initialState = this.linking.getStateFromPath?.(initialLocation.pathname + initialLocation.search, this.linking.config);
            }
        }
        // There is no routeNode, so we will be showing the onboarding screen
        // In the meantime, just mock the routeInfo
        if (this.initialState) {
            this.rootState = this.initialState;
            this.routeInfo = this.getRouteInfo(this.initialState);
        }
        else {
            this.routeInfo = {
                unstable_globalHref: '',
                pathname: '',
                isIndex: false,
                params: {},
                segments: [],
            };
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
        this.navigationRefSubscription = navigationRef.addListener('state', (data) => {
            const state = data.data.state;
            if (!this.hasAttemptedToHideSplash) {
                this.hasAttemptedToHideSplash = true;
                // NOTE(EvanBacon): `navigationRef.isReady` is sometimes not true when state is called initially.
                requestAnimationFrame(() => 
                // @ts-expect-error: This function is native-only and for internal-use only.
                SplashScreen._internal_maybeHideAsync?.());
            }
            let shouldUpdateSubscribers = this.nextState === state;
            this.nextState = undefined;
            // This can sometimes be undefined when an error is thrown in the Root Layout Route.
            // Additionally that state may already equal the rootState if it was updated within a hook
            if (state && state !== this.rootState) {
                exports.store.updateState(state, undefined);
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
        exports.store.rootState = state;
        exports.store.nextState = nextState;
        const nextRouteInfo = exports.store.getRouteInfo(state);
        if (!(0, getPathFromState_1.deepEqual)(this.routeInfo, nextRouteInfo)) {
            exports.store.routeInfo = nextRouteInfo;
        }
    }
    getRouteInfo(state) {
        return (0, LocationProvider_1.getRouteInfoFromState)((state, asPath) => {
            return (0, getPathFromState_1.getPathDataFromState)(state, {
                screens: [],
                ...this.linking?.config,
                preserveDynamicRoutes: asPath,
                preserveGroups: asPath,
            });
        }, state);
    }
    // This is only used in development, to show the onboarding screen
    // In production we should have errored during the initialization
    shouldShowTutorial() {
        return !this.routeNode && process.env.NODE_ENV === 'development';
    }
    /** Make sure these are arrow functions so `this` is correctly bound */
    subscribeToRootState = (subscriber) => {
        this.rootStateSubscribers.add(subscriber);
        return () => this.rootStateSubscribers.delete(subscriber);
    };
    subscribeToStore = (subscriber) => {
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
}
exports.RouterStore = RouterStore;
exports.store = new RouterStore();
function useExpoRouter() {
    return (0, react_1.useSyncExternalStore)(exports.store.subscribeToStore, exports.store.snapshot, exports.store.snapshot);
}
exports.useExpoRouter = useExpoRouter;
function syncStoreRootState() {
    if (exports.store.navigationRef.isReady()) {
        const currentState = exports.store.navigationRef.getRootState();
        if (exports.store.rootState !== currentState) {
            exports.store.updateState(currentState);
        }
    }
}
function useStoreRootState() {
    syncStoreRootState();
    return (0, react_1.useSyncExternalStore)(exports.store.subscribeToRootState, exports.store.rootStateSnapshot, exports.store.rootStateSnapshot);
}
exports.useStoreRootState = useStoreRootState;
function useStoreRouteInfo() {
    syncStoreRootState();
    return (0, react_1.useSyncExternalStore)(exports.store.subscribeToRootState, exports.store.routeInfoSnapshot, exports.store.routeInfoSnapshot);
}
exports.useStoreRouteInfo = useStoreRouteInfo;
function useInitializeExpoRouter(context, initialLocation) {
    const navigationRef = (0, native_1.useNavigationContainerRef)();
    (0, react_1.useMemo)(() => exports.store.initialize(context, navigationRef, initialLocation), [context, initialLocation]);
    useExpoRouter();
    return exports.store;
}
exports.useInitializeExpoRouter = useInitializeExpoRouter;
//# sourceMappingURL=router-store.js.map