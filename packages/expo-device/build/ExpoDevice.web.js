import { Platform } from 'expo-modules-core';
import UAParser from 'ua-parser-js';
import { DeviceType } from './Device.types';
let result = null;
if (Platform.isDOMAvailable) {
    const parser = new UAParser(window.navigator.userAgent);
    result = parser.getResult();
}
function convertGiBtoBytes(gib) {
    return Math.round(gib * 1024 ** 3);
}
export default {
    get isDevice() {
        return true;
    },
    get brand() {
        return null;
    },
    get manufacturer() {
        return (result && result.device.vendor) || null;
    },
    get modelName() {
        return (result && result.device.model) || null;
    },
    get deviceYearClass() {
        return null;
    },
    get totalMemory() {
        if (Platform.isDOMAvailable && 'deviceMemory' in navigator) {
            const { deviceMemory } = navigator;
            return convertGiBtoBytes(deviceMemory);
        }
        return null;
    },
    get supportedCpuArchitectures() {
        return result && result.cpu.architecture ? [result.cpu.architecture] : null;
    },
    get osName() {
        return (result && result.os.name) || '';
    },
    get osVersion() {
        return (result && result.os.version) || '';
    },
    get osBuildId() {
        return null;
    },
    get osInternalBuildId() {
        return null;
    },
    get deviceName() {
        return null;
    },
    async getDeviceTypeAsync() {
        switch (result.device.type) {
            case 'mobile':
                return DeviceType.PHONE;
            case 'tablet':
                return DeviceType.TABLET;
            case 'smarttv':
                return DeviceType.TV;
            case 'console':
            case 'embedded':
            case 'wearable':
                return DeviceType.UNKNOWN;
            default:
                return DeviceType.DESKTOP;
        }
    },
    async isRootedExperimentalAsync() {
        return false;
    },
};
//# sourceMappingURL=ExpoDevice.web.js.map