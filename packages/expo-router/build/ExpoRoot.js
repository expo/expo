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
exports.ExpoRoot = void 0;
const expo_constants_1 = __importDefault(require("expo-constants"));
const expo_status_bar_1 = require("expo-status-bar");
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const react_native_safe_area_context_1 = require("react-native-safe-area-context");
const NavigationContainer_1 = __importDefault(require("./fork/NavigationContainer"));
const router_store_1 = require("./global-state/router-store");
const Splash_1 = require("./views/Splash");
const isTestEnv = process.env.NODE_ENV === 'test';
const INITIAL_METRICS = react_native_1.Platform.OS === 'web' || isTestEnv
    ? {
        frame: { x: 0, y: 0, width: 0, height: 0 },
        insets: { top: 0, left: 0, right: 0, bottom: 0 },
    }
    : undefined;
const hasViewControllerBasedStatusBarAppearance = react_native_1.Platform.OS === 'ios' &&
    !!expo_constants_1.default.expoConfig?.ios?.infoPlist?.UIViewControllerBasedStatusBarAppearance;
function ExpoRoot({ wrapper: ParentWrapper = react_1.Fragment, ...props }) {
    /*
     * Due to static rendering we need to wrap these top level views in second wrapper
     * View's like <SafeAreaProvider /> generate a <div> so if the parent wrapper
     * is a HTML document, we need to ensure its inside the <body>
     */
    const wrapper = ({ children }) => {
        return (react_1.default.createElement(ParentWrapper, null,
            react_1.default.createElement(react_native_safe_area_context_1.SafeAreaProvider
            // SSR support
            , { 
                // SSR support
                initialMetrics: INITIAL_METRICS },
                children,
                !hasViewControllerBasedStatusBarAppearance && react_1.default.createElement(expo_status_bar_1.StatusBar, { style: "auto" }))));
    };
    return react_1.default.createElement(ContextNavigator, { ...props, wrapper: wrapper });
}
exports.ExpoRoot = ExpoRoot;
const initialUrl = react_native_1.Platform.OS === 'web' && typeof window !== 'undefined'
    ? new URL(window.location.href)
    : undefined;
function ContextNavigator({ context, location: initialLocation = initialUrl, wrapper: WrapperComponent = react_1.Fragment, }) {
    const store = (0, router_store_1.useInitializeExpoRouter)(context, initialLocation);
    if (store.shouldShowTutorial()) {
        Splash_1.SplashScreen.hideAsync();
        if (process.env.NODE_ENV === 'development') {
            const Tutorial = require('./onboard/Tutorial').Tutorial;
            return (react_1.default.createElement(WrapperComponent, null,
                react_1.default.createElement(Tutorial, null)));
        }
        else {
            // Ensure tutorial styles are stripped in production.
            return null;
        }
    }
    const Component = store.rootComponent;
    return (react_1.default.createElement(NavigationContainer_1.default, { ref: store.navigationRef, initialState: store.initialState, linking: store.linking, documentTitle: {
            enabled: false,
        } },
        react_1.default.createElement(WrapperComponent, null,
            react_1.default.createElement(Component, null))));
}
//# sourceMappingURL=ExpoRoot.js.map