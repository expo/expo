import { decorateValue } from './APISectionTypes';

describe('APISectionTypes.decorateValue', () => {
  test('null', () => {
    expect(decorateValue({ type: 'literal', value: null })).toBe('`null`');
  });

  test('generic types', () => {
    expect(decorateValue({ type: 'intrinsic', name: 'number' })).toBe('`number`');
    expect(decorateValue({ type: 'intrinsic', name: 'string' })).toBe('`string`');
  });

  test('string value', () => {
    expect(decorateValue({ type: 'literal', value: 'never' })).toBe("`'never'`");
  });

  test('Record', () => {
    expect(
      decorateValue({
        name: 'Record',
        type: 'reference',
        typeArguments: [
          { type: 'intrinsic', name: 'string' },
          { type: 'intrinsic', name: 'any' },
        ],
      })
    ).toBe('`Record<string,any>`');
  });
});
