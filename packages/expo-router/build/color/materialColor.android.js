import { requireNativeModule } from 'expo-modules-core';
import { Appearance } from 'react-native';
let AndroidExpoRouterModule = null;
function NativeDynamicColor(name, scheme) {
    if (!AndroidExpoRouterModule) {
        AndroidExpoRouterModule = requireNativeModule('ExpoRouter');
    }
    return AndroidExpoRouterModule.Material3DynamicColor(name, scheme);
}
function NativeMaterialColor(name, scheme) {
    if (!AndroidExpoRouterModule) {
        AndroidExpoRouterModule = requireNativeModule('ExpoRouter');
    }
    return AndroidExpoRouterModule.Material3Color(name, scheme);
}
export function Material3DynamicColor(name) {
    const scheme = Appearance.getColorScheme();
    return NativeDynamicColor(name, scheme ?? 'unspecified');
}
export function Material3Color(name) {
    const scheme = Appearance.getColorScheme();
    return NativeMaterialColor(name, scheme ?? 'unspecified');
}
//# sourceMappingURL=materialColor.android.js.map