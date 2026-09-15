import { LanguageModelError } from './LanguageModelError';
import type { ModelSchema } from './LanguageModels.types';

const MAX_SCHEMA_DEPTH = 32;
const hasOwn = (value: object, key: PropertyKey) =>
  Object.prototype.hasOwnProperty.call(value, key);

function failSchema(path: string, message: string): never {
  throw new LanguageModelError('ERR_SCHEMA_UNSUPPORTED', `${path}: ${message}`);
}

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function schemaRecord(value: unknown, path: string): Record<string, unknown> {
  if (!isObject(value)) failSchema(path, 'Expected a schema object.');
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== null && prototype !== Object.prototype) {
    failSchema(path, 'Schema objects must have a plain or null prototype.');
  }
  for (const key of Reflect.ownKeys(value)) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key)!;
    if (typeof key !== 'string' || !descriptor.enumerable || !hasOwn(descriptor, 'value')) {
      failSchema(path, 'Schema entries must be enumerable string properties without accessors.');
    }
  }
  return value;
}

function arrayBound(value: unknown, path: string): number | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) {
    failSchema(path, 'Array bounds must be non-negative safe integers.');
  }
  return value;
}

function numericBound(value: unknown, path: string, integer: boolean): number | undefined {
  if (value === undefined) return undefined;
  if (
    typeof value !== 'number' ||
    !Number.isFinite(value) ||
    (integer && !Number.isSafeInteger(value))
  ) {
    failSchema(
      path,
      integer ? 'Integer bounds must be safe integers.' : 'Numeric bounds must be finite.'
    );
  }
  return value;
}

function schemaArray(value: unknown, path: string): unknown[] {
  if (!Array.isArray(value)) failSchema(path, 'Expected an array.');
  const keys = Reflect.ownKeys(value);
  if (keys.length !== value.length + 1) {
    failSchema(path, 'Schema arrays cannot have holes or extra properties.');
  }
  for (let index = 0; index < value.length; index++) {
    const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
    if (!descriptor || !descriptor.enumerable || !hasOwn(descriptor, 'value')) {
      failSchema(path, 'Schema arrays cannot have holes or accessor elements.');
    }
  }
  return value;
}

/** Validate the supported schema dialect and take an independent snapshot. */
export function compileSchema(schema: unknown, internalDepthAllowance: 0 | 2 = 0): ModelSchema {
  const maximumDepth = MAX_SCHEMA_DEPTH + internalDepthAllowance;
  const ancestors = new WeakSet<object>();
  function visit(input: unknown, path: string, depth: number): ModelSchema {
    const node = schemaRecord(input, path);
    if (depth > maximumDepth || ancestors.has(node)) {
      failSchema(
        path,
        `Recursive schemas or schemas deeper than ${maximumDepth} levels are unsupported.`
      );
    }
    ancestors.add(node);
    const allowed = new Set(['type', 'description']);
    switch (node.type) {
      case 'string':
        allowed.add('enum');
        break;
      case 'number':
      case 'integer':
        allowed.add('minimum');
        allowed.add('maximum');
        break;
      case 'boolean':
        break;
      case 'array':
        for (const key of ['items', 'minItems', 'maxItems']) allowed.add(key);
        break;
      case 'object':
        for (const key of ['properties', 'required', 'additionalProperties']) allowed.add(key);
        break;
      default:
        failSchema(path, 'Unsupported or missing schema type.');
    }
    for (const key of Object.keys(node)) {
      if (!allowed.has(key)) failSchema(path, `Unsupported keyword ${key}.`);
    }
    if (node.description !== undefined && typeof node.description !== 'string') {
      failSchema(path, 'description must be a string.');
    }
    const description =
      node.description === undefined ? {} : { description: node.description as string };
    let result: ModelSchema;
    switch (node.type) {
      case 'string': {
        if (node.enum === undefined) {
          result = { type: 'string', ...description };
          break;
        }
        const values = schemaArray(node.enum, `${path}.enum`);
        if (
          values.length === 0 ||
          !values.every((value) => typeof value === 'string') ||
          new Set(values).size !== values.length
        ) {
          failSchema(path, 'enum must contain distinct strings.');
        }
        result = {
          type: 'string',
          ...description,
          enum: [...values] as [string, ...string[]],
        };
        break;
      }
      case 'number':
      case 'integer': {
        const minimum = numericBound(node.minimum, `${path}.minimum`, node.type === 'integer');
        const maximum = numericBound(node.maximum, `${path}.maximum`, node.type === 'integer');
        if (minimum !== undefined && maximum !== undefined && minimum > maximum) {
          failSchema(path, 'minimum cannot exceed maximum.');
        }
        result = {
          type: node.type,
          ...description,
          ...(minimum === undefined ? {} : { minimum }),
          ...(maximum === undefined ? {} : { maximum }),
        };
        break;
      }
      case 'boolean':
        result = { type: node.type, ...description };
        break;
      case 'array': {
        const minItems = arrayBound(node.minItems, `${path}.minItems`);
        const maxItems = arrayBound(node.maxItems, `${path}.maxItems`);
        if (minItems !== undefined && maxItems !== undefined && minItems > maxItems) {
          failSchema(path, 'minItems cannot exceed maxItems.');
        }
        result = {
          type: 'array',
          ...description,
          items: visit(node.items, `${path}.items`, depth + 1),
          ...(minItems === undefined ? {} : { minItems }),
          ...(maxItems === undefined ? {} : { maxItems }),
        };
        break;
      }
      case 'object': {
        if (node.additionalProperties !== false) {
          failSchema(path, 'Objects require additionalProperties: false.');
        }
        const properties = schemaRecord(node.properties, `${path}.properties`);
        const compiledProperties = Object.fromEntries(
          Object.entries(properties).map(([key, child]) => [
            key,
            visit(child, `${path}.properties[${JSON.stringify(key)}]`, depth + 1),
          ])
        );
        const required =
          node.required === undefined ? undefined : schemaArray(node.required, `${path}.required`);
        if (
          required &&
          (!required.every((key) => typeof key === 'string' && hasOwn(properties, key)) ||
            new Set(required).size !== required.length)
        ) {
          failSchema(path, 'required must list distinct declared property names.');
        }
        result = {
          type: 'object',
          ...description,
          properties: compiledProperties,
          additionalProperties: false,
          ...(required === undefined ? {} : { required: [...(required as string[])] }),
        };
        break;
      }
      default:
        return failSchema(path, 'Unsupported schema type.');
    }
    ancestors.delete(node);
    return result;
  }
  return visit(schema, '$', 0);
}

/** Validate a complete value. The schema must already have passed compileSchema. */
export function validateValue(
  value: unknown,
  schema: ModelSchema,
  internalDepthAllowance: 0 | 2 = 0
): void {
  function visit(item: unknown, definition: ModelSchema, path: string, depth: number): void {
    const fail = (message: string): never => {
      throw new LanguageModelError('ERR_RESPONSE_INVALID', `${path}: ${message}`);
    };
    if (depth > MAX_SCHEMA_DEPTH + internalDepthAllowance)
      fail('The value exceeds the supported schema depth.');
    switch (definition.type) {
      case 'string':
        if (typeof item !== 'string') fail('Expected a string.');
        if (definition.enum && !definition.enum.includes(item as string)) {
          fail('The string is outside the enum.');
        }
        return;
      case 'number':
      case 'integer': {
        if (typeof item !== 'number' || !Number.isFinite(item)) fail('Expected a finite number.');
        const number = item as number;
        if (definition.type === 'integer' && !Number.isSafeInteger(item)) {
          fail('Expected a safe integer.');
        }
        if (definition.minimum !== undefined && number < definition.minimum) {
          fail('The number is below minimum.');
        }
        if (definition.maximum !== undefined && number > definition.maximum) {
          fail('The number is above maximum.');
        }
        return;
      }
      case 'boolean':
        if (typeof item !== 'boolean') fail('Expected a boolean.');
        return;
      case 'array':
        if (!Array.isArray(item)) fail('Expected an array.');
        if (definition.minItems !== undefined && (item as unknown[]).length < definition.minItems) {
          fail('The array has fewer than minItems elements.');
        }
        if (definition.maxItems !== undefined && (item as unknown[]).length > definition.maxItems) {
          fail('The array has more than maxItems elements.');
        }
        for (let index = 0; index < (item as unknown[]).length; index++) {
          visit((item as unknown[])[index], definition.items, `${path}[${index}]`, depth + 1);
        }
        return;
      case 'object': {
        if (!isObject(item)) fail('Expected an object.');
        const object = item as Record<string, unknown>;
        const prototype = Object.getPrototypeOf(object);
        if (prototype !== null && prototype !== Object.prototype) {
          fail('Expected a plain object.');
        }
        for (const key of definition.required ?? []) {
          if (!hasOwn(object, key)) fail(`Missing required property ${key}.`);
        }
        for (const key of Reflect.ownKeys(object)) {
          if (typeof key !== 'string' || !hasOwn(definition.properties, key)) {
            fail(`Unexpected property ${String(key)}.`);
          }
          const descriptor = Object.getOwnPropertyDescriptor(object, key)!;
          if (!hasOwn(descriptor, 'value')) fail('Values cannot contain accessor properties.');
          visit(
            descriptor.value,
            definition.properties[key as string]!,
            `${path}[${JSON.stringify(key)}]`,
            depth + 1
          );
        }
      }
    }
  }
  visit(value, schema, '$', 0);
}

/** Whether a schema contains numeric constraints unsupported by the browser Prompt API. */
export function hasNumericBounds(schema: ModelSchema): boolean {
  switch (schema.type) {
    case 'number':
    case 'integer':
      return schema.minimum !== undefined || schema.maximum !== undefined;
    case 'array':
      return hasNumericBounds(schema.items);
    case 'object':
      return Object.values(schema.properties).some(hasNumericBounds);
    default:
      return false;
  }
}

export function parseResponse(
  text: string,
  schema: ModelSchema,
  internalDepthAllowance: 0 | 2 = 0
): unknown {
  let result: unknown;
  try {
    result = JSON.parse(text);
  } catch (cause) {
    throw new LanguageModelError('ERR_RESPONSE_INVALID', 'The response is not complete JSON.', {
      cause,
    });
  }
  validateValue(result, schema, internalDepthAllowance);
  return result;
}
