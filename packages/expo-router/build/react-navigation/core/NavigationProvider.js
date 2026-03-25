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
exports.NamedRouteContextListContext = exports.NavigationRouteContext = void 0;
exports.NavigationProvider = NavigationProvider;
const React = __importStar(require("react"));
const NavigationContext_1 = require("./NavigationContext");
const useIsFocused_1 = require("./useIsFocused");
/**
 * Context which holds the route prop for a screen.
 */
exports.NavigationRouteContext = React.createContext(undefined);
/**
 * Component to provide the navigation and route contexts to its children.
 */
exports.NamedRouteContextListContext = React.createContext(undefined);
function NavigationProvider({ route, navigation, children }) {
    const parentIsFocused = React.useContext(useIsFocused_1.IsFocusedContext);
    const focusedRouteKey = React.useContext(useIsFocused_1.FocusedRouteKeyContext);
    // Mark route as focused only if:
    // - It doesn't have a parent navigator
    // - Parent navigator is focused
    const isFocused = parentIsFocused == null || parentIsFocused ? focusedRouteKey === route.key : false;
    return (<exports.NavigationRouteContext.Provider value={route}>
      <NavigationContext_1.NavigationContext.Provider value={navigation}>
        <useIsFocused_1.IsFocusedContext.Provider value={isFocused}>{children}</useIsFocused_1.IsFocusedContext.Provider>
      </NavigationContext_1.NavigationContext.Provider>
    </exports.NavigationRouteContext.Provider>);
}
//# sourceMappingURL=NavigationProvider.js.map