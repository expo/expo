import { stringifySearchParams } from '../queryParams';

describe(stringifySearchParams, () => {
  it('encodes names and values using URLSearchParams encoding', () => {
    expect(stringifySearchParams({ 'a b+': 'café 😀+*~&=#/?' })).toBe(
      'a+b%2B=caf%C3%A9+%F0%9F%98%80%2B*%7E%26%3D%23%2F%3F'
    );
  });

  it('preserves entry and array order as repeated keys', () => {
    expect(stringifySearchParams({ z: ['second value', 'first+value'], a: 'last' })).toBe(
      'z=second+value&z=first%2Bvalue&a=last'
    );
  });

  it('omits undefined values and serializes null as an empty value', () => {
    expect(
      stringifySearchParams({
        omitted: undefined,
        nullValue: null,
        empty: '',
        mixed: [undefined, null, '', false, 0],
        literalNull: 'null',
        literalUndefined: 'undefined',
      })
    ).toBe(
      'nullValue=&empty=&mixed=&mixed=&mixed=false&mixed=0&literalNull=null&literalUndefined=undefined'
    );
  });

  it.each([{}, { omitted: undefined }, { empty: [] }, { empty: [undefined] }])(
    'returns an empty string when no values are serialized: %j',
    (params) => {
      expect(stringifySearchParams(params)).toBe('');
    }
  );

  it('converts non-string scalar values to strings', () => {
    expect(stringifySearchParams({ number: 42, boolean: false, object: {} })).toBe(
      'number=42&boolean=false&object=%5Bobject+Object%5D'
    );
  });

  it('does not mutate the input or its arrays', () => {
    const values = Object.freeze([undefined, null, 'a b']);
    const params = Object.freeze({ values, omitted: undefined });

    expect(stringifySearchParams(params)).toBe('values=&values=a+b');
    expect(params).toEqual({ values: [undefined, null, 'a b'], omitted: undefined });
  });
});
