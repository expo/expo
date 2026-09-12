import { LanguageModelError } from './LanguageModelError';
import type { ModelSchema } from './LanguageModels.types';
import { compileSchema } from './schema';

/** Describes a schema value to the model. */
export type SchemaOptions = { readonly description?: string };

/** Bounds the number of items in an array. */
export type ArraySchemaOptions = SchemaOptions & {
  readonly minItems?: number;
  readonly maxItems?: number;
};

/** Inclusively bounds a numeric value. */
export type NumericSchemaOptions = SchemaOptions & {
  readonly minimum?: number;
  readonly maximum?: number;
};

/** @hidden */
declare const optionalSchema: unique symbol;

/** A property marker for schema.object; it is not a standalone JSON schema. @hidden */
export type OptionalSchema<S extends ModelSchema> = {
  readonly [optionalSchema]: S;
};

type SchemaProperty = ModelSchema | OptionalSchema<ModelSchema>;
type RequiredPropertyKeys<P> = {
  [K in keyof P]-?: P[K] extends OptionalSchema<ModelSchema> ? never : K;
}[keyof P] &
  string;

type ObjectDefinition<P extends Readonly<Record<string, SchemaProperty>>> = SchemaOptions & {
  readonly type: 'object';
  readonly properties: {
    readonly [K in keyof P]: P[K] extends OptionalSchema<infer S>
      ? S
      : P[K] extends ModelSchema
        ? P[K]
        : never;
  };
  readonly required: readonly RequiredPropertyKeys<P>[];
  readonly additionalProperties: false;
};

const optionalDefinitions = new WeakMap<object, ModelSchema>();
const hasOwn = (value: object, key: PropertyKey) =>
  Object.prototype.hasOwnProperty.call(value, key);

function record(value: unknown, label: string): Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new LanguageModelError('ERR_SCHEMA_UNSUPPORTED', `${label} must be a plain object.`);
  }
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== null && prototype !== Object.prototype) {
    throw new LanguageModelError('ERR_SCHEMA_UNSUPPORTED', `${label} must be a plain object.`);
  }
  for (const key of Reflect.ownKeys(value)) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key)!;
    if (typeof key !== 'string' || !descriptor.enumerable || !hasOwn(descriptor, 'value')) {
      throw new LanguageModelError(
        'ERR_SCHEMA_UNSUPPORTED',
        `${label} must contain enumerable string properties without accessors.`
      );
    }
  }
  return value as Record<string, unknown>;
}

function options(
  value: unknown,
  kind: 'basic' | 'array' | 'numeric' = 'basic'
): Record<string, unknown> {
  if (value === undefined) return {};
  const result = record(value, 'Schema options');
  const allowed = new Set(
    kind === 'array'
      ? ['description', 'minItems', 'maxItems']
      : kind === 'numeric'
        ? ['description', 'minimum', 'maximum']
        : ['description']
  );
  for (const key of Object.keys(result)) {
    if (!allowed.has(key)) {
      throw new LanguageModelError('ERR_SCHEMA_UNSUPPORTED', `Unsupported schema option ${key}.`);
    }
  }
  return result;
}

function string(definition?: SchemaOptions): SchemaOptions & { readonly type: 'string' } {
  return compileSchema({
    type: 'string',
    ...options(definition),
  }) as SchemaOptions & {
    readonly type: 'string';
  };
}

function number(
  definition?: NumericSchemaOptions
): NumericSchemaOptions & { readonly type: 'number' } {
  return compileSchema({
    type: 'number',
    ...options(definition, 'numeric'),
  }) as NumericSchemaOptions & {
    readonly type: 'number';
  };
}

function integer(
  definition?: NumericSchemaOptions
): NumericSchemaOptions & { readonly type: 'integer' } {
  return compileSchema({
    type: 'integer',
    ...options(definition, 'numeric'),
  }) as NumericSchemaOptions & {
    readonly type: 'integer';
  };
}

function boolean(definition?: SchemaOptions): SchemaOptions & { readonly type: 'boolean' } {
  return compileSchema({
    type: 'boolean',
    ...options(definition),
  }) as SchemaOptions & {
    readonly type: 'boolean';
  };
}

function enumeration<const Values extends readonly [string, ...string[]]>(
  values: Values,
  definition?: SchemaOptions
): SchemaOptions & { readonly type: 'string'; readonly enum: Values } {
  return compileSchema({
    type: 'string',
    enum: values,
    ...options(definition),
  }) as SchemaOptions & {
    readonly type: 'string';
    readonly enum: Values;
  };
}

function array<const S extends ModelSchema>(
  items: S,
  definition?: ArraySchemaOptions
): ArraySchemaOptions & { readonly type: 'array'; readonly items: S } {
  return compileSchema({
    type: 'array',
    items,
    ...options(definition, 'array'),
  }) as ArraySchemaOptions & {
    readonly type: 'array';
    readonly items: S;
  };
}

function object<const P extends Readonly<Record<string, SchemaProperty>>>(
  properties: P,
  definition?: SchemaOptions
): ObjectDefinition<P> {
  const entries = record(properties, 'Object properties');
  const required: string[] = [];
  const schemas = Object.fromEntries(
    Object.entries(entries).map(([key, property]) => {
      const optional =
        property !== null && typeof property === 'object'
          ? optionalDefinitions.get(property)
          : undefined;
      if (optional) return [key, optional];
      required.push(key);
      return [key, property];
    })
  );
  return compileSchema({
    type: 'object',
    properties: schemas,
    required,
    additionalProperties: false,
    ...options(definition),
  }) as ObjectDefinition<P>;
}

function optional<const S extends ModelSchema>(definition: S): OptionalSchema<S> {
  const marker = Object.freeze({}) as OptionalSchema<S>;
  optionalDefinitions.set(marker, compileSchema(definition));
  return marker;
}

/**
 * Optional helpers for the supported JSON Schema dialect. Objects are closed
 * and properties are required unless wrapped in `schema.optional(...)`.
 * Helpers preserve literal types without `as const`. Supported plain JSON
 * schemas can also be used directly or combined with helpers. See the schema
 * helper reference for supported methods and options.
 * @hideType
 * @experimental
 */
export const schema = Object.freeze({
  string,
  number,
  integer,
  boolean,
  enum: enumeration,
  array,
  object,
  optional,
});
