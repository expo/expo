export declare class SchemerError extends Error {
    readonly name = "SchemerError";
    errors: ValidationError[];
    constructor(errors: ValidationError[]);
}
export declare class ValidationError extends Error {
    readonly name = "ValidationError";
    errorCode: string;
    fieldPath: string;
    message: string;
    data: any;
    meta: any;
    constructor({ errorCode, fieldPath, message, data, meta, }: {
        errorCode: ErrorCode;
        fieldPath: string;
        message: string;
        data: any;
        meta: any;
    });
}
export declare type ErrorCode = keyof typeof ErrorCodes;
export declare const ErrorCodes: {
    SCHEMA_VALIDATION_ERROR: string;
    SCHEMA_ADDITIONAL_PROPERTY: string;
    SCHEMA_MISSING_REQUIRED_PROPERTY: string;
    SCHEMA_INVALID_PATTERN: string;
    SCHEMA_INVALID_NOT: string;
    INVALID_ASSET_URI: string;
    INVALID_DIMENSIONS: string;
    INVALID_CONTENT_TYPE: string;
    NOT_SQUARE: string;
};
