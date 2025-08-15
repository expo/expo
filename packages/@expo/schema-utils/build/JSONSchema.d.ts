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
 */
export interface JSONSchema {
    id?: string;
    $schema?: string;
    title?: string;
    description?: string;
    default?: unknown;
    multipleOf?: number;
    maximum?: number;
    exclusiveMaximum?: boolean;
    minimum?: number;
    exclusiveMinimum?: boolean;
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
