import { parseParameter } from '../getNamedParametrizedRoute';

describe(parseParameter, () => {
  it(`matches optionals using non-standard from router v1`, () => {
    expect(parseParameter('[...all]')).toEqual({
      name: 'all',
      optional: true,
      repeat: true,
    });
  });
});
