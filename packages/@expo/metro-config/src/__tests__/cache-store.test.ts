import { shouldSkipCache } from '../cache-store';

describe(shouldSkipCache, () => {
  it.each([{ skipCache: true }, { css: { skipCache: true } }])(
    'finds cache output marked with %p',
    (data) => {
      expect(shouldSkipCache({ output: [{ data: {} }, { data }] })).toBe(true);
    }
  );

  it('ignores cacheable output', () => {
    expect(
      shouldSkipCache({
        output: [{ data: { skipCache: false, css: { skipCache: false } } }],
      })
    ).toBe(false);
  });
});
