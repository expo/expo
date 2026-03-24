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
exports.IsFocusedContext = exports.FocusedRouteKeyContext = void 0;
exports.useIsFocused = useIsFocused;
const React = __importStar(require("react"));
const useNavigation_1 = require("./useNavigation");
exports.FocusedRouteKeyContext = React.createContext(undefined);
exports.IsFocusedContext = React.createContext(undefined);
/**
 * Hook to get the current focus state of the screen. Returns a `true` if screen is focused, otherwise `false`.
 * This can be used if a component needs to render something based on the focus state.
 */
function useIsFocused() {
    const isFocused = React.useContext(exports.IsFocusedContext);
    const navigation = (0, useNavigation_1.useNavigation)();
    const isFocusedAvailable = isFocused !== undefined;
    const subscribe = React.useCallback((callback) => {
        if (isFocusedAvailable) {
            // If `isFocused` is available in context
            // We don't need to subscribe to focus and blur events
            return () => { };
        }
        const unsubscribeFocus = navigation.addListener('focus', callback);
        const unsubscribeBlur = navigation.addListener('blur', callback);
        return () => {
            unsubscribeFocus();
            unsubscribeBlur();
        };
    }, [isFocusedAvailable, navigation]);
    // isFocused from context only works with NavigationProvider
    // So this is kept for backward compatibility
    const value = React.useSyncExternalStore(subscribe, navigation.isFocused, navigation.isFocused);
    return isFocused ?? value;
}
//# sourceMappingURL=useIsFocused.js.map