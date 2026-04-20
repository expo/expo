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
 * Core schema meta-schema.
 *
 * Supports both Draft 04 and Draft 06 keywords:
 * - `id` (Draft 04) and `$id` (Draft 06)
 * - boolean `exclusiveMinimum`/`exclusiveMaximum` (Draft 04, used alongside `minimum`/`maximum`)
 * - numeric `exclusiveMinimum`/`exclusiveMaximum` (Draft 06, standalone bounds)
 *
 * The runtime validator in `validate.ts` already handles both forms correctly.
 */
export interface JSONSchema<_SchemaType = unknown> {
    /** @deprecated Use `$id` (Draft 06+). Kept for Draft 04 backward compatibility. */
    id?: string;
    /** Draft 06+: replaces the Draft 04 `id` keyword. */
    $id?: string;
    $schema?: string;
    title?: string;
    description?: string;
    default?: unknown;
    multipleOf?: number;
    maximum?: number;
    /**
     * Draft 04: `true` means the value must be strictly less than `maximum`.
     * Draft 06+: a number that is itself the exclusive upper bound (no need for `maximum`).
     */
    exclusiveMaximum?: boolean | number;
    minimum?: number;
    /**
     * Draft 04: `true` means the value must be strictly greater than `minimum`.
     * Draft 06+: a number that is itself the exclusive lower bound (no need for `minimum`).
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
