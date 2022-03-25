import { memoize, guardAsync } from '../fn';

describe(memoize, () => {
  it(`memoizes`, () => {
    const fn = jest.fn(() => 'd');
    const memoized = memoize(fn);
    expect(memoized()).toEqual('d');
    expect(memoized()).toEqual('d');
    expect(memoized()).toEqual('d');
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

describe(guardAsync, () => {
  it(`guards async function`, async () => {
    const fn = jest.fn(async () => 'd');
    const guard = guardAsync(fn);
    expect(await guard()).toEqual('d');
    expect(await guard()).toEqual('d');
    expect(await guard()).toEqual('d');
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
