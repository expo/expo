"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatDeviceIdentifier = exports.getDeviceIdentifier = exports.SendMessageError = void 0;
class SendMessageError extends Error {
    app;
    constructor(message, app) {
        super(message);
        this.app = app;
    }
}
exports.SendMessageError = SendMessageError;
const getDeviceIdentifier = (app) => {
    // Use the deviceName + app ID as the device identifier
    return (0, exports.formatDeviceIdentifier)(app.deviceName, app.appId);
};
exports.getDeviceIdentifier = getDeviceIdentifier;
const formatDeviceIdentifier = (deviceName, applicationId) => {
    // Use the deviceName + app ID as the device identifier
    return `${deviceName} (${applicationId})`;
};
exports.formatDeviceIdentifier = formatDeviceIdentifier;
//# sourceMappingURL=utils.js.map