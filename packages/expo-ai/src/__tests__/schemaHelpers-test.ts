import type { ModelSchema } from '../LanguageModels.types';
import { compileSchema, validateValue } from '../schema';
import { schema } from '../schemaHelpers';

it('creates closed objects with required fields and explicit optional properties', () => {
  const definition = schema.object({
    title: schema.string({ description: 'A short title.' }),
    category: schema.enum(['work', 'personal']),
    score: schema.optional(schema.number({ minimum: 0, maximum: 1 })),
    items: schema.array(
      schema.object({ count: schema.integer({ minimum: 1 }), active: schema.boolean() }),
      {
        minItems: 1,
        maxItems: 3,
      }
    ),
  });
  expect(definition.required).toEqual(['title', 'category', 'items']);
  expect(definition.additionalProperties).toBe(false);
  expect(definition.properties.score).toEqual({ type: 'number', minimum: 0, maximum: 1 });
  expect(compileSchema(definition)).toEqual(definition);
  expect(() =>
    validateValue(
      {
        title: 'Notes',
        category: 'work',
        items: [{ count: 1, active: false }],
      },
      definition
    )
  ).not.toThrow();
  expect(() => validateValue({ title: 'Notes', category: 'work' }, definition)).toThrow();
  expect(() =>
    validateValue({ title: 'Notes', category: 'work', items: [], extra: true }, definition)
  ).toThrow();
});

it('mixes plain schemas with helpers and snapshots properties, options, and optional schemas', () => {
  const values: [string, ...string[]] = ['work', 'personal'];
  const field = { type: 'string' as const, description: 'Original' };
  const optional = schema.optional(field);
  const definition = schema.object({
    plain: field,
    optional,
    category: schema.enum(values),
  });
  field.description = 'Changed';
  values.push('other');
  expect(definition.properties.plain.description).toBe('Original');
  expect(definition.properties.optional.description).toBe('Original');
  expect(definition.properties.category.enum).toEqual(['work', 'personal']);
  expect(definition.required).toEqual(['plain', 'category']);
});

it('supports empty objects and prototype-like property names as ordinary own properties', () => {
  expect(schema.object({}).required).toEqual([]);
  const properties = JSON.parse('{"__proto__":{"type":"string"},"constructor":{"type":"boolean"}}');
  const definition = schema.object(properties);
  expect(Object.getPrototypeOf(definition.properties)).toBe(Object.prototype);
  expect(definition.required).toEqual(['__proto__', 'constructor']);
  expect(() =>
    validateValue(JSON.parse('{"__proto__":"safe","constructor":true}'), definition)
  ).not.toThrow();
});

it('rejects unsupported helper options and schemas without overriding the declared type', () => {
  expect(() => schema.string({ type: 'number' } as never)).toThrow();
  expect(() => schema.number({ minimum: 2, maximum: 1 })).toThrow();
  expect(() => schema.integer({ minimum: 0.5 })).toThrow();
  expect(() => schema.array(schema.string(), { minItems: 2, maxItems: 1 })).toThrow();
  expect(() => schema.enum([] as never)).toThrow();
  expect(() => schema.enum(['same', 'same'])).toThrow();
  expect(() => schema.optional({ type: 'null' } as unknown as ModelSchema)).toThrow();
  expect(() => compileSchema(schema.optional(schema.string()))).toThrow();
});

it('rejects accessor properties and options before reading them', () => {
  const get = jest.fn(() => schema.string());
  const properties = Object.defineProperty({}, 'name', {
    get,
    enumerable: true,
  });
  expect(() => schema.object(properties)).toThrow();
  expect(() =>
    schema.string(Object.defineProperty({}, 'description', { get, enumerable: true }))
  ).toThrow();
  expect(get).not.toHaveBeenCalled();
});
