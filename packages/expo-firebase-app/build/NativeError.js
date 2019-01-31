export default class NativeError extends Error {
    constructor(nativeError) {
        super(nativeError.message);
        this.code = nativeError.code;
        this.message = nativeError.message;
        this.nativeErrorCode = nativeError.nativeErrorCode;
        this.nativeErrorMessage = nativeError.nativeErrorMessage;
    }
}
//# sourceMappingURL=NativeError.js.map