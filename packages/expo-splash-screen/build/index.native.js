import { requireOptionalNativeModule } from 'expo-modules-core';
const SplashModule = requireOptionalNativeModule('ExpoSplashScreen');
export function setOptions(options) {
    if (!SplashModule) {
        return;
    }
    SplashModule.setOptions(options);
}
export function hide() {
    if (!SplashModule) {
        return;
    }
    SplashModule.hide();
}
export async function hideAsync() {
    hide();
}
export async function preventAutoHideAsync() {
    if (!SplashModule) {
        return;
    }
    return SplashModule.preventAutoHideAsync();
}
//# sourceMappingURL=index.native.js.map