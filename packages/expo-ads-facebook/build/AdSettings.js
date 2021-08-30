import { PermissionStatus, createPermissionHook, NativeModulesProxy, UnavailabilityError, } from 'expo-modules-core';
import { Platform } from 'react-native';
const { CTKAdSettingsManager } = NativeModulesProxy;
export { PermissionStatus };
const androidPermissionsResponse = {
    granted: true,
    expires: 'never',
    canAskAgain: true,
    status: PermissionStatus.GRANTED,
};
async function requestPermissionsAsync() {
    if (Platform.OS === 'android') {
        return Promise.resolve(androidPermissionsResponse);
    }
    if (!CTKAdSettingsManager.requestPermissionsAsync) {
        throw new UnavailabilityError('expo-ads-facebook', 'requestPermissionsAsync');
    }
    return await CTKAdSettingsManager.requestPermissionsAsync();
}
async function getPermissionsAsync() {
    if (Platform.OS === 'android') {
        return Promise.resolve(androidPermissionsResponse);
    }
    if (!CTKAdSettingsManager.getPermissionsAsync) {
        throw new UnavailabilityError('expo-ads-facebook', 'getPermissionsAsync');
    }
    return await CTKAdSettingsManager.getPermissionsAsync();
}
// @needsAudit
/**
 * Check or request permissions for ad settings.
 * This uses both `requestPermissionAsync` and `getPermissionsAsync` to interact with the permissions.
 *
 * @example
 * ```ts
 * const [status, requestPermission] = AdSettings.usePermissions();
 * ```
 */
const usePermissions = createPermissionHook({
    getMethod: getPermissionsAsync,
    requestMethod: requestPermissionsAsync,
});
// TODO: rewrite the docblocks
export default {
    /**
     * Contains hash of the device id
     */
    get currentDeviceHash() {
        return CTKAdSettingsManager.currentDeviceHash;
    },
    requestPermissionsAsync,
    getPermissionsAsync,
    usePermissions,
    /**
     * Sets whether Facebook SDK should enable advertising tracking.
     */
    setAdvertiserTrackingEnabled(enabled) {
        // noop outside of iOS
        if (Platform.OS !== 'ios') {
            return;
        }
        if (!CTKAdSettingsManager.setAdvertiserTrackingEnabled) {
            throw new UnavailabilityError('expo-ads-facebook', 'setAdvertiserTrackingEnabled');
        }
        CTKAdSettingsManager.setAdvertiserTrackingEnabled(enabled);
    },
    /**
     * Registers given device with `deviceHash` to receive test Facebook ads.
     */
    addTestDevice(deviceHash) {
        CTKAdSettingsManager.addTestDevice(deviceHash);
    },
    /**
     * Clears previously set test devices
     */
    clearTestDevices() {
        CTKAdSettingsManager.clearTestDevices();
    },
    /**
     * Sets current SDK log level
     */
    setLogLevel(logLevel) {
        CTKAdSettingsManager.setLogLevel(logLevel);
    },
    /**
     * Specifies whether ads are treated as child-directed
     */
    setIsChildDirected(isDirected) {
        CTKAdSettingsManager.setIsChildDirected(isDirected);
    },
    /**
     * Sets mediation service name
     */
    setMediationService(mediationService) {
        CTKAdSettingsManager.setMediationService(mediationService);
    },
    /**
     * Sets URL prefix
     */
    setUrlPrefix(urlPrefix) {
        CTKAdSettingsManager.setUrlPrefix(urlPrefix || null);
    },
};
//# sourceMappingURL=AdSettings.js.map