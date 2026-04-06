import { resolveProps, setAndroidStrings, setIOSStatusBarInfoPlist } from '../withStatusBar';

describe(setIOSStatusBarInfoPlist, () => {
  it(`sets hidden and style`, () => {
    expect(setIOSStatusBarInfoPlist({}, { hidden: true, style: 'light' })).toStrictEqual({
      UIStatusBarHidden: true,
      UIStatusBarStyle: 'UIStatusBarStyleLightContent',
    });
  });

  it(`sets dark style`, () => {
    expect(setIOSStatusBarInfoPlist({}, { style: 'dark' })).toStrictEqual({
      UIStatusBarStyle: 'UIStatusBarStyleDarkContent',
    });
  });

  it(`sets hidden only`, () => {
    expect(setIOSStatusBarInfoPlist({}, { hidden: true })).toStrictEqual({
      UIStatusBarHidden: true,
    });
  });

  it(`overrides existing UIStatusBarHidden`, () => {
    expect(setIOSStatusBarInfoPlist({ UIStatusBarHidden: false }, { hidden: true })).toStrictEqual({
      UIStatusBarHidden: true,
    });
  });

  it(`overrides existing UIStatusBarStyle`, () => {
    expect(
      setIOSStatusBarInfoPlist({ UIStatusBarStyle: 'UIStatusBarStyleDefault' }, { style: 'light' })
    ).toStrictEqual({
      UIStatusBarStyle: 'UIStatusBarStyleLightContent',
    });
  });

  it(`does nothing with empty props`, () => {
    expect(setIOSStatusBarInfoPlist({}, {})).toStrictEqual({});
  });

  it(`preserves existing infoPlist entries`, () => {
    expect(setIOSStatusBarInfoPlist({ CFBundleName: 'MyApp' }, { style: 'dark' })).toStrictEqual({
      CFBundleName: 'MyApp',
      UIStatusBarStyle: 'UIStatusBarStyleDarkContent',
    });
  });
});

describe(resolveProps, () => {
  it(`returns undefined for nullish or empty props`, () => {
    expect(resolveProps(undefined)).toBeUndefined();
    expect(resolveProps({})).toBeUndefined();
    expect(resolveProps({ style: null })).toBeUndefined();
  });

  it(`resolves props`, () => {
    expect(resolveProps({ style: 'dark' })).toStrictEqual({ style: 'dark' });
    expect(resolveProps({ hidden: true })).toStrictEqual({ hidden: true });
  });
});

describe(setAndroidStrings, () => {
  const getAllProps = () => ({ hidden: true, style: 'dark' }) as const;

  it(`sets all strings`, () => {
    expect(setAndroidStrings({ resources: {} }, getAllProps())).toStrictEqual({
      resources: {
        string: [
          {
            $: {
              name: 'expo_status_bar_visibility',
              translatable: 'false',
            },
            _: 'hidden',
          },
        ],
      },
    });
  });

  it(`sets no strings`, () => {
    expect(
      setAndroidStrings(
        {
          resources: {
            string: [],
          },
        },
        {}
      )
    ).toStrictEqual({
      resources: {
        string: [],
      },
    });
  });

  it(`unsets string`, () => {
    // Set all strings
    const strings = setAndroidStrings({ resources: {} }, getAllProps());

    // Unset all strings
    expect(setAndroidStrings(strings, {})).toStrictEqual({
      resources: {
        string: [],
      },
    });
  });

  it(`redefines duplicates`, () => {
    // Set all strings
    const strings = setAndroidStrings({ resources: {} }, { hidden: true });

    expect(strings.resources.string).toStrictEqual([
      {
        $: { name: 'expo_status_bar_visibility', translatable: 'false' },
        // Test an initial value
        _: 'hidden',
      },
    ]);

    expect(setAndroidStrings(strings, { hidden: false }).resources.string).toStrictEqual([
      {
        $: { name: 'expo_status_bar_visibility', translatable: 'false' },
        // Test a redefined value
        _: 'visible',
      },
    ]);
  });
});
