// TODO: Export from `@expo/server` after removing side effects
/** Internal errors class to indicate that the server has failed
 * @remarks
 * This should be thrown for unexpected errors, so they show up as crashes.
 * Typically malformed project structure, missing manifest, html or other files.
 */
export class ExpoError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ExpoError';
    }
    static isExpoError(error) {
        return !!error && error instanceof ExpoError;
    }
}
//# sourceMappingURL=error.js.map