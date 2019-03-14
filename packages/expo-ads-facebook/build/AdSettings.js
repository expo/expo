import { NativeModulesProxy } from '@unimodules/core';
const { CTKAdSettingsManager } = NativeModulesProxy;
// TODO: rewrite the docblocks
export default {
    /**
     * Contains hash of the device id
     */
    get currentDeviceHash() {
        return CTKAdSettingsManager.currentDeviceHash;
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
        CTKAdSettingsManager.setUrlPrefix(urlPrefix);
    },
};
//# sourceMappingURL=AdSettings.js.map