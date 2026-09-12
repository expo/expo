import type { ModelSchema } from '../LanguageModels.types';
import { compileSchema, parseResponse, validateValue } from '../schema';

const schema: ModelSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    category: { type: 'string', enum: ['work', 'personal'] },
    priority: { type: 'integer' },
    active: { type: 'boolean' },
    scores: { type: 'array', items: { type: 'number' }, minItems: 1, maxItems: 2 },
  },
  required: ['category'],
};

describe('schema dialect', () => {
  it('copies nested schemas, descriptions, required fields, and enums independently', () => {
    const input = { type: 'string', description: 'Category', enum: ['work', 'personal'] };
    const compiled = compileSchema(input);
    input.enum.push('later');
    expect(compiled).toEqual({
      type: 'string',
      description: 'Category',
      enum: ['work', 'personal'],
    });
    expect(compileSchema(schema)).toEqual(schema);
  });

  it.each([
    { type: 'string', pattern: 'x' },
    { type: 'string', format: 'email' },
    { type: 'string', minLength: 1 },
    { type: 'string', additionalProperties: false },
    { type: 'number', enum: [1] },
    { type: 'boolean', enum: [true] },
    { type: 'null' },
    { type: ['string', 'null'] },
    { $ref: '#/x' },
    { type: 'string', ignored: undefined },
    { type: '__proto__' },
  ])('rejects unsupported keywords and types: %p', (input) => {
    expect(() => compileSchema(input)).toThrow(
      expect.objectContaining({ code: 'ERR_SCHEMA_UNSUPPORTED' })
    );
  });

  it.each([
    { type: 'array', items: { type: 'string' }, minItems: -1 },
    { type: 'array', items: { type: 'string' }, minItems: 1.5 },
    { type: 'array', items: { type: 'string' }, maxItems: Infinity },
    { type: 'array', items: { type: 'string' }, maxItems: Number.MAX_SAFE_INTEGER + 1 },
    { type: 'array', items: { type: 'string' }, minItems: 3, maxItems: 2 },
    { type: 'array', items: { type: 'string' }, minItems: null },
    { type: 'array' },
  ])('rejects malformed array bounds and items: %p', (input) => {
    expect(() => compileSchema(input)).toThrow(
      expect.objectContaining({ code: 'ERR_SCHEMA_UNSUPPORTED' })
    );
  });

  it('accepts inclusive numeric bounds and snapshots them independently', () => {
    const input = { type: 'number', minimum: -1.5, maximum: 2 };
    const compiled = compileSchema(input);
    input.minimum = -10;
    expect(compiled).toEqual({ type: 'number', minimum: -1.5, maximum: 2 });
    expect(compileSchema({ type: 'integer', minimum: 0, maximum: 10 })).toEqual({
      type: 'integer',
      minimum: 0,
      maximum: 10,
    });
  });

  it.each([
    { type: 'number', minimum: Infinity },
    { type: 'number', maximum: NaN },
    { type: 'number', minimum: '0' },
    { type: 'number', minimum: 2, maximum: 1 },
    { type: 'integer', minimum: 0.5 },
    { type: 'integer', maximum: Number.MAX_SAFE_INTEGER + 1 },
  ])('rejects malformed numeric bounds: %p', (input) => {
    expect(() => compileSchema(input)).toThrow(
      expect.objectContaining({ code: 'ERR_SCHEMA_UNSUPPORTED' })
    );
  });

  it.each([
    { type: 'object', properties: {} },
    { type: 'object', properties: {}, additionalProperties: true },
    { type: 'object', properties: null, additionalProperties: false },
    { type: 'object', properties: {}, required: ['missing'], additionalProperties: false },
    {
      type: 'object',
      properties: { a: { type: 'string' } },
      required: ['a', 'a'],
      additionalProperties: false,
    },
    { type: 'string', enum: [] },
    { type: 'string', enum: ['a', 'a'] },
    { type: 'string', enum: [1] },
    { type: 'string', enum: new Array(1) },
  ])('rejects malformed object and enum declarations: %p', (input) => {
    expect(() => compileSchema(input)).toThrow(
      expect.objectContaining({ code: 'ERR_SCHEMA_UNSUPPORTED' })
    );
  });

  it('rejects accessors without invoking them and rejects custom prototypes', () => {
    const get = jest.fn(() => 'string');
    expect(() =>
      compileSchema(Object.defineProperty({}, 'type', { get, enumerable: true }))
    ).toThrow();
    expect(get).not.toHaveBeenCalled();
    expect(() => compileSchema(Object.create({ type: 'string' }))).toThrow();
    expect(() => compileSchema({ type: 'string', [Symbol('extra')]: true })).toThrow();
    const values = ['a'];
    Object.defineProperty(values, '0', { get, enumerable: true });
    expect(() => compileSchema({ type: 'string', enum: values })).toThrow();
    expect(get).not.toHaveBeenCalled();
  });

  it('rejects cycles and excessive depth but permits reused schema nodes', () => {
    const cycle: { type: string; items?: unknown } = { type: 'array' };
    cycle.items = cycle;
    expect(() => compileSchema(cycle)).toThrow();
    let deep: unknown = { type: 'string' };
    for (let index = 0; index < 34; index++) deep = { type: 'array', items: deep };
    expect(() => compileSchema(deep)).toThrow();
    const shared = { type: 'string' };
    expect(
      compileSchema({
        type: 'object',
        properties: { a: shared, b: shared },
        additionalProperties: false,
      })
    ).toBeDefined();
  });

  it('handles prototype-like property names without treating inherited names as declarations', () => {
    const input = JSON.parse(
      '{"type":"object","properties":{"__proto__":{"type":"string"},"constructor":{"type":"boolean"}},"required":["__proto__"],"additionalProperties":false}'
    );
    const compiled = compileSchema(input);
    expect(parseResponse('{"__proto__":"safe","constructor":true}', compiled)).toEqual(
      JSON.parse('{"__proto__":"safe","constructor":true}')
    );
    expect(() => parseResponse('{"toString":"unexpected"}', compiled)).toThrow();
    expect(Object.getPrototypeOf(compiled)).toBe(Object.prototype);
  });
});

describe('complete response validation', () => {
  it('enforces inclusive numeric bounds', () => {
    const number = compileSchema({ type: 'number', minimum: -1.5, maximum: 2 });
    expect(() => validateValue(-1.5, number)).not.toThrow();
    expect(() => validateValue(2, number)).not.toThrow();
    expect(() => validateValue(-1.5001, number)).toThrow(
      expect.objectContaining({ code: 'ERR_RESPONSE_INVALID' })
    );
    expect(() => validateValue(2.0001, number)).toThrow(
      expect.objectContaining({ code: 'ERR_RESPONSE_INVALID' })
    );
  });

  it('allows optional fields and validates all supported scalar and array types', () => {
    expect(parseResponse('{"category":"work"}', schema)).toEqual({ category: 'work' });
    expect(
      parseResponse('{"category":"work","priority":3,"active":false,"scores":[1,2.5]}', schema)
    ).toEqual({ category: 'work', priority: 3, active: false, scores: [1, 2.5] });
    expect(
      parseResponse(
        '[]',
        compileSchema({ type: 'array', items: { type: 'string' }, minItems: 0, maxItems: 0 })
      )
    ).toEqual([]);
  });

  it.each([
    '```json\n{"category":"work"}\n```',
    '{"category":',
    '{}',
    '{"category":"other"}',
    '{"category":"work","extra":true}',
    '{"category":"work","priority":1.5}',
    '{"category":"work","priority":9007199254740992}',
    '{"category":"work","active":null}',
    '{"category":"work","scores":[]}',
    '{"category":"work","scores":[1,2,3]}',
    '{"category":"work","scores":[1e999]}',
  ])('rejects an incomplete or invalid response: %s', (text) => {
    expect(() => parseResponse(text, schema)).toThrow(
      expect.objectContaining({ code: 'ERR_RESPONSE_INVALID' })
    );
  });

  it('rejects unknown objects and never evaluates value getters', () => {
    const empty = compileSchema({ type: 'object', properties: {}, additionalProperties: false });
    expect(() => validateValue(new Date(), empty)).toThrow();
    const get = jest.fn(() => 'work');
    const value = Object.defineProperty({}, 'category', { get, enumerable: true });
    expect(() => validateValue(value, schema)).toThrow();
    expect(get).not.toHaveBeenCalled();
  });
});
