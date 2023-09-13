import { replaceValue } from '../array';

describe(replaceValue, () => {
  it(`should replace a value in an array`, () => {
    expect(replaceValue([1, 2, 3], 1, 2)).toEqual([2, 2, 3]);
    expect(replaceValue([1, 2, 3], 4, 5)).toEqual([1, 2, 3]);
  });
});
