import {
  resolveAndroidLegacyProps,
  setAndroidStrings,
  setIOSStatusBarInfoPlist,
  withStatusBarExpoGoManifest,
} from '../withStatusBar';

describe(resolveAndroidLegacyProps, () => {
  it(`resolves no legacy props`, () => {
    expect(resolveAndroidLegacyProps({})).toStrictEqual({
      hidden: undefined,
      style: undefined,
    });
  });

  it(`resolves legacy props`, () => {
    expect(
      resolveAndroidLegacyProps({
        androidStatusBar: { hidden: true, barStyle: 'light-content' },
      })
    ).toStrictEqual({
      hidden: true,
      style: 'light',
    });
  });
});

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

describe(withStatusBarExpoGoManifest, () => {
  it(`ensures manifest values (using plugin props)`, () => {
    expect(
      withStatusBarExpoGoManifest(
        { name: '', slug: '' },
        {
          hidden: true,
          style: 'dark',
        }
      )
    ).toStrictEqual({
      name: expect.any(String),
      slug: expect.any(String),
      androidStatusBar: {
        barStyle: 'dark-content',
        hidden: true,
      },
      extra: {
        'expo-status-bar': {
          hidden: true,
          style: 'dark',
        },
      },
    });
  });

  it(`ensures manifest values (using android legacy props)`, () => {
    expect(
      withStatusBarExpoGoManifest(
        {
          name: '',
          slug: '',
          androidStatusBar: {
            barStyle: 'dark-content',
            hidden: true,
          },
        },
        undefined
      )
    ).toStrictEqual({
      name: expect.any(String),
      slug: expect.any(String),
      androidStatusBar: {
        barStyle: 'dark-content',
        hidden: true,
      },
      extra: {
        'expo-status-bar': {
          hidden: true,
          style: 'dark',
        },
      },
    });
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
