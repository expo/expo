import { JSONSchema } from './JSONSchema';
import { deref } from './deref';
import {
  validateSchema,
  BaseValidationError,
  ValidationError as ValidationResult,
} from './validate';

export { JSONSchema } from './JSONSchema';

const CACHE_SYMBOL = Symbol('@expo/schema-utils');

interface SchemaCacheData {
  schema: JSONSchema;
  cache: WeakMap<object, ValidationResult | null>;
}

const flattenValidationResults = (
  input: ValidationResult,
  output: BaseValidationError[] = []
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
  let message = `Invalid options object. ${name} has been initialized using an options object that does not match the API schema.`;
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
    super(toErrorMessage(errors, typeof schema.title === 'string' ? schema.title : 'Value'));
    this.name = 'ValidationError';
    this.errors = errors;
    this.schema = schema;
  }
}

const derefSchemaCache = (schema: JSONSchema): SchemaCacheData => {
  let derefed = (schema as any)[CACHE_SYMBOL] as SchemaCacheData | undefined;
  if (!derefed) {
    derefed = {
      schema: deref(schema),
      cache: new WeakMap(),
    };
    (schema as any)[CACHE_SYMBOL] = derefed;
  }
  return derefed!;
};

export function derefSchema(schema: JSONSchema): JSONSchema {
  return derefSchemaCache(schema).schema;
}

export function validate(schema: JSONSchema, value: unknown) {
  const data = derefSchemaCache(schema);
  let result: ValidationResult | null | undefined;
  if (
    typeof value !== 'object' ||
    value == null ||
    (result = data.cache.get(value)) === undefined
  ) {
    result = validateSchema(data.schema, value, '');
    if (typeof value === 'object' && value != null) {
      data.cache.set(value, result);
    }
  }
  if (result) {
    throw new ValidationError(result, data.schema);
  }
}
