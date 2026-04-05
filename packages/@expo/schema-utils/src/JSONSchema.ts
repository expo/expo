/* eslint-disable @typescript-eslint/no-unused-vars */

/**
 * This interface was referenced by `JSONSchema`'s JSON-Schema
 * via the `definition` "positiveInteger".
 */
export type PositiveInteger = number;
/**
 * This interface was referenced by `JSONSchema`'s JSON-Schema
 * via the `definition` "positiveIntegerDefault0".
 */
export type PositiveIntegerDefault0 = PositiveInteger;
/**
 * @minItems 1
 *
 * This interface was referenced by `JSONSchema`'s JSON-Schema
 * via the `definition` "schemaArray".
 */
export type SchemaArray = [JSONSchema, ...JSONSchema[]];
/**
 * @minItems 1
 *
 * This interface was referenced by `JSONSchema`'s JSON-Schema
 * via the `definition` "stringArray".
 */
export type StringArray = [string, ...string[]];
/**
 * This interface was referenced by `JSONSchema`'s JSON-Schema
 * via the `definition` "simpleTypes".
 */
export type SimpleTypes = 'array' | 'boolean' | 'integer' | 'null' | 'number' | 'object' | 'string';

/**
 * Core schema meta-schema
 *
 * Supports both Draft 04 (`id`, boolean `exclusiveMinimum`/`exclusiveMaximum`) and
 * Draft 06+ (`$id`, numeric `exclusiveMinimum`/`exclusiveMaximum`) for backward compatibility.
 */
export interface JSONSchema<_SchemaType = unknown> {
  /** Draft 04: schema identifier */
  id?: string;
  /** Draft 06+: schema identifier (replaces `id`) */
  $id?: string;
  $schema?: string;
  title?: string;
  description?: string;
  default?: unknown;
  multipleOf?: number;
  maximum?: number;
  /**
   * Draft 04: boolean flag (used together with `maximum`).
   * Draft 06+: exclusive upper bound as a number (standalone, no need for `maximum`).
   */
  exclusiveMaximum?: boolean | number;
  minimum?: number;
  /**
   * Draft 04: boolean flag (used together with `minimum`).
   * Draft 06+: exclusive lower bound as a number (standalone, no need for `minimum`).
   */
  exclusiveMinimum?: boolean | number;
  maxLength?: PositiveInteger;
  minLength?: PositiveIntegerDefault0;
  pattern?: string;
  additionalItems?: boolean | JSONSchema;
  items?: JSONSchema | SchemaArray;
  maxItems?: PositiveInteger;
  minItems?: PositiveIntegerDefault0;
  uniqueItems?: boolean;
  maxProperties?: PositiveInteger;
  minProperties?: PositiveIntegerDefault0;
  required?: StringArray;
  additionalProperties?: boolean | JSONSchema;
  definitions?: {
    [k: string]: JSONSchema;
  };
  properties?: {
    [k: string]: JSONSchema;
  };
  patternProperties?: {
    [k: string]: JSONSchema;
  };
  dependencies?: {
    [k: string]: (JSONSchema | StringArray) | undefined;
  };
  /**
   * @minItems 1
   */
  enum?: [unknown, ...unknown[]];
  type?: SimpleTypes | [SimpleTypes, ...SimpleTypes[]];
  format?: string;
  allOf?: SchemaArray;
  anyOf?: SchemaArray;
  oneOf?: SchemaArray;
  not?: JSONSchema;
  [k: string]: unknown | undefined;
}
