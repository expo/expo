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
exports.TabRouter = exports.useNavigationBuilder = exports.createNavigatorFactory = exports.useNavigationState = exports.useScrollToTop = exports.useRoute = exports.usePreventRemove = exports.useTheme = exports.DefaultTheme = exports.DarkTheme = exports.ThemeProvider = void 0;
var native_1 = require("./native");
Object.defineProperty(exports, "ThemeProvider", { enumerable: true, get: function () { return native_1.ThemeProvider; } });
Object.defineProperty(exports, "DarkTheme", { enumerable: true, get: function () { return native_1.DarkTheme; } });
Object.defineProperty(exports, "DefaultTheme", { enumerable: true, get: function () { return native_1.DefaultTheme; } });
Object.defineProperty(exports, "useTheme", { enumerable: true, get: function () { return native_1.useTheme; } });
Object.defineProperty(exports, "usePreventRemove", { enumerable: true, get: function () { return native_1.usePreventRemove; } });
Object.defineProperty(exports, "useRoute", { enumerable: true, get: function () { return native_1.useRoute; } });
Object.defineProperty(exports, "useScrollToTop", { enumerable: true, get: function () { return native_1.useScrollToTop; } });
Object.defineProperty(exports, "useNavigationState", { enumerable: true, get: function () { return native_1.useNavigationState; } });
Object.defineProperty(exports, "createNavigatorFactory", { enumerable: true, get: function () { return native_1.createNavigatorFactory; } });
Object.defineProperty(exports, "useNavigationBuilder", { enumerable: true, get: function () { return native_1.useNavigationBuilder; } });
var routers_1 = require("./routers");
Object.defineProperty(exports, "TabRouter", { enumerable: true, get: function () { return routers_1.TabRouter; } });
__exportStar(require("./native/types"), exports);
__exportStar(require("./core/types"), exports);
__exportStar(require("./native-stack/types"), exports);
//# sourceMappingURL=index.js.map