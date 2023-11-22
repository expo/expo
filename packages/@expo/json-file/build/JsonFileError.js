"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmptyJsonFileError = void 0;
/**
 * Note that instances of this class do NOT pass `instanceof JsonFileError`.
 */
class JsonFileError extends Error {
    cause;
    code;
    fileName;
    isJsonFileError;
    constructor(message, cause, code, fileName) {
        let fullMessage = message;
        if (fileName) {
            fullMessage += `\n${cause ? '├' : '└'}─ File: ${fileName}`;
        }
        if (cause) {
            fullMessage += `\n└─ Cause: ${cause.name}: ${cause.message}`;
        }
        super(fullMessage);
        this.name = this.constructor.name;
        this.cause = cause;
        this.code = code;
        this.fileName = fileName;
        this.isJsonFileError = true;
    }
}
exports.default = JsonFileError;
class EmptyJsonFileError extends JsonFileError {
    constructor(fileName) {
        super(`Cannot parse an empty JSON string`, undefined, 'EJSONEMPTY', fileName);
    }
}
exports.EmptyJsonFileError = EmptyJsonFileError;
//# sourceMappingURL=JsonFileError.js.map