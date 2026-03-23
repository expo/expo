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
exports.useBottomTabBarHeight = exports.BottomTabBarHeightContext = exports.BottomTabBarHeightCallbackContext = exports.BottomTabView = exports.BottomTabBar = exports.createBottomTabNavigator = exports.TransitionSpecs = exports.TransitionPresets = exports.SceneStyleInterpolators = void 0;
const SceneStyleInterpolators = __importStar(require("./TransitionConfigs/SceneStyleInterpolators"));
exports.SceneStyleInterpolators = SceneStyleInterpolators;
const TransitionPresets = __importStar(require("./TransitionConfigs/TransitionPresets"));
exports.TransitionPresets = TransitionPresets;
const TransitionSpecs = __importStar(require("./TransitionConfigs/TransitionSpecs"));
exports.TransitionSpecs = TransitionSpecs;
/**
 * Navigators
 */
var createBottomTabNavigator_1 = require("./navigators/createBottomTabNavigator");
Object.defineProperty(exports, "createBottomTabNavigator", { enumerable: true, get: function () { return createBottomTabNavigator_1.createBottomTabNavigator; } });
/**
 * Views
 */
var BottomTabBar_1 = require("./views/BottomTabBar");
Object.defineProperty(exports, "BottomTabBar", { enumerable: true, get: function () { return BottomTabBar_1.BottomTabBar; } });
var BottomTabView_1 = require("./views/BottomTabView");
Object.defineProperty(exports, "BottomTabView", { enumerable: true, get: function () { return BottomTabView_1.BottomTabView; } });
/**
 * Utilities
 */
var BottomTabBarHeightCallbackContext_1 = require("./utils/BottomTabBarHeightCallbackContext");
Object.defineProperty(exports, "BottomTabBarHeightCallbackContext", { enumerable: true, get: function () { return BottomTabBarHeightCallbackContext_1.BottomTabBarHeightCallbackContext; } });
var BottomTabBarHeightContext_1 = require("./utils/BottomTabBarHeightContext");
Object.defineProperty(exports, "BottomTabBarHeightContext", { enumerable: true, get: function () { return BottomTabBarHeightContext_1.BottomTabBarHeightContext; } });
var useBottomTabBarHeight_1 = require("./utils/useBottomTabBarHeight");
Object.defineProperty(exports, "useBottomTabBarHeight", { enumerable: true, get: function () { return useBottomTabBarHeight_1.useBottomTabBarHeight; } });
//# sourceMappingURL=index.js.map