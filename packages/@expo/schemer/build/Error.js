"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorCodes = exports.ValidationError = exports.SchemerError = void 0;
class SchemerError extends Error {
    constructor(errors) {
        super('');
        this.name = 'SchemerError';
        this.message = errors.map(e => e.message).join('\n');
        this.errors = errors;
    }
}
exports.SchemerError = SchemerError;
class ValidationError extends Error {
    constructor({ errorCode, fieldPath, message, data, meta, }) {
        super(message);
        this.name = 'ValidationError';
        this.errorCode = errorCode;
        this.fieldPath = fieldPath;
        this.message = message;
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
};
//# sourceMappingURL=Error.js.map