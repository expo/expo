/**
 * A general error class that should be used for all errors in Expo modules.
 * Guarantees a `code` field that can be used to differentiate between different
 * types of errors without further subclassing Error.
 */
export class CodedError extends Error {
    constructor(code, message) {
        super(message);
        this.code = code;
    }
}
//# sourceMappingURL=CodedError.js.map