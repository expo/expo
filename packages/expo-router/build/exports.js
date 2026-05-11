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
exports.ExperimentalStack = exports.Tabs = exports.unstable_navigationEvents = exports.VectorIcon = exports.Label = exports.Icon = exports.Badge = exports.useRoute = exports.useScrollToTop = exports.useRoutePath = exports.useTheme = exports.ThemeProvider = exports.DefaultTheme = exports.DarkTheme = exports.useIsFocused = exports.useFocusEffect = exports.useNavigation = exports.SplashScreen = exports.SuspenseFallback = exports.ErrorBoundary = exports.useSitemap = exports.Sitemap = exports.Unmatched = exports.ExpoRoot = exports.Slot = exports.Navigator = exports.withLayoutContext = exports.router = exports.useLoaderData = exports.useRootNavigationState = exports.useRootNavigation = exports.useSegments = exports.useLocalSearchParams = exports.useGlobalSearchParams = exports.useNavigationContainerRef = exports.usePathname = exports.useUnstableGlobalHref = exports.useRouter = void 0;
// Expo Router API
const Navigator_1 = require("./views/Navigator");
Object.defineProperty(exports, "Navigator", { enumerable: true, get: function () { return Navigator_1.Navigator; } });
Object.defineProperty(exports, "Slot", { enumerable: true, get: function () { return Navigator_1.Slot; } });
var hooks_1 = require("./hooks");
Object.defineProperty(exports, "useRouter", { enumerable: true, get: function () { return hooks_1.useRouter; } });
Object.defineProperty(exports, "useUnstableGlobalHref", { enumerable: true, get: function () { return hooks_1.useUnstableGlobalHref; } });
Object.defineProperty(exports, "usePathname", { enumerable: true, get: function () { return hooks_1.usePathname; } });
Object.defineProperty(exports, "useNavigationContainerRef", { enumerable: true, get: function () { return hooks_1.useNavigationContainerRef; } });
Object.defineProperty(exports, "useGlobalSearchParams", { enumerable: true, get: function () { return hooks_1.useGlobalSearchParams; } });
Object.defineProperty(exports, "useLocalSearchParams", { enumerable: true, get: function () { return hooks_1.useLocalSearchParams; } });
Object.defineProperty(exports, "useSegments", { enumerable: true, get: function () { return hooks_1.useSegments; } });
Object.defineProperty(exports, "useRootNavigation", { enumerable: true, get: function () { return hooks_1.useRootNavigation; } });
Object.defineProperty(exports, "useRootNavigationState", { enumerable: true, get: function () { return hooks_1.useRootNavigationState; } });
Object.defineProperty(exports, "useLoaderData", { enumerable: true, get: function () { return hooks_1.useLoaderData; } });
var imperative_api_1 = require("./imperative-api");
Object.defineProperty(exports, "router", { enumerable: true, get: function () { return imperative_api_1.router; } });
var withLayoutContext_1 = require("./layouts/withLayoutContext");
Object.defineProperty(exports, "withLayoutContext", { enumerable: true, get: function () { return withLayoutContext_1.withLayoutContext; } });
// Expo Router Views
var ExpoRoot_1 = require("./ExpoRoot");
Object.defineProperty(exports, "ExpoRoot", { enumerable: true, get: function () { return ExpoRoot_1.ExpoRoot; } });
var Unmatched_1 = require("./views/Unmatched");
Object.defineProperty(exports, "Unmatched", { enumerable: true, get: function () { return Unmatched_1.Unmatched; } });
var Sitemap_1 = require("./views/Sitemap");
Object.defineProperty(exports, "Sitemap", { enumerable: true, get: function () { return Sitemap_1.Sitemap; } });
var useSitemap_1 = require("./views/useSitemap");
Object.defineProperty(exports, "useSitemap", { enumerable: true, get: function () { return useSitemap_1.useSitemap; } });
var ErrorBoundary_1 = require("./views/ErrorBoundary");
Object.defineProperty(exports, "ErrorBoundary", { enumerable: true, get: function () { return ErrorBoundary_1.ErrorBoundary; } });
var SuspenseFallback_1 = require("./views/SuspenseFallback");
Object.defineProperty(exports, "SuspenseFallback", { enumerable: true, get: function () { return SuspenseFallback_1.SuspenseFallback; } });
// Platform
/**
 * @hidden
 */
exports.SplashScreen = __importStar(require("./views/Splash"));
// React Navigation
var useNavigation_1 = require("./useNavigation");
Object.defineProperty(exports, "useNavigation", { enumerable: true, get: function () { return useNavigation_1.useNavigation; } });
var useFocusEffect_1 = require("./useFocusEffect");
Object.defineProperty(exports, "useFocusEffect", { enumerable: true, get: function () { return useFocusEffect_1.useFocusEffect; } });
var useIsFocused_1 = require("./useIsFocused");
Object.defineProperty(exports, "useIsFocused", { enumerable: true, get: function () { return useIsFocused_1.useIsFocused; } });
var DarkTheme_1 = require("./react-navigation/native/theming/DarkTheme");
Object.defineProperty(exports, "DarkTheme", { enumerable: true, get: function () { return DarkTheme_1.DarkTheme; } });
var DefaultTheme_1 = require("./react-navigation/native/theming/DefaultTheme");
Object.defineProperty(exports, "DefaultTheme", { enumerable: true, get: function () { return DefaultTheme_1.DefaultTheme; } });
var ThemeProvider_1 = require("./react-navigation/core/theming/ThemeProvider");
Object.defineProperty(exports, "ThemeProvider", { enumerable: true, get: function () { return ThemeProvider_1.ThemeProvider; } });
var useTheme_1 = require("./react-navigation/core/theming/useTheme");
Object.defineProperty(exports, "useTheme", { enumerable: true, get: function () { return useTheme_1.useTheme; } });
var useRoutePath_1 = require("./react-navigation/native/useRoutePath");
Object.defineProperty(exports, "useRoutePath", { enumerable: true, get: function () { return useRoutePath_1.useRoutePath; } });
var useScrollToTop_1 = require("./react-navigation/native/useScrollToTop");
Object.defineProperty(exports, "useScrollToTop", { enumerable: true, get: function () { return useScrollToTop_1.useScrollToTop; } });
var useRoute_1 = require("./react-navigation/core/useRoute");
Object.defineProperty(exports, "useRoute", { enumerable: true, get: function () { return useRoute_1.useRoute; } });
var primitives_1 = require("./primitives");
Object.defineProperty(exports, "Badge", { enumerable: true, get: function () { return primitives_1.Badge; } });
Object.defineProperty(exports, "Icon", { enumerable: true, get: function () { return primitives_1.Icon; } });
Object.defineProperty(exports, "Label", { enumerable: true, get: function () { return primitives_1.Label; } });
Object.defineProperty(exports, "VectorIcon", { enumerable: true, get: function () { return primitives_1.VectorIcon; } });
var navigationEvents_1 = require("./navigationEvents");
Object.defineProperty(exports, "unstable_navigationEvents", { enumerable: true, get: function () { return navigationEvents_1.unstable_navigationEvents; } });
/**
 * @deprecated Use `import { Tabs } from 'expo-router/js-tabs'` instead.
 */
var Tabs_1 = require("./layouts/Tabs");
Object.defineProperty(exports, "Tabs", { enumerable: true, get: function () { return Tabs_1.Tabs; } });
var experimental_stack_1 = require("./layouts/experimental-stack");
Object.defineProperty(exports, "ExperimentalStack", { enumerable: true, get: function () { return experimental_stack_1.ExperimentalStack; } });
//# sourceMappingURL=exports.js.map