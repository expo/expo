"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Material3DynamicColor = Material3DynamicColor;
exports.Material3Color = Material3Color;
const expo_modules_core_1 = require("expo-modules-core");
const react_native_1 = require("react-native");
let AndroidExpoRouterModule = null;
function NativeDynamicColor(name, scheme) {
    if (!AndroidExpoRouterModule) {
        AndroidExpoRouterModule = (0, expo_modules_core_1.requireNativeModule)('ExpoRouter');
    }
    return AndroidExpoRouterModule.Material3DynamicColor(name, scheme);
}
function NativeMaterialColor(name, scheme) {
    if (!AndroidExpoRouterModule) {
        AndroidExpoRouterModule = (0, expo_modules_core_1.requireNativeModule)('ExpoRouter');
    }
    return AndroidExpoRouterModule.Material3Color(name, scheme);
}
function Material3DynamicColor(name) {
    const scheme = react_native_1.Appearance.getColorScheme();
    return NativeDynamicColor(name, scheme ?? 'unspecified');
}
function Material3Color(name) {
    const scheme = react_native_1.Appearance.getColorScheme();
    return NativeMaterialColor(name, scheme ?? 'unspecified');
}
//# sourceMappingURL=materialColor.android.js.map