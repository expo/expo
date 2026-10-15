import type { JSONSchema } from './JSONSchema';
import { validateSchema } from './validate';

export type SchemaVisitor = (schema: JSONSchema, value: unknown, path: string) => void;

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

const matches = (schema: JSONSchema, value: unknown, path: string): boolean =>
  validateSchema(schema, value, path) === null;

const visitEach = (
  schemas: unknown,
  value: unknown,
  visitor: SchemaVisitor,
  path: string,
  applies: (schema: JSONSchema) => boolean = () => true
): void => {
  if (!Array.isArray(schemas)) {
    return;
  }
  for (const item of schemas) {
    if (isSchemaNode(item) && applies(item)) {
      visitNode(item, value, visitor, path);
    }
  }
};

// Only the subschemas that apply to `value` are visited. A `oneOf`/`anyOf`
// branch the value does not match, or the `then`/`else` its `if` did not
// select, describes some other value: visiting it reported, for example, the
// image branch of `ios.icon` for a `.icon` directory. Without a value there is
// nothing to match against, so every subschema is visited.
const visitCombinators = (
  schema: JSONSchema,
  value: unknown,
  visitor: SchemaVisitor,
  path: string
): void => {
  const hasValue = value !== undefined;
  const applies = (branch: JSONSchema) => !hasValue || matches(branch, value, path);

  visitEach(schema.allOf, value, visitor, path);
  visitEach(schema.anyOf, value, visitor, path, applies);
  visitEach(schema.oneOf, value, visitor, path, applies);

  const { if: condition, then: consequent, else: alternative } = schema;
  if (!isSchemaNode(condition)) {
    return;
  }
  if (!hasValue) {
    for (const branch of [condition, consequent, alternative]) {
      if (isSchemaNode(branch)) {
        visitNode(branch, value, visitor, path);
      }
    }
    return;
  }
  const branch = matches(condition, value, path) ? consequent : alternative;
  if (isSchemaNode(branch)) {
    visitNode(branch, value, visitor, path);
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
