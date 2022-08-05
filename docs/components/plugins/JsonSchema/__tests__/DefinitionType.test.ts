import { getPropertyType } from '../DefinitionType';
import { Schema } from '../utils/types';

const schema: Schema = {
  definitions: {
    test: { type: 'string' },
  },
  properties: {
    testRef: { $ref: '#/definitions/test' },
    testBoolean: { type: 'boolean' },
    testNumber: { type: 'number' },
    testString: { type: 'string' },
    testConst: { const: 'arbitrary' },
    testEnum: { enum: ['one', 'two'] },
    testStringDate: { type: 'string', format: 'date' },
    testStringDateTime: { type: 'string', format: 'date-time' },
    testOneOf: {
      oneOf: [{ type: 'string' }, { type: 'boolean' }],
    },
    testAnyOf: {
      anyOf: [{ type: 'number' }, { type: 'boolean' }],
    },
    testArray: { type: 'array' },
    testArrayObject: {
      type: 'array',
      items: { type: 'string' },
    },
    testArrayObjectOneOf: {
      type: 'array',
      items: {
        oneOf: [{ type: 'string' }, { type: 'number' }],
      },
    },
    testArrayObjectAnyOf: {
      type: 'array',
      items: {
        anyOf: [{ type: 'boolean' }, { type: 'string' }],
      },
    },
  },
};

describe(getPropertyType, () => {
  it('returns referenced definition type', () => {
    expect(getPropertyType(schema, schema.properties!.testRef)).toBe(schema.definitions!.test.type);
  });

  it('returns null without definition', () => {
    expect(getPropertyType(schema, null)).toBeNull();
  });

  it('returns primitive types', () => {
    expect(getPropertyType(schema, schema.properties!.testBoolean)).toBe('boolean');
    expect(getPropertyType(schema, schema.properties!.testNumber)).toBe('number');
    expect(getPropertyType(schema, schema.properties!.testString)).toBe('string');
  });

  it('returns const value as type', () => {
    expect(getPropertyType(schema, schema.properties!.testConst)).toBe(
      schema.properties!.testConst.const
    );
  });

  it('returns enum value as type', () => {
    expect(getPropertyType(schema, schema.properties!.testEnum, false)).toBe('enum');
    expect(getPropertyType(schema, schema.properties!.testEnum, true)).toBe(
      `enum: ${schema.properties!.testEnum.enum!.join(', ')}`
    );
  });

  it('returns oneOf types', () => {
    expect(getPropertyType(schema, schema.properties!.testOneOf)).toBe('string|boolean');
  });

  it('returns anyOf types', () => {
    expect(getPropertyType(schema, schema.properties!.testAnyOf)).toBe('number|boolean');
  });

  it('returns array without items type', () => {
    expect(getPropertyType(schema, schema.properties!.testArray)).toBe('array');
  });

  it('returns array with items object', () => {
    expect(getPropertyType(schema, schema.properties!.testArrayObject)).toBe('string[]');
  });

  it('returns array with items object and oneOf types', () => {
    expect(getPropertyType(schema, schema.properties!.testArrayObjectOneOf)).toBe(
      '(string|number)[]'
    );
  });

  it('returns array with items object and anyOf types', () => {
    expect(getPropertyType(schema, schema.properties!.testArrayObjectAnyOf)).toBe(
      '(boolean|string)[]'
    );
  });

  it('returns date-formatted string as date type', () => {
    expect(getPropertyType(schema, schema.properties!.testStringDate)).toBe('Date');
    expect(getPropertyType(schema, schema.properties!.testStringDateTime)).toBe('Date');
  });
});
