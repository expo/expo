import { AndroidConfig, WarningAggregator } from 'expo/config-plugins';

import {
  resolveProps,
  setNavigationBarColors,
  setNavigationBarStyles,
  setStrings,
  withAndroidNavigationBarExpoGoManifest,
} from '../withNavigationBar';

jest.mock('expo/config-plugins', () => {
  const plugins = jest.requireActual('expo/config-plugins');
  return {
    ...plugins,
    WarningAggregator: { addWarningAndroid: jest.fn() },
  };
});

describe(resolveProps, () => {
  it(`resolves no props`, () => {
    expect(resolveProps({})).toStrictEqual({
      barStyle: undefined,
      backgroundColor: undefined,
      legacyVisible: undefined,
    });
  });
  it(`resolves legacy props`, () => {
    jest.mocked(WarningAggregator.addWarningAndroid).mockClear();
    expect(
      resolveProps({
        androidNavigationBar: {
          visible: 'leanback',
          backgroundColor: '#fff000',
          barStyle: 'light-content',
        },
      })
    ).toStrictEqual({
      barStyle: 'light',
      backgroundColor: '#fff000',
      legacyVisible: 'leanback',
    });
    expect(WarningAggregator.addWarningAndroid).toHaveBeenCalledTimes(1);
  });
  it(`skips legacy props if any config plugin props are provided`, () => {
    jest.mocked(WarningAggregator.addWarningAndroid).mockClear();
    expect(
      resolveProps(
        {
          androidNavigationBar: {
            visible: 'leanback',
            backgroundColor: '#fff000',
            barStyle: 'light-content',
          },
        },
        // config plugin props
        {}
      )
    ).toStrictEqual({});
    expect(WarningAggregator.addWarningAndroid).toHaveBeenCalledTimes(0);
  });
  it(`resolves config plugin props`, () => {
    expect(
      resolveProps(
        {},
        // config plugin props
        {
          barStyle: 'dark',
          backgroundColor: 'blue',
          behavior: 'inset-swipe',
          borderColor: 'green',
          position: 'absolute',
          visibility: 'hidden',
          legacyVisible: 'immersive',
        }
      )
    ).toStrictEqual({
      barStyle: 'dark',
      backgroundColor: 'blue',
      behavior: 'inset-swipe',
      borderColor: 'green',
      legacyVisible: 'immersive',
      position: 'absolute',
      visibility: 'hidden',
    });
  });
});

describe(setStrings, () => {
  function getAllProps() {
    return resolveProps(
      {},
      // config plugin props
      {
        barStyle: 'dark',
        backgroundColor: 'blue',
        behavior: 'inset-swipe',
        borderColor: 'green',
        position: 'absolute',
        visibility: 'hidden',
        legacyVisible: 'immersive',
      }
    );
  }
  // TODO: Should we do validation on backgroundColor just for convenience?
  it(`asserts an invalid color`, () => {
    expect(() =>
      setStrings({ resources: {} }, resolveProps({}, { borderColor: '-bacon-' }))
    ).toThrow(/Invalid color value: -bacon-/);
  });

  it(`sets all strings`, () => {
    expect(setStrings({ resources: {} }, getAllProps())).toStrictEqual({
      resources: {
        string: [
          {
            $: {
              name: 'expo_navigation_bar_border_color',
              translatable: 'false',
            },
            _: '-16744448',
          },
          {
            $: {
              name: 'expo_navigation_bar_visibility',
              translatable: 'false',
            },
            _: 'hidden',
          },
          {
            $: {
              name: 'expo_navigation_bar_position',
              translatable: 'false',
            },
            _: 'absolute',
          },
          {
            $: {
              name: 'expo_navigation_bar_behavior',
              translatable: 'false',
            },
            _: 'inset-swipe',
          },
          {
            $: {
              name: 'expo_navigation_bar_legacy_visible',
              translatable: 'false',
            },
            _: 'immersive',
          },
        ],
      },
    });
  });

  it(`sets no strings`, () => {
    expect(
      setStrings(
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
    const strings = setStrings({ resources: {} }, getAllProps());
    // Unset all strings
    expect(setStrings(strings, resolveProps({}))).toStrictEqual({
      resources: {
        string: [],
      },
    });
  });
  it(`redefines duplicates`, () => {
    // Set all strings
    const strings = setStrings({ resources: {} }, { borderColor: '#4630EB' });

    expect(strings.resources.string).toStrictEqual([
      {
        $: { name: 'expo_navigation_bar_border_color', translatable: 'false' },
        // Test an initial value
        _: '-12177173',
      },
    ]);
    expect(
      setStrings(strings, resolveProps({}, { borderColor: 'dodgerblue' })).resources.string
    ).toStrictEqual([
      {
        $: { name: 'expo_navigation_bar_border_color', translatable: 'false' },
        // Test a redefined value
        _: '-14774017',
      },
    ]);
  });
});

describe(withAndroidNavigationBarExpoGoManifest, () => {
  it(`ensures manifest values`, () => {
    expect(
      withAndroidNavigationBarExpoGoManifest(
        { name: '', slug: '' },
        {
          backgroundColor: '#ff00ff',
          barStyle: 'dark',
          legacyVisible: 'immersive',
          borderColor: 'orange',
          visibility: 'hidden',
        }
      )
    ).toStrictEqual({
      name: expect.any(String),
      slug: expect.any(String),
      androidNavigationBar: {
        backgroundColor: '#ff00ff',
        // Ensure `content` is added
        barStyle: 'dark-content',
        // Ensure legacy value is able to be set
        visible: 'immersive',
      },
    });
  });
});

describe('e2e: write navigation color and style to files correctly', () => {
  it(`sets the navigationBarColor item in styles.xml. sets windowLightNavigation bar true`, async () => {
    const stylesJSON = await setNavigationBarStyles(
      { backgroundColor: '#111111', barStyle: 'dark' },
      { resources: {} }
    );

    const group = AndroidConfig.Styles.getStylesGroupAsObject(
      stylesJSON,
      AndroidConfig.Styles.getAppThemeGroup()
    );
    expect(group?.['android:navigationBarColor']).toBe('@color/navigationBarColor');
    expect(group?.['android:windowLightNavigationBar']).toBe('true');
  });

  it(`sets the navigationBarColor item in styles.xml and adds color to colors.xml if 'androidNavigationBar.backgroundColor' is given. sets windowLightNavigation bar true`, async () => {
    const colorsJSON = await setNavigationBarColors(
      { backgroundColor: '#111111' },
      { resources: {} }
    );

    expect(AndroidConfig.Colors.getColorsAsObject(colorsJSON)?.navigationBarColor).toBe('#111111');
  });

  // TODO: Test redefined and unset
});
