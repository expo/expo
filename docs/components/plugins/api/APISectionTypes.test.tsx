import { decorateValue } from './APISectionTypes';

describe('APISectionTypes.decorateValue', () => {
  test('null', () => {
    expect(decorateValue({ type: 'literal', value: null })).toBe('`null`');
  });

  test('number', () => {
    expect(decorateValue({ type: 'intrinsic', name: 'number' })).toBe('`number`');
  });

  test('string', () => {
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
