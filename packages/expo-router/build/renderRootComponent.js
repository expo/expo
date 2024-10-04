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
exports.renderRootComponent = void 0;
const expo_1 = require("expo");
const SplashScreen = __importStar(require("expo-splash-screen"));
const react_1 = __importDefault(require("react"));
const react_native_1 = require("react-native");
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
    return (error &&
        typeof error === 'object' &&
        typeof error.name === 'string' &&
        typeof error.message === 'string');
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
            SplashScreen._internal_preventAutoHideAsync?.();
        });
        if (process.env.NODE_ENV !== 'production') {
            const { withErrorOverlay } = require('@expo/metro-runtime/error-overlay');
            (0, expo_1.registerRootComponent)(withErrorOverlay(Component));
        }
        else {
            (0, expo_1.registerRootComponent)(Component);
        }
    }
    catch (e) {
        // Hide the splash screen if there was an error so the user can see it.
        SplashScreen.hideAsync();
        const error = convertError(e);
        // Prevent the app from throwing confusing:
        //  ERROR  Invariant Violation: "main" has not been registered. This can happen if:
        // * Metro (the local dev server) is run from the wrong folder. Check if Metro is running, stop it and restart it in the current project.
        // * A module failed to load due to an error and `AppRegistry.registerComponent` wasn't called.
        (0, expo_1.registerRootComponent)(() => <react_native_1.View />);
        // Console is pretty useless on native, on web you get interactive stack traces.
        if (react_native_1.Platform.OS === 'web') {
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
exports.renderRootComponent = renderRootComponent;
//# sourceMappingURL=renderRootComponent.js.map