import { joinWithCommasAnd } from '../strings';

describe(joinWithCommasAnd, () => {
  it(`joins 3+ items with an oxford comma`, () => {
    expect(joinWithCommasAnd(['a', 'b', 'c'])).toEqual('a, b, and c');
  });

  it(`joins 2 items with an 'and'`, () => {
    expect(joinWithCommasAnd(['a', 'b'])).toEqual('a and b');
  });

  it(`returns a single item`, () => {
    expect(joinWithCommasAnd(['a'])).toEqual('a');
  });

  it(`returns an empty string for zero items`, () => {
    expect(joinWithCommasAnd([])).toEqual('');
  });

  it(`joins limit+1 with 'and 1 other'`, () => {
    expect(joinWithCommasAnd(['a', 'b', 'c', 'd', 'e'], 4)).toEqual('a, b, c, d, and 1 other');
  });

  it(`joins limit+1 with 'and 1 other'`, () => {
    expect(joinWithCommasAnd(['a', 'b', 'c', 'd', 'e'], 4)).toEqual('a, b, c, d, and 1 other');
  });

  it(`joins limit+2 or more with 'and x others'`, () => {
    expect(joinWithCommasAnd(['a', 'b', 'c', 'd', 'e', 'f'], 4)).toEqual(
      'a, b, c, d, and 2 others'
    );
  });

  it(`eliminates duplicates`, () => {
    expect(joinWithCommasAnd(['a', 'c', 'b', 'c'])).toEqual('a, c, and b');
  });
});
