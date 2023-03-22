import { setToUnionType } from '../utils';

describe(setToUnionType, () => {
  it('can print a type', () => {
    expect(setToUnionType(new Set(['a', 'b', 'c']))).toBe('`a` | `b` | `c`');
  });
});
