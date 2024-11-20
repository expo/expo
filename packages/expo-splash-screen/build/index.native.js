import { requireOptionalNativeModule } from 'expo-modules-core';
const SplashModule = requireOptionalNativeModule('ExpoSplashScreen');
const isExpoGo = typeof expo !== 'undefined' && globalThis.expo?.modules?.ExpoGo;
export function setOptions(options) {
    if (!SplashModule) {
        return;
    }
    if (isExpoGo) {
        console.warn("'Splashscreen.setOptions' cannot be used in Expo Go. To customize the splash screen, you can use development builds.");
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