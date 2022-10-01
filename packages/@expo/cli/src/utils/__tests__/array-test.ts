import { findLastIndex, groupBy, intersecting, replaceValue } from '../array';

describe(findLastIndex, () => {
  it('should return the last index of an item based on a given criteria', () => {
    const array = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const predicate = (item: number) => item % 2 === 0;
    expect(findLastIndex(array, predicate)).toBe(9);
  });
});

describe(intersecting, () => {
  it('should return a list of items that intersect between two given arrays', () => {
    const a = [1, 2, 3];
    const b = [1, 2, 3, 4, 5, 6];
    expect(intersecting(a, b)).toEqual([1, 2, 3]);
  });
});

describe(replaceValue, () => {
  it(`should replace a value in an array`, () => {
    expect(replaceValue([1, 2, 3], 1, 2)).toEqual([2, 2, 3]);
    expect(replaceValue([1, 2, 3], 4, 5)).toEqual([1, 2, 3]);
  });
});

describe(groupBy, () => {
  it(`should group list items by returned key`, () => {
    expect(
      groupBy([{ name: 'John' }, { name: 'Wick' }], (character) => character.name)
    ).toMatchObject({
      John: [{ name: 'John' }],
      Wick: [{ name: 'Wick' }],
    });
  });
});
