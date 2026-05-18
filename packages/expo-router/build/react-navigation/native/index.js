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
exports.useScrollToTop = exports.useRoutePath = exports.useLocale = exports.useLinkTo = exports.useLinkProps = exports.useLinkBuilder = exports.UNSTABLE_UnhandledLinkingContext = exports.DefaultTheme = exports.DarkTheme = exports.ServerContainer = exports.NavigationContainer = exports.LocaleDirContext = exports.LinkingContext = exports.Link = exports.createStaticNavigation = void 0;
/**
 * @deprecated Will be removed in a future SDK.
 */
var createStaticNavigation_1 = require("./createStaticNavigation");
Object.defineProperty(exports, "createStaticNavigation", { enumerable: true, get: function () { return createStaticNavigation_1.createStaticNavigation; } });
/**
 * @deprecated Use `Link` from `expo-router` instead. Will be removed in a future SDK.
 */
var Link_1 = require("./Link");
Object.defineProperty(exports, "Link", { enumerable: true, get: function () { return Link_1.Link; } });
var LinkingContext_1 = require("./LinkingContext");
Object.defineProperty(exports, "LinkingContext", { enumerable: true, get: function () { return LinkingContext_1.LinkingContext; } });
/**
 * @deprecated Use the `I18nManager` API from `react-native` to read or override the layout
 * direction. Will be removed in a future SDK.
 */
var LocaleDirContext_1 = require("./LocaleDirContext");
Object.defineProperty(exports, "LocaleDirContext", { enumerable: true, get: function () { return LocaleDirContext_1.LocaleDirContext; } });
/**
 * @deprecated `ExpoRoot` mounts the `NavigationContainer` automatically — there is no need
 * to render one manually in an Expo Router app. For tests, use `renderRouter` from
 * `expo-router/testing-library`. Will be removed in a future SDK.
 */
var NavigationContainer_1 = require("./NavigationContainer");
Object.defineProperty(exports, "NavigationContainer", { enumerable: true, get: function () { return NavigationContainer_1.NavigationContainer; } });
/**
 * @deprecated Server-side rendering for Expo Router is handled by `@expo/server` and the
 * Expo Router static renderer. Will be removed in a future SDK.
 */
var ServerContainer_1 = require("./ServerContainer");
Object.defineProperty(exports, "ServerContainer", { enumerable: true, get: function () { return ServerContainer_1.ServerContainer; } });
/**
 * @deprecated Import `DarkTheme` from `expo-router` instead. Will be removed in a future SDK.
 */
var DarkTheme_1 = require("./theming/DarkTheme");
Object.defineProperty(exports, "DarkTheme", { enumerable: true, get: function () { return DarkTheme_1.DarkTheme; } });
/**
 * @deprecated Import `DefaultTheme` from `expo-router` instead. Will be removed in a future SDK.
 */
var DefaultTheme_1 = require("./theming/DefaultTheme");
Object.defineProperty(exports, "DefaultTheme", { enumerable: true, get: function () { return DefaultTheme_1.DefaultTheme; } });
__exportStar(require("./types"), exports);
var UnhandledLinkingContext_1 = require("./UnhandledLinkingContext");
Object.defineProperty(exports, "UNSTABLE_UnhandledLinkingContext", { enumerable: true, get: function () { return UnhandledLinkingContext_1.UnhandledLinkingContext; } });
/**
 * @deprecated Use `Link` from `expo-router`. Will be removed in a future SDK.
 */
var useLinkBuilder_1 = require("./useLinkBuilder");
Object.defineProperty(exports, "useLinkBuilder", { enumerable: true, get: function () { return useLinkBuilder_1.useLinkBuilder; } });
/**
 * @deprecated Use `Link` from `expo-router`. Will be removed in a future SDK.
 */
var useLinkProps_1 = require("./useLinkProps");
Object.defineProperty(exports, "useLinkProps", { enumerable: true, get: function () { return useLinkProps_1.useLinkProps; } });
/**
 * @deprecated Use `useRouter` from `expo-router` instead. Will be removed in a future SDK.
 */
var useLinkTo_1 = require("./useLinkTo");
Object.defineProperty(exports, "useLinkTo", { enumerable: true, get: function () { return useLinkTo_1.useLinkTo; } });
/**
 * @deprecated Use the `I18nManager` API from `react-native` to read locale direction.
 * Will be removed in a future SDK.
 */
var useLocale_1 = require("./useLocale");
Object.defineProperty(exports, "useLocale", { enumerable: true, get: function () { return useLocale_1.useLocale; } });
/**
 * @deprecated Import `useRoutePath` from `expo-router` instead. Will be removed in a future SDK.
 */
var useRoutePath_1 = require("./useRoutePath");
Object.defineProperty(exports, "useRoutePath", { enumerable: true, get: function () { return useRoutePath_1.useRoutePath; } });
/**
 * @deprecated Import `useScrollToTop` from `expo-router` instead. Will be removed in a future SDK.
 */
var useScrollToTop_1 = require("./useScrollToTop");
Object.defineProperty(exports, "useScrollToTop", { enumerable: true, get: function () { return useScrollToTop_1.useScrollToTop; } });
__exportStar(require("../core"), exports);
//# sourceMappingURL=index.js.map