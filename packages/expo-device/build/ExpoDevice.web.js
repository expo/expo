import UAParser from 'ua-parser-js';
import { DeviceType } from './Device.types';
const parser = new UAParser(window.navigator.userAgent);
const result = parser.getResult();
export default {
    get isDevice() {
        return true;
    },
    get brand() {
        return null;
    },
    get manufacturer() {
        return result.device.vendor || null;
    },
    get modelName() {
        return result.device.model || null;
    },
    get deviceYearClass() {
        return null;
    },
    get totalMemory() {
        return null;
    },
    get supportedCpuArchitectures() {
        return result.cpu.architecture ? [result.cpu.architecture] : null;
    },
    get osName() {
        return result.os.name;
    },
    get osVersion() {
        return result.os.version;
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