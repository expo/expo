import type { JSONSchema } from './JSONSchema';

export type SchemaVisitor = (schema: JSONSchema, value: unknown, path: string) => void;

const COMBINATOR_KEYWORDS = ['allOf', 'anyOf', 'oneOf', 'if', 'then', 'else'];

const isSchemaNode = (value: unknown): value is JSONSchema =>
  value != null && typeof value === 'object' && !Array.isArray(value);

const isObject = (value: unknown): value is Record<string, unknown> =>
  value != null && typeof value === 'object' && !Array.isArray(value);

const valueAt = (value: unknown, key: string | number): unknown =>
  value != null && typeof value === 'object' ? (value as Record<string, unknown>)[key] : undefined;

const visitProperties = (
  properties: Record<string, unknown>,
  value: unknown,
  visitor: SchemaVisitor,
  path: string
): void => {
  for (const key in properties) {
    const child = properties[key];
    if (isSchemaNode(child)) {
      visitNode(child, valueAt(value, key), visitor, `${path}.${key}`);
    }
  }
};

const visitPatternProperties = (
  matched: Set<string>,
  patternProperties: Record<string, unknown>,
  keys: string[],
  value: Record<string, unknown>,
  visitor: SchemaVisitor,
  path: string
): void => {
  for (const pattern in patternProperties) {
    const child = patternProperties[pattern];
    if (!isSchemaNode(child)) {
      continue;
    }
    const propertyRe = new RegExp(pattern);
    for (const key of keys) {
      if (propertyRe.test(key)) {
        matched.add(key);
        visitNode(child, value[key], visitor, `${path}.${key}`);
      }
    }
  }
};

const visitAdditionalProperties = (
  additionalProperties: JSONSchema,
  properties: Record<string, unknown> | undefined,
  matched: Set<string>,
  keys: string[],
  value: Record<string, unknown>,
  visitor: SchemaVisitor,
  path: string
): void => {
  for (const key of keys) {
    if (!matched.has(key) && !properties?.[key]) {
      visitNode(additionalProperties, value[key], visitor, `${path}.${key}`);
    }
  }
};

const visitDependencies = (
  dependencies: Record<string, unknown>,
  value: Record<string, unknown>,
  visitor: SchemaVisitor,
  path: string
): void => {
  for (const key in dependencies) {
    const dependency = dependencies[key];
    if (value[key] !== undefined && isSchemaNode(dependency)) {
      visitNode(dependency, value, visitor, path);
    }
  }
};

const visitItems = (
  items: JSONSchema | JSONSchema[],
  additionalItems: boolean | JSONSchema | undefined,
  value: unknown,
  visitor: SchemaVisitor,
  path: string
): void => {
  if (!Array.isArray(items)) {
    if (isSchemaNode(items) && Array.isArray(value)) {
      for (let index = 0; index < value.length; index++) {
        visitNode(items, value[index], visitor, `${path}[${index}]`);
      }
    }
    return;
  }
  let index = 0;
  for (; index < items.length; index++) {
    const item = items[index];
    if (isSchemaNode(item)) {
      visitNode(item, valueAt(value, index), visitor, `${path}[${index}]`);
    }
  }
  if (isSchemaNode(additionalItems) && Array.isArray(value)) {
    for (; index < value.length; index++) {
      visitNode(additionalItems, value[index], visitor, `${path}[${index}]`);
    }
  }
};

const visitCombinators = (
  schema: JSONSchema,
  value: unknown,
  visitor: SchemaVisitor,
  path: string
): void => {
  for (const keyword of COMBINATOR_KEYWORDS) {
    const combinator = (schema as Record<string, unknown>)[keyword];
    if (Array.isArray(combinator)) {
      for (const item of combinator) {
        if (isSchemaNode(item)) {
          visitNode(item, value, visitor, path);
        }
      }
    } else if (isSchemaNode(combinator)) {
      visitNode(combinator, value, visitor, path);
    }
  }
};

export const visitNode = (
  schema: JSONSchema,
  value: unknown,
  visitor: SchemaVisitor,
  path = ''
): void => {
  visitor(schema, value, path);

  if (isSchemaNode(schema.properties)) {
    visitProperties(schema.properties as Record<string, unknown>, value, visitor, path);
  }
  if (schema.items != null) {
    visitItems(schema.items, schema.additionalItems, value, visitor, path);
  }

  if (isObject(value)) {
    const keys = Object.keys(value);
    const matched = new Set<string>();
    if (isSchemaNode(schema.patternProperties)) {
      visitPatternProperties(
        matched,
        schema.patternProperties as Record<string, unknown>,
        keys,
        value,
        visitor,
        path
      );
    }
    if (isSchemaNode(schema.additionalProperties)) {
      visitAdditionalProperties(
        schema.additionalProperties,
        isSchemaNode(schema.properties)
          ? (schema.properties as Record<string, unknown>)
          : undefined,
        matched,
        keys,
        value,
        visitor,
        path
      );
    }
    if (isObject(schema.dependencies)) {
      visitDependencies(schema.dependencies as Record<string, unknown>, value, visitor, path);
    }
  }

  visitCombinators(schema, value, visitor, path);
};
