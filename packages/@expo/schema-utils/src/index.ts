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

const toErrorsMessages = (errors: BaseValidationError[]) =>
  errors.map((error) => {
    return `\n - options${error.path} (${error.keyword}): ${error.message}`;
  });

export class ValidationError<T> extends Error {
  schema: JSONSchema<T>;
  errors: BaseValidationError[];
  constructor(result: ValidationResult, schema: JSONSchema<T>) {
    const errors = flattenValidationResults(result);
    const title = typeof schema.title === 'string' ? schema.title : 'Value';
    super(
      `Invalid options object. ${title} options object does not match the defined schema.\n` +
        toErrorsMessages(errors)
          .map((line) => ` - options${line}`)
          .join('\n')
    );
    this.name = 'ValidationError';
    this.errors = errors;
    this.schema = schema;
  }

  toErrorsMessage(): string[] {
    return toErrorsMessages(this.errors);
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

export function derefSchema<T>(schema: JSONSchema<T>): JSONSchema<T> {
  return derefSchemaCache(schema).schema;
}

export function validate<T>(schema: JSONSchema<T>, value: unknown): asserts value is T {
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
