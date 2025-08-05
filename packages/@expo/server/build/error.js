"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpoError = void 0;
exports.isExpoError = isExpoError;
/** Internal errors class to indicate that the server has failed
 * @remarks
 * This should be thrown for unexpected errors, so they show up as crashes.
 * Typically malformed project structure, missing manifest, html or other files.
 */
class ExpoError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ExpoError';
    }
}
exports.ExpoError = ExpoError;
function isExpoError(error) {
    return !!error && error instanceof ExpoError;
}
//# sourceMappingURL=error.js.map