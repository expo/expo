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
exports.renderRootComponent = renderRootComponent;
const expo_1 = require("expo");
const React = __importStar(require("react"));
const react_native_1 = require("react-native");
const SplashScreen = __importStar(require("./utils/splash"));
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
            SplashScreen._internal_preventAutoHideAsync?.();
        });
        React.startTransition(() => {
            if (process.env.NODE_ENV !== 'production') {
                const { withErrorOverlay } = require('@expo/metro-runtime/error-overlay');
                (0, expo_1.registerRootComponent)(withErrorOverlay(Component));
            }
            else {
                (0, expo_1.registerRootComponent)(Component);
            }
        });
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
        if (process.env.EXPO_OS === 'web') {
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
//# sourceMappingURL=renderRootComponent.js.map