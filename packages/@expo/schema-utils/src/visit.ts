import type { JSONSchema } from './JSONSchema';

export type SchemaVisitor = (schema: JSONSchema, path: string) => void;

// Keywords whose subschemas constrain the same data node, adding no path segment.
const COMBINATOR_KEYWORDS = ['allOf', 'anyOf', 'oneOf', 'if', 'then', 'else'];

const isSchemaNode = (value: unknown): value is JSONSchema =>
  value != null && typeof value === 'object' && !Array.isArray(value);

export function visitNode(schema: JSONSchema, visitor: SchemaVisitor, path = ''): void {
  visitor(schema, path);

  if (isSchemaNode(schema.properties)) {
    const properties = schema.properties as Record<string, unknown>;
    for (const key of Object.keys(properties)) {
      if (isSchemaNode(properties[key])) {
        visitNode(properties[key], visitor, `${path}.${key}`);
      }
    }
  }
  if (Array.isArray(schema.items)) {
    schema.items.forEach((item, index) => {
      if (isSchemaNode(item)) {
        visitNode(item, visitor, `${path}[${index}]`);
      }
    });
  }
  const node = schema as Record<string, unknown>;
  for (const keyword of COMBINATOR_KEYWORDS) {
    const value = node[keyword];
    if (Array.isArray(value)) {
      for (const item of value) {
        if (isSchemaNode(item)) {
          visitNode(item, visitor, path);
        }
      }
    } else if (isSchemaNode(value)) {
      visitNode(value, visitor, path);
    }
  }
}
