import { JSONSchema } from './JSONSchema';
export interface BaseValidationError {
    message: string;
    path: string;
    keyword: string;
    value: unknown;
}
export interface ValidationError extends BaseValidationError {
    cause?: ValidationError[];
}
export declare const validateSchema: (schema: JSONSchema, value: unknown, path: string) => ValidationError | null;
