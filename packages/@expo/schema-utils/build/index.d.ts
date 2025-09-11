import { JSONSchema } from './JSONSchema';
import { BaseValidationError, ValidationError as ValidationResult } from './validate';
export { JSONSchema } from './JSONSchema';
export declare class ValidationError extends Error {
    schema: JSONSchema;
    errors: BaseValidationError[];
    constructor(result: ValidationResult, schema: JSONSchema);
}
export declare function derefSchema(schema: JSONSchema): JSONSchema;
export declare function validate(schema: JSONSchema, value: unknown): void;
