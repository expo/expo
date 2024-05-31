"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasViewControllerBasedStatusBarAppearance = void 0;
const expo_constants_1 = __importDefault(require("expo-constants"));
const react_native_1 = require("react-native");
exports.hasViewControllerBasedStatusBarAppearance = react_native_1.Platform.OS === 'ios' &&
    !!expo_constants_1.default.expoConfig?.ios?.infoPlist?.UIViewControllerBasedStatusBarAppearance;
//# sourceMappingURL=statusbar.js.map