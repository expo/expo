export default class HttpsError extends Error {
    constructor(code, message, details) {
        super(message);
        this.code = code;
        this.details = details;
        if (message !== undefined) {
            this.message = message;
        }
    }
}
//# sourceMappingURL=HttpsError.js.map