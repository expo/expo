import {
  getOrientation,
  LANDSCAPE_ORIENTATIONS,
  PORTRAIT_ORIENTATIONS,
  setOrientation,
} from '../Orientation';

describe('orientation', () => {
  it(`returns null if nothing is provided`, () => {
    expect(getOrientation({})).toBe(null);
  });

  it(`returns the value if provided`, () => {
    expect(getOrientation({ orientation: 'portrait' })).toBe('portrait');
    expect(getOrientation({ orientation: 'landscape' })).toBe('landscape');
  });

  it(`sets to appropriate values`, () => {
    expect(setOrientation({ orientation: 'portrait' }, {})).toMatchObject({
      UISupportedInterfaceOrientations: PORTRAIT_ORIENTATIONS,
    });

    expect(setOrientation({ orientation: 'landscape' }, {})).toMatchObject({
      UISupportedInterfaceOrientations: LANDSCAPE_ORIENTATIONS,
    });

    expect(setOrientation({}, {})).toMatchObject({
      UISupportedInterfaceOrientations: [...PORTRAIT_ORIENTATIONS, ...LANDSCAPE_ORIENTATIONS],
    });
  });
});
