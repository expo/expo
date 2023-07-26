import { requireNativeModule } from 'expo-modules-core';
// ExpoGo module is available only when the app is run in Expo Go,
// otherwise we use `null` instead of throwing an error.
const NativeExpoGoModule = (() => {
    try {
        return requireNativeModule('ExpoGo');
    }
    catch {
        return null;
    }
})();
/**
 * Returns a boolean value whether the app is running in Expo Go.
 */
export function isRunningInExpoGo() {
    return NativeExpoGoModule != null;
}
/**
 * Returns an Expo Go project config from the manifest or `null` if the app is not running in Expo Go.
 */
export function getExpoGoProjectConfig() {
    return NativeExpoGoModule?.projectConfig ?? null;
}
//# sourceMappingURL=ExpoGo.js.map