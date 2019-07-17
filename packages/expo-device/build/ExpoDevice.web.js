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
    get manufacturer() {
        return result.device.vendor;
    },
    get osName() {
        return result.os.name;
    },
    get osVersion() {
        return result.os.version;
    },
    get supportedCpuArchitectures() {
        return result.cpu.architecture;
    }
};
//# sourceMappingURL=ExpoDevice.web.js.map