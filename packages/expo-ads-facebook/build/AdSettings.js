import { NativeModulesProxy } from 'expo-core';
import { UnavailabilityError } from 'expo-errors';
let { CTKAdSettingsManager } = NativeModulesProxy;
CTKAdSettingsManager = CTKAdSettingsManager || {};
// TODO: rewrite the docblocks
export default {
    /**
     * Contains hash of the device id
     */
    get currentDeviceHash() {
        return CTKAdSettingsManager ? CTKAdSettingsManager.currentDeviceHash : null;
    },
    /**
     * Registers given device with `deviceHash` to receive test Facebook ads.
     */
    addTestDevice(deviceHash) {
        if (!CTKAdSettingsManager.addTestDevice) {
            throw new UnavailabilityError('CTKAdSettingsManager', 'addTestDevice');
        }
        CTKAdSettingsManager.addTestDevice(deviceHash);
    },
    /**
     * Clears previously set test devices
     */
    clearTestDevices() {
        if (!CTKAdSettingsManager.clearTestDevices) {
            throw new UnavailabilityError('CTKAdSettingsManager', 'clearTestDevices');
        }
        CTKAdSettingsManager.clearTestDevices();
    },
    /**
     * Sets current SDK log level
     */
    setLogLevel(logLevel) {
        if (!CTKAdSettingsManager.setLogLevel) {
            throw new UnavailabilityError('CTKAdSettingsManager', 'setLogLevel');
        }
        CTKAdSettingsManager.setLogLevel(logLevel);
    },
    /**
     * Specifies whether ads are treated as child-directed
     */
    setIsChildDirected(isDirected) {
        if (!CTKAdSettingsManager.setIsChildDirected) {
            throw new UnavailabilityError('CTKAdSettingsManager', 'setIsChildDirected');
        }
        CTKAdSettingsManager.setIsChildDirected(isDirected);
    },
    /**
     * Sets mediation service name
     */
    setMediationService(mediationService) {
        if (!CTKAdSettingsManager.setMediationService) {
            throw new UnavailabilityError('CTKAdSettingsManager', 'setMediationService');
        }
        CTKAdSettingsManager.setMediationService(mediationService);
    },
    /**
     * Sets URL prefix
     */
    setUrlPrefix(urlPrefix) {
        if (!CTKAdSettingsManager.setUrlPrefix) {
            throw new UnavailabilityError('CTKAdSettingsManager', 'setUrlPrefix');
        }
        CTKAdSettingsManager.setUrlPrefix(urlPrefix);
    },
};
//# sourceMappingURL=AdSettings.js.map