"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorCodes = exports.ValidationError = exports.SchemerError = void 0;
class SchemerError extends Error {
    name = 'SchemerError';
    errors;
    constructor(errors) {
        super('');
        this.message = errors.map((error) => error.message).join('\n');
        this.errors = errors;
    }
}
exports.SchemerError = SchemerError;
class ValidationError extends Error {
    name = 'ValidationError';
    errorCode;
    fieldPath;
    data;
    meta;
    constructor({ errorCode, fieldPath, message, data, meta, }) {
        super(message);
        this.errorCode = errorCode;
        this.fieldPath = fieldPath;
        this.data = data;
        this.meta = meta;
    }
}
exports.ValidationError = ValidationError;
exports.ErrorCodes = {
    SCHEMA_VALIDATION_ERROR: 'SCHEMA_VALIDATION_ERROR',
    SCHEMA_ADDITIONAL_PROPERTY: 'SCHEMA_ADDITIONAL_PROPERTY',
    SCHEMA_MISSING_REQUIRED_PROPERTY: 'SCHEMA_MISSING_REQUIRED_PROPERTY',
    SCHEMA_INVALID_PATTERN: 'SCHEMA_INVALID_PATTERN',
    SCHEMA_INVALID_NOT: 'SCHEMA_INVALID_NOT',
    INVALID_ASSET_URI: 'INVALID_ASSET_URI',
    INVALID_DIMENSIONS: 'INVALID_DIMENSIONS',
    INVALID_CONTENT_TYPE: 'INVALID_CONTENT_TYPE',
    NOT_SQUARE: 'NOT_SQUARE',
    FILE_EXTENSION_MISMATCH: 'FILE_EXTENSION_MISMATCH',
};
//# sourceMappingURL=Error.js.map