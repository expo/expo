import { JSONSchema } from './JSONSchema';
import { deref } from './deref';
import {
  validateSchema,
  BaseValidationError,
  ValidationError as ValidationResult,
} from './validate';

const CACHE_SYMBOL = Symbol();

const flattenValidationResults = (
  input: ValidationResult,
  output: BaseValidationError[] = [],
): BaseValidationError[] => {
  output.push({
    message: input.message,
    path: input.path,
    keyword: input.keyword,
    value: input.value,
  });
  for (let idx = 0; input.cause && idx < input.cause.length; idx++) {
    flattenValidationResults(input.cause[idx], output);
  }
  return output;
};

const toErrorMessage = (errors: BaseValidationError[], name: string) => {
  let message = `Invalid options object. ${name} has been initialized using an options object that deos not match the API schema.`;
  for (const error of errors) {
    message += `\n - options${error.path} (${error.keyword}): ${error.message}`;
  }
  return message;
};

export class ValidationError extends Error {
  schema: JSONSchema;
  errors: BaseValidationError[];
  constructor(result: ValidationResult, schema: JSONSchema) {
    const errors = flattenValidationResults(result);
    super(toErrorMessage(errors, typeof schema.name === 'string' ? schema.name : 'Value'));
    this.name = 'ValidationError';
    this.errors = errors;
    this.schema = schema;
  }
}

export const derefSchema = (schema: JSONSchema): JSONSchema => {
  let derefed = (schema as any)[CACHE_SYMBOL] as JSONSchema | undefined;
  if (!derefed) {
    derefed = deref(schema);
    (schema as any)[CACHE_SYMBOL] = derefed;
  }
  return derefed!;
};

export function validate(
  schema: JSONSchema,
  value: unknown,
) {
  const derefed = derefSchema(schema);
  const result = validateSchema(derefed, value, '');
  if (result) {
    throw new ValidationError(result, derefed);
  }
}
