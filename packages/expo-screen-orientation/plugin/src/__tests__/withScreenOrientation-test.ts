import { setInitialOrientation, INITIAL_ORIENTATION_KEY } from '../withScreenOrientation';

describe(setInitialOrientation, () => {
  it(`sets landscape orientation`, () => {
    expect(
      setInitialOrientation({ initialOrientation: 'LANDSCAPE' }, {})[INITIAL_ORIENTATION_KEY]
    ).toBe('UIInterfaceOrientationMaskLandscape');
  });

  it(`throws on invalid orientation`, () => {
    // @ts-ignore
    expect(() => setInitialOrientation({ initialOrientation: 'ERRORMASK' }, {})).toThrow();
  });

  it(`removes initial orientation`, () => {
    expect(
      setInitialOrientation(
        {},
        { [INITIAL_ORIENTATION_KEY]: 'UIInterfaceOrientationMaskLandscape' }
      )[INITIAL_ORIENTATION_KEY]
    ).toBeUndefined();
  });
});
