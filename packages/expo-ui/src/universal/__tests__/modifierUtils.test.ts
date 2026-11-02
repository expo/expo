import {
  createUniversalLayoutModifier,
  getUserSizingOverrides,
  omitUserOverridden,
  omitUserOverriddenDimensions,
  resetUniversalDimensionWarningsForTests,
  serializeUniversalDimensions,
} from '../modifierUtils';

describe('omitUserOverridden', () => {
  it('returns the derived modifiers as-is when the user supplies none', () => {
    const derived = [{ $type: 'background', color: 'red' }];
    expect(omitUserOverridden(derived, undefined)).toEqual(derived);
    expect(omitUserOverridden(derived, [])).toEqual(derived);
  });

  it('drops derived modifiers whose $type the user supplied', () => {
    const derived = [
      { $type: 'background', color: 'red' },
      { $type: 'padding', all: 8 },
    ];
    expect(omitUserOverridden(derived, [{ $type: 'padding', top: 4 }])).toEqual([
      { $type: 'background', color: 'red' },
    ]);
  });

  it('only drops derived modifiers, never user ones', () => {
    const derived = [{ $type: 'padding', all: 8 }];
    const user = [
      { $type: 'padding', top: 4 },
      { $type: 'padding', bottom: 2 },
    ];
    expect(omitUserOverridden(derived, user)).toEqual([]);
  });

  it('keeps a derived modifier whose type is preserved', () => {
    const derived = [
      { $type: 'frame', width: 10 },
      { $type: 'background', color: 'red' },
    ];
    expect(
      omitUserOverridden(derived, [{ $type: 'frame', height: 4 }], new Set(['frame']))
    ).toEqual(derived);
  });
});

describe('serializeUniversalDimensions', () => {
  beforeEach(() => {
    resetUniversalDimensionWarningsForTests();
  });

  it('reads fixed sizes as points and percentages as fractions', () => {
    expect(serializeUniversalDimensions({ width: 12, height: '50%' }, 'Column')).toEqual({
      widthPoints: 12,
      widthFraction: undefined,
      heightPoints: undefined,
      heightFraction: 0.5,
    });
  });

  it('accepts zero', () => {
    expect(serializeUniversalDimensions({ width: 0, height: '0%' })).toEqual({
      widthPoints: 0,
      widthFraction: undefined,
      heightPoints: undefined,
      heightFraction: 0,
    });
  });

  it('drops an invalid size and warns once per component axis', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

    expect(serializeUniversalDimensions({ width: -4 }, 'Column')).toEqual({
      widthPoints: undefined,
      widthFraction: undefined,
      heightPoints: undefined,
      heightFraction: undefined,
    });
    serializeUniversalDimensions({ width: Number.NaN }, 'Column');

    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]?.[0]).toEqual(expect.stringContaining('Column'));
    warn.mockRestore();
  });
});

describe('omitUserOverriddenDimensions', () => {
  const dimensions = {
    widthPoints: undefined,
    widthFraction: 0.5,
    heightPoints: 20,
    heightFraction: undefined,
  };

  it('drops only the axis a user modifier owns', () => {
    expect(
      omitUserOverriddenDimensions(dimensions, [{ $type: 'width', width: 8 }], 'android')
    ).toEqual({
      widthPoints: undefined,
      widthFraction: undefined,
      heightPoints: 20,
      heightFraction: undefined,
    });
  });

  it('keeps a cross-axis percentage when the user sets weight', () => {
    expect(getUserSizingOverrides([{ $type: 'weight', weight: 1 }], 'android')).toEqual({
      width: false,
      height: false,
    });
    expect(
      omitUserOverriddenDimensions(dimensions, [{ $type: 'weight', weight: 1 }], 'android')
    ).toEqual(dimensions);
  });

  it('keeps a percentage when defaultMinSize sets a minimum', () => {
    expect(
      omitUserOverriddenDimensions(
        dimensions,
        [{ $type: 'defaultMinSize', minWidth: 8, minHeight: 8 }],
        'android'
      )
    ).toEqual(dimensions);
  });

  it('keeps a percentage when a frame sets only a minimum or maximum', () => {
    expect(
      omitUserOverriddenDimensions(
        dimensions,
        [{ $type: 'frame', minWidth: 20, maxHeight: 40 }],
        'ios'
      )
    ).toEqual(dimensions);
  });

  it('drops an iOS axis when the user frame sets that axis', () => {
    expect(
      omitUserOverriddenDimensions(dimensions, [{ $type: 'frame', height: 12 }], 'ios')
    ).toEqual({
      widthPoints: undefined,
      widthFraction: 0.5,
      heightPoints: undefined,
      heightFraction: undefined,
    });
  });
});

describe('createUniversalLayoutModifier', () => {
  it('returns nothing when no dimension is set', () => {
    expect(
      createUniversalLayoutModifier({
        widthPoints: undefined,
        widthFraction: undefined,
        heightPoints: undefined,
        heightFraction: undefined,
      })
    ).toBeUndefined();
  });

  it('keeps a zero size', () => {
    expect(createUniversalLayoutModifier({ widthPoints: 0 })).toEqual({
      $type: 'universalLayout',
      widthPoints: 0,
    });
  });
});
