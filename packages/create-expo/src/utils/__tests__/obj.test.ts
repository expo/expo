import { deepMerge } from '../obj';

describe(deepMerge, () => {
  it('should merge objects', () => {
    const a = {
      a: 1,
      b: {
        c: 2,
        d: [{ f: [{}] }],
        e: {
          foo: 'bar',
        },
      },
    };
    const b = {
      a: 2,
      b: {
        c: 3,
        d: [{ g: [{}] }],
        e: {
          foo: 'bar2',
        },
      },
    };
    const c = deepMerge(a, b);
    expect(c).toEqual({ a: 2, b: { c: 3, d: [{ f: [{}] }, { g: [{}] }], e: { foo: 'bar2' } } });
  });
});
