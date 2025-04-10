"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.canOverrideStatusBarBehavior = void 0;
const expo_constants_1 = __importDefault(require("expo-constants"));
const react_native_1 = require("react-native");
const react_native_is_edge_to_edge_1 = require("react-native-is-edge-to-edge");
const hasViewControllerBasedStatusBarAppearance = react_native_1.Platform.OS === 'ios' &&
    !!expo_constants_1.default.expoConfig?.ios?.infoPlist?.UIViewControllerBasedStatusBarAppearance;
exports.canOverrideStatusBarBehavior = !(0, react_native_is_edge_to_edge_1.isEdgeToEdge)() && !hasViewControllerBasedStatusBarAppearance;
//# sourceMappingURL=statusbar.js.map