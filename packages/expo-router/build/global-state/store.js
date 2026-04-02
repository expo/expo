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
Object.defineProperty(exports, "__esModule", { value: true });
exports.store = exports.storeRef = void 0;
exports.getSplashScreenAnimationFrame = getSplashScreenAnimationFrame;
exports.setSplashScreenAnimationFrame = setSplashScreenAnimationFrame;
exports.setHasAttemptedToHideSplash = setHasAttemptedToHideSplash;
const getRouteInfoFromState_1 = require("./getRouteInfoFromState");
const routeInfoCache_1 = require("./routeInfoCache");
const href_1 = require("../link/href");
const SplashScreen = __importStar(require("../views/Splash"));
exports.storeRef = {
    current: {},
};
let splashScreenAnimationFrame;
let hasAttemptedToHideSplash = false;
function getSplashScreenAnimationFrame() {
    return splashScreenAnimationFrame;
}
function setSplashScreenAnimationFrame(value) {
    splashScreenAnimationFrame = value;
}
function setHasAttemptedToHideSplash(value) {
    hasAttemptedToHideSplash = value;
}
exports.store = {
    shouldShowTutorial() {
        return !exports.storeRef.current.routeNode && process.env.NODE_ENV === 'development';
    },
    get state() {
        return exports.storeRef.current.state;
    },
    get navigationRef() {
        return exports.storeRef.current.navigationRef;
    },
    get routeNode() {
        return exports.storeRef.current.routeNode;
    },
    getRouteInfo() {
        return exports.storeRef.current.routeInfo || getRouteInfoFromState_1.defaultRouteInfo;
    },
    get redirects() {
        return exports.storeRef.current.redirects || [];
    },
    get rootComponent() {
        return exports.storeRef.current.rootComponent;
    },
    getStateForHref(href, options) {
        href = (0, href_1.resolveHref)(href);
        href = (0, href_1.resolveHrefStringWithSegments)(href, exports.store.getRouteInfo(), options);
        return this.linking?.getStateFromPath(href, this.linking.config);
    },
    get linking() {
        return exports.storeRef.current.linking;
    },
    setFocusedState(state) {
        const routeInfo = (0, routeInfoCache_1.getCachedRouteInfo)(state);
        exports.storeRef.current.routeInfo = routeInfo;
    },
    onReady() {
        if (!hasAttemptedToHideSplash) {
            setHasAttemptedToHideSplash(true);
            // NOTE(EvanBacon): `navigationRef.isReady` is sometimes not true when state is called initially.
            setSplashScreenAnimationFrame(requestAnimationFrame(() => {
                SplashScreen._internal_maybeHideAsync?.();
            }));
        }
    },
    onStateChange(newState) {
        if (!newState) {
            return;
        }
        if (process.env.NODE_ENV === 'development') {
            let isStale = false;
            let state = newState;
            while (!isStale && state) {
                isStale = state.stale;
                state =
                    state.routes?.['index' in state && typeof state.index === 'number'
                        ? state.index
                        : state.routes.length - 1]?.state;
            }
            if (isStale) {
                // This should never happen, as onStateChange should provide a full state. However, adding this check to catch any undocumented behavior.
                console.error('Detected stale state in onStateChange. This is likely a bug in Expo Router.');
            }
        }
        exports.storeRef.current.state = newState;
        exports.storeRef.current.routeInfo = (0, routeInfoCache_1.getCachedRouteInfo)(newState);
        for (const callback of routeInfoCache_1.routeInfoSubscribers) {
            callback();
        }
    },
    assertIsReady() {
        if (!exports.storeRef.current.navigationRef.isReady()) {
            throw new Error('Attempted to navigate before mounting the Root Layout component. Ensure the Root Layout component is rendering a Slot, or other navigator on the first render.');
        }
    },
};
//# sourceMappingURL=store.js.map