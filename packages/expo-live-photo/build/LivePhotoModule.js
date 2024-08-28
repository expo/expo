import { Platform, requireOptionalNativeModule } from 'expo-modules-core';
export default requireOptionalNativeModule('ExpoLivePhoto');
/**
 * Determine if the current device's operating system supports `expo-live-photo`.
 * Currently, expo-live-photo supports only iOS.
 */
export function isAvailable() {
    return Platform.OS === 'ios';
}
//# sourceMappingURL=LivePhotoModule.js.map