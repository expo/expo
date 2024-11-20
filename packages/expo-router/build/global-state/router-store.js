'use client';
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useInitializeExpoRouter = exports.useStoreRouteInfo = exports.useStoreRootState = exports.useExpoRouter = exports.store = exports.RouterStore = void 0;
const native_1 = require("@react-navigation/native");
const expo_constants_1 = __importDefault(require("expo-constants"));
const fast_deep_equal_1 = __importDefault(require("fast-deep-equal"));
const react_1 = require("react");
const react_native_1 = require("react-native");
const routing_1 = require("./routing");
const sort_routes_1 = require("./sort-routes");
const LocationProvider_1 = require("../LocationProvider");
const getPathFromState_1 = require("../fork/getPathFromState");
// import { ResultState } from '../fork/getStateFromPath';
const getLinkingConfig_1 = require("../getLinkingConfig");
const getRoutes_1 = require("../getRoutes");
const useScreens_1 = require("../useScreens");
const SplashScreen = __importStar(require("../views/Splash"));
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
    splashScreenAnimationFrame;
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
    dismissTo = routing_1.dismissTo.bind(this);
    replace = routing_1.replace.bind(this);
    dismissAll = routing_1.dismissAll.bind(this);
    canDismiss = routing_1.canDismiss.bind(this);
    setParams = routing_1.setParams.bind(this);
    navigate = routing_1.navigate.bind(this);
    reload = routing_1.reload.bind(this);
    initialize(context, navigationRef, linkingConfigOptions = {}) {
        // Clean up any previous state
        this.initialState = undefined;
        this.rootState = undefined;
        this.nextState = undefined;
        this.linking = undefined;
        this.navigationRefSubscription?.();
        this.rootStateSubscribers.clear();
        this.storeSubscribers.clear();
        this.routeNode = (0, getRoutes_1.getRoutes)(context, {
            ...expo_constants_1.default.expoConfig?.extra?.router,
            ignoreEntryPoints: true,
            platform: react_native_1.Platform.OS,
        });
        // We always needs routeInfo, even if there are no routes. This can happen if:
        //  - there are no routes (we are showing the onboarding screen)
        //  - getInitialURL() is async
        this.routeInfo = {
            unstable_globalHref: '',
            pathname: '',
            isIndex: false,
            params: {},
            segments: [],
        };
        if (this.routeNode) {
            // We have routes, so get the linking config and the root component
            this.linking = (0, getLinkingConfig_1.getLinkingConfig)(this, this.routeNode, context, linkingConfigOptions);
            this.rootComponent = (0, useScreens_1.getQualifiedRouteComponent)(this.routeNode);
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
        }
        else {
            // Only error in production, in development we will show the onboarding screen
            if (process.env.NODE_ENV === 'production') {
                throw new Error('No routes found');
            }
            // In development, we will show the onboarding screen
            this.rootComponent = react_1.Fragment;
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
        this.navigationRefSubscription = navigationRef.addListener('state', (data) => {
            const state = data.data.state;
            if (!this.hasAttemptedToHideSplash) {
                this.hasAttemptedToHideSplash = true;
                // NOTE(EvanBacon): `navigationRef.isReady` is sometimes not true when state is called initially.
                this.splashScreenAnimationFrame = requestAnimationFrame(() => {
                    SplashScreen._internal_maybeHideAsync?.();
                });
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
        if (!(0, fast_deep_equal_1.default)(this.routeInfo, nextRouteInfo)) {
            exports.store.routeInfo = nextRouteInfo;
        }
    }
    getRouteInfo(state) {
        return (0, LocationProvider_1.getRouteInfoFromState)((state, asPath) => {
            return (0, getPathFromState_1.getPathDataFromState)(state, {
                screens: {},
                ...this.linking?.config,
                preserveDynamicRoutes: asPath,
                preserveGroups: asPath,
                shouldEncodeURISegment: false,
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
    cleanup() {
        if (this.splashScreenAnimationFrame) {
            cancelAnimationFrame(this.splashScreenAnimationFrame);
        }
    }
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
function useInitializeExpoRouter(context, options) {
    const navigationRef = (0, native_1.useNavigationContainerRef)();
    (0, react_1.useMemo)(() => exports.store.initialize(context, navigationRef, options), [context]);
    useExpoRouter();
    return exports.store;
}
exports.useInitializeExpoRouter = useInitializeExpoRouter;
//# sourceMappingURL=router-store.js.map