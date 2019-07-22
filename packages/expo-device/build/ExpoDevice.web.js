import UAParser from 'ua-parser-js';
const parser = new UAParser(window.navigator.userAgent);
var result = parser.getResult();
export default {
    get name() {
        return 'ExpoDevice';
    },
    get isDevice() {
        return true;
    },
    get modelName() {
        return result.device.model;
    },
    get osName() {
        return result.os.name;
    },
    get osVersion() {
        return result.os.version;
    },
    get supportedCpuArchitectures() {
        return result.cpu.architecture;
    },
    get deviceName() {
        const { browser, engine, os: OS } = parser.getResult();
        return browser.name || engine.name || OS.name || undefined;
    },
    get deviceYearClass() {
        return null;
    },
    get osBuildId() {
        return null;
    },
    get osInternalBuildId() {
        return null;
    },
    get totalMemory() {
        return null;
    },
    get modelId() {
        return null;
    },
    get manufacturer() {
        return null;
    },
    get brand() {
        return null;
    },
    get osBuildFingerprint() {
        return null;
    },
    get designName() {
        return null;
    },
    get productName() {
        return null;
    },
    get platformApiLevel() {
        return null;
    }
};
//# sourceMappingURL=ExpoDevice.web.js.map