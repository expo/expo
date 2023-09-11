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
exports._internal_maybeHideAsync = exports._internal_preventAutoHideAsync = exports.SplashScreen = void 0;
const SplashModule = __importStar(require("expo-splash-screen"));
const non_secure_1 = require("nanoid/non-secure");
const React = __importStar(require("react"));
const react_native_1 = require("react-native");
const useDeprecated_1 = require("../useDeprecated");
const globalStack = [];
/**
 * A stack based component for keeping the splash screen visible.
 * Useful for stacked requests that need to be completed before the app is ready.
 * After all instances have been unmounted, the splash screen will be hidden.
 *
 * @example
 * ```tsx
 * function App() {
 *   const [isLoading, setIsLoading] = React.useState(true);
 *
 *   if (isLoading) {
 *     return <SplashScreen />
 *   }
 *
 *   return <Text>Ready!</Text>
 * }
 * ```
 */
function SplashScreen() {
    useGlobalSplash();
    (0, useDeprecated_1.useDeprecated)('The <SplashScreen /> component is deprecated. Use `SplashScreen.preventAutoHideAsync()` and `SplashScreen.hideAsync` from `expo-router` instead.');
    return null;
}
exports.SplashScreen = SplashScreen;
function useGlobalSplash() {
    const stack = React.useRef(null);
    React.useEffect(() => {
        // Create a stack entry on component mount
        stack.current = SplashScreen._pushEntry();
        return () => {
            if (stack.current) {
                // Update on component unmount
                SplashScreen._popEntry(stack.current);
            }
        };
    }, []);
}
SplashScreen.hideAsync = () => {
    forceHideAsync();
    globalStack.length = 0;
};
let _userControlledAutoHideEnabled = false;
let _preventAutoHideAsyncInvoked = false;
// Expo Router uses this internal method to ensure that we can detect if the user
// has explicitly opted into preventing the splash screen from hiding. This means
// they will also explicitly hide it. If they don't, we will hide it for them after
// the navigation render completes.
const _internal_preventAutoHideAsync = () => {
    // Memoize, this should only be called once.
    if (_preventAutoHideAsyncInvoked) {
        return;
    }
    _preventAutoHideAsyncInvoked = true;
    // Append error handling to ensure any uncaught exceptions result in the splash screen being hidden.
    if (react_native_1.Platform.OS !== 'web' && ErrorUtils?.getGlobalHandler) {
        const originalHandler = ErrorUtils.getGlobalHandler();
        ErrorUtils.setGlobalHandler((error, isFatal) => {
            SplashScreen.hideAsync();
            originalHandler(error, isFatal);
        });
    }
    SplashModule.preventAutoHideAsync();
};
exports._internal_preventAutoHideAsync = _internal_preventAutoHideAsync;
const _internal_maybeHideAsync = () => {
    // If the user has explicitly opted into preventing the splash screen from hiding,
    // we should not hide it for them. This is often used for animated splash screens.
    if (_userControlledAutoHideEnabled) {
        return;
    }
    SplashScreen.hideAsync();
};
exports._internal_maybeHideAsync = _internal_maybeHideAsync;
async function forceHideAsync() {
    return SplashModule.hideAsync().catch((error) => {
        // Hide this very unfortunate error.
        if (
        // Only throw the error is something unexpected happened.
        _preventAutoHideAsyncInvoked &&
            error.message.includes('No native splash screen registered for ')) {
            return;
        }
        throw error;
    });
}
SplashScreen.preventAutoHideAsync = () => {
    _userControlledAutoHideEnabled = true;
    (0, exports._internal_preventAutoHideAsync)();
};
SplashScreen._pushEntry = () => {
    const entry = (0, non_secure_1.nanoid)();
    globalStack.push(entry);
    SplashScreen.preventAutoHideAsync();
    return entry;
};
SplashScreen._popEntry = (entry) => {
    const index = globalStack.indexOf(entry);
    if (index !== -1) {
        globalStack.splice(index, 1);
    }
    if (globalStack.length === 0) {
        SplashScreen.hideAsync();
    }
};
// TODO: Add some detection for if the splash screen is visible
//# sourceMappingURL=Splash.js.map