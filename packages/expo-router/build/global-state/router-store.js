"use strict";
'use client';
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
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.store = void 0;
exports.useStore = useStore;
exports.useRouteInfo = useRouteInfo;
const native_1 = require("@react-navigation/native");
const expo_constants_1 = __importDefault(require("expo-constants"));
const react_1 = require("react");
const react_native_1 = require("react-native");
const getStateFromPath_forks_1 = require("../fork/getStateFromPath-forks");
const getLinkingConfig_1 = require("../getLinkingConfig");
const getReactNavigationConfig_1 = require("../getReactNavigationConfig");
const getRoutes_1 = require("../getRoutes");
const routeInfo_1 = require("./routeInfo");
const useScreens_1 = require("../useScreens");
const url_1 = require("../utils/url");
const SplashScreen = __importStar(require("../views/Splash"));
const storeRef = {
    current: {},
};
const routeInfoCache = new WeakMap();
let splashScreenAnimationFrame;
let hasAttemptedToHideSplash = false;
exports.store = {
    shouldShowTutorial() {
        return !storeRef.current.routeNode && process.env.NODE_ENV === 'development';
    },
    get state() {
        return storeRef.current.state;
    },
    get navigationRef() {
        return storeRef.current.navigationRef;
    },
    get routeNode() {
        return storeRef.current.routeNode;
    },
    getRouteInfo() {
        return storeRef.current.routeInfo || routeInfo_1.defaultRouteInfo;
    },
    get redirects() {
        return storeRef.current.redirects || [];
    },
    get rootComponent() {
        return storeRef.current.rootComponent;
    },
    get linking() {
        return storeRef.current.linking;
    },
    setFocusedState(state) {
        const routeInfo = getCachedRouteInfo(state);
        storeRef.current.routeInfo = routeInfo;
    },
    onReady() {
        if (!hasAttemptedToHideSplash) {
            hasAttemptedToHideSplash = true;
            // NOTE(EvanBacon): `navigationRef.isReady` is sometimes not true when state is called initially.
            splashScreenAnimationFrame = requestAnimationFrame(() => {
                SplashScreen._internal_maybeHideAsync?.();
            });
        }
        storeRef.current.navigationRef.addListener('state', (e) => {
            if (!e.data.state) {
                return;
            }
            let isStale = false;
            let state = e.data.state;
            while (!isStale && state) {
                isStale = state.stale;
                state =
                    state.routes?.['index' in state && typeof state.index === 'number'
                        ? state.index
                        : state.routes.length - 1]?.state;
            }
            storeRef.current.state = e.data.state;
            if (!isStale) {
                storeRef.current.routeInfo = getCachedRouteInfo(e.data.state);
            }
            for (const callback of routeInfoSubscribers) {
                callback();
            }
        });
    },
    assertIsReady() {
        if (!storeRef.current.navigationRef.isReady()) {
            throw new Error('Attempted to navigate before mounting the Root Layout component. Ensure the Root Layout component is rendering a Slot, or other navigator on the first render.');
        }
    },
};
function useStore(context, linkingConfigOptions, serverUrl) {
    const navigationRef = (0, native_1.useNavigationContainerRef)();
    const config = expo_constants_1.default.expoConfig?.extra?.router;
    let linking;
    let rootComponent = react_1.Fragment;
    let initialState;
    const routeNode = (0, getRoutes_1.getRoutes)(context, {
        ...config,
        ignoreEntryPoints: true,
        platform: react_native_1.Platform.OS,
    });
    const redirects = [config?.redirects, config?.rewrites]
        .filter(Boolean)
        .flat()
        .map((route) => {
        return [
            (0, getStateFromPath_forks_1.routePatternToRegex)((0, getReactNavigationConfig_1.parseRouteSegments)(route.source)),
            route,
            (0, url_1.shouldLinkExternally)(route.destination),
        ];
    });
    if (routeNode) {
        // We have routes, so get the linking config and the root component
        linking = (0, getLinkingConfig_1.getLinkingConfig)(routeNode, context, () => exports.store.getRouteInfo(), {
            metaOnly: linkingConfigOptions.metaOnly,
            serverUrl,
            redirects,
        });
        rootComponent = (0, useScreens_1.getQualifiedRouteComponent)(routeNode);
        // By default React Navigation is async and does not render anything in the first pass as it waits for `getInitialURL`
        // This will cause static rendering to fail, which once performs a single pass.
        // If the initialURL is a string, we can prefetch the state and routeInfo, skipping React Navigation's async behavior.
        const initialURL = linking?.getInitialURL?.();
        if (typeof initialURL === 'string') {
            initialState = linking.getStateFromPath(initialURL, linking.config);
            const initialRouteInfo = (0, routeInfo_1.getRouteInfoFromState)(initialState);
            routeInfoCache.set(initialState, initialRouteInfo);
        }
    }
    else {
        // Only error in production, in development we will show the onboarding screen
        if (process.env.NODE_ENV === 'production') {
            throw new Error('No routes found');
        }
        // In development, we will show the onboarding screen
        rootComponent = react_1.Fragment;
    }
    storeRef.current = {
        navigationRef,
        routeNode,
        config,
        rootComponent,
        linking,
        redirects,
        state: initialState,
    };
    if (initialState) {
        storeRef.current.routeInfo = getCachedRouteInfo(initialState);
    }
    (0, react_1.useEffect)(() => {
        return () => {
            // listener();
            if (splashScreenAnimationFrame) {
                cancelAnimationFrame(splashScreenAnimationFrame);
                splashScreenAnimationFrame = undefined;
            }
        };
    });
    return exports.store;
}
const routeInfoSubscribers = new Set();
const routeInfoSubscribe = (callback) => {
    routeInfoSubscribers.add(callback);
    return () => {
        routeInfoSubscribers.delete(callback);
    };
};
function useRouteInfo() {
    return (0, react_1.useSyncExternalStore)(routeInfoSubscribe, exports.store.getRouteInfo, exports.store.getRouteInfo);
}
function getCachedRouteInfo(state) {
    let routeInfo = routeInfoCache.get(state);
    if (!routeInfo) {
        routeInfo = (0, routeInfo_1.getRouteInfoFromState)(state);
        const previousRouteInfo = storeRef.current.routeInfo;
        if (previousRouteInfo) {
            const areEqual = routeInfo.segments.length === previousRouteInfo.segments.length &&
                routeInfo.segments.every((segment, index) => previousRouteInfo.segments[index] === segment) &&
                routeInfo.pathnameWithParams === previousRouteInfo.pathnameWithParams;
            if (areEqual) {
                // If they are equal, keep the previous route info for object reference equality
                routeInfo = previousRouteInfo;
            }
        }
        routeInfoCache.set(state, routeInfo);
    }
    return routeInfo;
}
//# sourceMappingURL=router-store.js.map