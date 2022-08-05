import { resolveRef } from '../reference';
import { Schema } from '../types';

const schema: Schema = {
  type: 'object',
  properties: {
    testDict: {
      '$ref': '#/definitions/dict',
    },
  },
  definitions: {
    dict: {
      type: 'object',
      properties: {
        propA: { type: 'string' },
        propB: { type: 'number' },
      },
    },
    deep: {
      dict: {
        type: 'object',
        properties: {
          test: { type: 'boolean' },
        },
      },
    },
  },
};

describe(resolveRef, () => {
  it(`validates path starting with '#/'`, () => {
    expect(() => resolveRef(schema, 'invalid/path')).toThrow('valid JSON Schema path starts with');
  });

  it(`resolves #/definitions/dictionary`, () => {
    expect(resolveRef(schema, '#/definitions/dict')).toBe(schema.definitions!.dict);
  });

  it(`resolves #/definitions/deep/dict`, () => {
    expect(resolveRef(schema, '#/definitions/deep/dict')).toBe(schema.definitions!.deep.dict);
  });
});
