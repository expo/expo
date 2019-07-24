import UAParser from 'ua-parser-js';
const parser = new UAParser(window.navigator.userAgent);
const result = parser.getResult();
export default {
    get isDevice() {
        return true;
    },
    get modelName() {
        return result.device.model || null;
    },
    get osName() {
        return result.os.name;
    },
    get osVersion() {
        return result.os.version;
    },
    get supportedCpuArchitectures() {
        return result.cpu.architecture ? [result.cpu.architecture] : null;
    },
    get deviceName() {
        const { browser, engine, os: OS } = parser.getResult();
        return browser.name || engine.name || OS.name || null;
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
    get manufacturer() {
        return null;
    },
    get brand() {
        return null;
    },
};
//# sourceMappingURL=ExpoDevice.web.js.map