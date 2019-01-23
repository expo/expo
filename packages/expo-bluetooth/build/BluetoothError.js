export default class BluetoothError extends Error {
    constructor({ message, code, domain, reason, suggestion, underlayingError }) {
        super(`expo-bluetooth: ${message}`);
        this.code = code;
        this.domain = domain;
        this.reason = reason;
        this.suggestion = suggestion;
        this.underlayingError = underlayingError;
    }
}
//# sourceMappingURL=BluetoothError.js.map