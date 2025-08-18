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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
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
exports.useFocusEffect = exports.useNavigation = exports.SplashScreen = exports.ErrorBoundary = exports.useSitemap = exports.Sitemap = exports.Unmatched = exports.ExpoRoot = exports.Slot = exports.Navigator = exports.withLayoutContext = exports.useIsPreview = exports.router = exports.useRootNavigationState = exports.useRootNavigation = exports.useSegments = exports.useLocalSearchParams = exports.useGlobalSearchParams = exports.useNavigationContainerRef = exports.usePathname = exports.useUnstableGlobalHref = exports.useRouter = void 0;
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
var imperative_api_1 = require("./imperative-api");
Object.defineProperty(exports, "router", { enumerable: true, get: function () { return imperative_api_1.router; } });
__exportStar(require("./link/Link"), exports);
__exportStar(require("./link/elements"), exports);
var PreviewRouteContext_1 = require("./link/preview/PreviewRouteContext");
Object.defineProperty(exports, "useIsPreview", { enumerable: true, get: function () { return PreviewRouteContext_1.useIsPreview; } });
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
//# sourceMappingURL=exports.js.map