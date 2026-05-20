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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validatePathConfig = exports.useStateForPath = exports.useRoute = exports.usePreventRemoveContext = exports.usePreventRemove = exports.useNavigationState = exports.useNavigationIndependentTree = exports.useNavigationContainerRef = exports.useNavigationBuilder = exports.useNavigation = exports.useIsFocused = exports.useFocusEffect = exports.useTheme = exports.ThemeProvider = exports.ThemeContext = exports.createPathConfigForStaticNavigation = exports.createComponentForStaticNavigation = exports.PreventRemoveProvider = exports.PreventRemoveContext = exports.NavigationRouteContext = exports.NavigationProvider = exports.NavigationMetaContext = exports.NavigationIndependentTree = exports.NavigationHelpersContext = exports.NavigationContext = exports.NavigationContainerRefContext = exports.getStateFromPath = exports.getPathFromState = exports.getFocusedRouteNameFromRoute = exports.getActionFromState = exports.findFocusedRoute = exports.CurrentRenderContext = exports.createNavigatorFactory = exports.createNavigationContainerRef = exports.BaseNavigationContainer = void 0;
/**
 * @deprecated `ExpoRoot` mounts the navigation container automatically — there is no need
 * to render `BaseNavigationContainer` directly. Will be removed in a future SDK.
 */
var BaseNavigationContainer_1 = require("./BaseNavigationContainer");
Object.defineProperty(exports, "BaseNavigationContainer", { enumerable: true, get: function () { return BaseNavigationContainer_1.BaseNavigationContainer; } });
var createNavigationContainerRef_1 = require("./createNavigationContainerRef");
Object.defineProperty(exports, "createNavigationContainerRef", { enumerable: true, get: function () { return createNavigationContainerRef_1.createNavigationContainerRef; } });
var createNavigatorFactory_1 = require("./createNavigatorFactory");
Object.defineProperty(exports, "createNavigatorFactory", { enumerable: true, get: function () { return createNavigatorFactory_1.createNavigatorFactory; } });
/**
 * @deprecated Will be removed in a future SDK.
 */
var CurrentRenderContext_1 = require("./CurrentRenderContext");
Object.defineProperty(exports, "CurrentRenderContext", { enumerable: true, get: function () { return CurrentRenderContext_1.CurrentRenderContext; } });
/**
 * @deprecated Will be removed in a future SDK.
 */
var findFocusedRoute_1 = require("./findFocusedRoute");
Object.defineProperty(exports, "findFocusedRoute", { enumerable: true, get: function () { return findFocusedRoute_1.findFocusedRoute; } });
/**
 * @deprecated Will be removed in a future SDK.
 */
var getActionFromState_1 = require("./getActionFromState");
Object.defineProperty(exports, "getActionFromState", { enumerable: true, get: function () { return getActionFromState_1.getActionFromState; } });
/**
 * @deprecated Will be removed in a future SDK.
 */
var getFocusedRouteNameFromRoute_1 = require("./getFocusedRouteNameFromRoute");
Object.defineProperty(exports, "getFocusedRouteNameFromRoute", { enumerable: true, get: function () { return getFocusedRouteNameFromRoute_1.getFocusedRouteNameFromRoute; } });
/**
 * @deprecated Will be removed in a future SDK.
 */
var getPathFromState_1 = require("./getPathFromState");
Object.defineProperty(exports, "getPathFromState", { enumerable: true, get: function () { return getPathFromState_1.getPathFromState; } });
/**
 * @deprecated Will be removed in a future SDK.
 */
var getStateFromPath_1 = require("./getStateFromPath");
Object.defineProperty(exports, "getStateFromPath", { enumerable: true, get: function () { return getStateFromPath_1.getStateFromPath; } });
/**
 * @deprecated Will be removed in a future SDK.
 */
var NavigationContainerRefContext_1 = require("./NavigationContainerRefContext");
Object.defineProperty(exports, "NavigationContainerRefContext", { enumerable: true, get: function () { return NavigationContainerRefContext_1.NavigationContainerRefContext; } });
/**
 * @deprecated Will be removed in a future SDK.
 */
var NavigationContext_1 = require("./NavigationContext");
Object.defineProperty(exports, "NavigationContext", { enumerable: true, get: function () { return NavigationContext_1.NavigationContext; } });
/**
 * @deprecated Will be removed in a future SDK.
 */
var NavigationHelpersContext_1 = require("./NavigationHelpersContext");
Object.defineProperty(exports, "NavigationHelpersContext", { enumerable: true, get: function () { return NavigationHelpersContext_1.NavigationHelpersContext; } });
var NavigationIndependentTree_1 = require("./NavigationIndependentTree");
Object.defineProperty(exports, "NavigationIndependentTree", { enumerable: true, get: function () { return NavigationIndependentTree_1.NavigationIndependentTree; } });
/**
 * @deprecated Will be removed in a future SDK.
 */
var NavigationMetaContext_1 = require("./NavigationMetaContext");
Object.defineProperty(exports, "NavigationMetaContext", { enumerable: true, get: function () { return NavigationMetaContext_1.NavigationMetaContext; } });
var NavigationProvider_1 = require("./NavigationProvider");
Object.defineProperty(exports, "NavigationProvider", { enumerable: true, get: function () { return NavigationProvider_1.NavigationProvider; } });
/**
 * @deprecated Will be removed in a future SDK.
 */
var NavigationProvider_2 = require("./NavigationProvider");
Object.defineProperty(exports, "NavigationRouteContext", { enumerable: true, get: function () { return NavigationProvider_2.NavigationRouteContext; } });
var PreventRemoveContext_1 = require("./PreventRemoveContext");
Object.defineProperty(exports, "PreventRemoveContext", { enumerable: true, get: function () { return PreventRemoveContext_1.PreventRemoveContext; } });
var PreventRemoveProvider_1 = require("./PreventRemoveProvider");
Object.defineProperty(exports, "PreventRemoveProvider", { enumerable: true, get: function () { return PreventRemoveProvider_1.PreventRemoveProvider; } });
var StaticNavigation_1 = require("./StaticNavigation");
/**
 * @deprecated Expo Router builds components from the file-based route tree. Will be removed in a future SDK.
 */
Object.defineProperty(exports, "createComponentForStaticNavigation", { enumerable: true, get: function () { return StaticNavigation_1.createComponentForStaticNavigation; } });
/**
 * @deprecated Expo Router generates path config from the file-based route tree. Will be removed in a future SDK.
 */
Object.defineProperty(exports, "createPathConfigForStaticNavigation", { enumerable: true, get: function () { return StaticNavigation_1.createPathConfigForStaticNavigation; } });
/**
 * @deprecated Will be removed in a future SDK.
 */
var ThemeContext_1 = require("./theming/ThemeContext");
Object.defineProperty(exports, "ThemeContext", { enumerable: true, get: function () { return ThemeContext_1.ThemeContext; } });
/**
 * @deprecated Import `ThemeProvider` from `expo-router` instead. Will be removed in a future SDK.
 */
var ThemeProvider_1 = require("./theming/ThemeProvider");
Object.defineProperty(exports, "ThemeProvider", { enumerable: true, get: function () { return ThemeProvider_1.ThemeProvider; } });
/**
 * @deprecated Import `useTheme` from `expo-router` instead. Will be removed in a future SDK.
 */
var useTheme_1 = require("./theming/useTheme");
Object.defineProperty(exports, "useTheme", { enumerable: true, get: function () { return useTheme_1.useTheme; } });
__exportStar(require("./types"), exports);
/**
 * @deprecated Import `useFocusEffect` from `expo-router` instead — it is typed for the
 * Expo Router route tree. Will be removed in a future SDK.
 */
var useFocusEffect_1 = require("./useFocusEffect");
Object.defineProperty(exports, "useFocusEffect", { enumerable: true, get: function () { return useFocusEffect_1.useFocusEffect; } });
/**
 * @deprecated Import `useIsFocused` from `expo-router` instead. Will be removed in a future SDK.
 */
var useIsFocused_1 = require("./useIsFocused");
Object.defineProperty(exports, "useIsFocused", { enumerable: true, get: function () { return useIsFocused_1.useIsFocused; } });
/**
 * @deprecated Import `useNavigation` from `expo-router` instead. Will be removed in a future SDK.
 */
var useNavigation_1 = require("./useNavigation");
Object.defineProperty(exports, "useNavigation", { enumerable: true, get: function () { return useNavigation_1.useNavigation; } });
var useNavigationBuilder_1 = require("./useNavigationBuilder");
Object.defineProperty(exports, "useNavigationBuilder", { enumerable: true, get: function () { return useNavigationBuilder_1.useNavigationBuilder; } });
/**
 * @deprecated Import `useNavigationContainerRef` from `expo-router` instead. Will be removed in a future SDK.
 */
var useNavigationContainerRef_1 = require("./useNavigationContainerRef");
Object.defineProperty(exports, "useNavigationContainerRef", { enumerable: true, get: function () { return useNavigationContainerRef_1.useNavigationContainerRef; } });
var useNavigationIndependentTree_1 = require("./useNavigationIndependentTree");
Object.defineProperty(exports, "useNavigationIndependentTree", { enumerable: true, get: function () { return useNavigationIndependentTree_1.useNavigationIndependentTree; } });
var useNavigationState_1 = require("./useNavigationState");
Object.defineProperty(exports, "useNavigationState", { enumerable: true, get: function () { return useNavigationState_1.useNavigationState; } });
var usePreventRemove_1 = require("./usePreventRemove");
Object.defineProperty(exports, "usePreventRemove", { enumerable: true, get: function () { return usePreventRemove_1.usePreventRemove; } });
var usePreventRemoveContext_1 = require("./usePreventRemoveContext");
Object.defineProperty(exports, "usePreventRemoveContext", { enumerable: true, get: function () { return usePreventRemoveContext_1.usePreventRemoveContext; } });
/**
 * @deprecated Import `useRoute` from `expo-router` instead. Will be removed in a future SDK.
 */
var useRoute_1 = require("./useRoute");
Object.defineProperty(exports, "useRoute", { enumerable: true, get: function () { return useRoute_1.useRoute; } });
var useStateForPath_1 = require("./useStateForPath");
Object.defineProperty(exports, "useStateForPath", { enumerable: true, get: function () { return useStateForPath_1.useStateForPath; } });
/**
 * @deprecated Will be removed in a future SDK.
 */
var validatePathConfig_1 = require("./validatePathConfig");
Object.defineProperty(exports, "validatePathConfig", { enumerable: true, get: function () { return validatePathConfig_1.validatePathConfig; } });
__exportStar(require("../routers"), exports);
//# sourceMappingURL=index.js.map