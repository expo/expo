export class SchemerError extends Error {
  readonly name = 'SchemerError';
  errors: ValidationError[];

  constructor(errors: ValidationError[]) {
    super('');
    this.message = errors.map(e => e.message).join('\n');
    this.errors = errors;
  }
}

export class ValidationError extends Error {
  readonly name = 'ValidationError';
  errorCode: string;
  fieldPath: string;
  message: string;
  data: any;
  meta: any;
  constructor({
    errorCode,
    fieldPath,
    message,
    data,
    meta,
  }: {
    errorCode: ErrorCode;
    fieldPath: string;
    message: string;
    data: any;
    meta: any;
  }) {
    super(message);
    this.errorCode = errorCode;
    this.fieldPath = fieldPath;
    this.message = message;
    this.data = data;
    this.meta = meta;
  }
}

export type ErrorCode = keyof typeof ErrorCodes;

export const ErrorCodes = {
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
