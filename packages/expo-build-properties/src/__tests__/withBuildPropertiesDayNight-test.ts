import { withAndroidStyles } from 'expo/config-plugins';

import { compileMockModWithResultsAsync } from './mockMods';
import { withBuildProperties } from '../withBuildProperties';

jest.mock('@expo/config-plugins/build/plugins/android-plugins', () => {
  const plugins = jest.requireActual('@expo/config-plugins/build/plugins/android-plugins');
  return {
    ...plugins,
    withAndroidStyles: jest.fn().mockImplementation((config) => config),
  };
});

const defaultStyles = [
  {
    $: {
      name: 'AppTheme',
      parent: 'Theme.AppCompat.Light.NoActionBar',
    },
    item: [
      {
        _: '@android:color/black',
        $: {
          name: 'android:textColor',
        },
      },
      {
        _: '@style/ResetEditText',
        $: {
          name: 'android:editTextStyle',
        },
      },
      {
        _: '@drawable/rn_edit_text_material',
        $: {
          name: 'android:editTextBackground',
        },
      },
      {
        $: {
          name: 'colorPrimary',
        },
        _: '@color/colorPrimary',
      },
      {
        $: {
          name: 'android:statusBarColor',
        },
        _: '#ffffff',
      },
    ],
  },
  {
    $: {
      name: 'ResetEditText',
      parent: '@android:style/Widget.EditText',
    },
    item: [
      {
        _: '0dp',
        $: {
          name: 'android:padding',
        },
      },
      {
        _: '#c8c8c8',
        $: {
          name: 'android:textColorHint',
        },
      },
      {
        _: '@android:color/black',
        $: {
          name: 'android:textColor',
        },
      },
    ],
  },
  {
    $: {
      name: 'Theme.App.SplashScreen',
      parent: 'AppTheme',
    },
    item: [
      {
        _: '@drawable/splashscreen_logo',
        $: {
          name: 'android:windowBackground',
        },
      },
    ],
  },
];

const userDefined = [
  ...defaultStyles,
  {
    $: {
      name: 'MyTheme',
      parent: 'Theme.MyTheme',
    },
    item: [
      {
        _: '@android:color/red',
        $: {
          name: 'android:textColor',
        },
      },
    ],
  },
];

describe(withBuildProperties, () => {
  it('correctly modifies the theme for dark mode support', async () => {
    const { modResults } = await createModResult(true, defaultStyles);
    const { style } = modResults.resources;
    const appTheme = style.find(({ $ }) => $.name === 'AppTheme');
    expect(appTheme.$.parent).toBe('Theme.AppCompat.DayNight.NoActionBar');
  });

  it('removes the `ResetEditText` style', async () => {
    const { modResults } = await createModResult(true, defaultStyles);
    const { style } = modResults.resources;
    const resetEditText = style.find(({ $ }) => $.name === 'ResetEditText');
    expect(resetEditText).toBeUndefined();
  });

  it('correctly removes the hardcoded colors from the `AppTheme`', async () => {
    const { modResults } = await createModResult(true, defaultStyles);
    const { style } = modResults.resources;

    const excludedAttributes = ['android:textColor', 'android:editTextStyle'];

    const appTheme = style.find(({ $ }) => $.name === 'AppTheme');
    const items = appTheme.item.filter(({ $ }) => excludedAttributes.includes($.name));
    expect(items).toHaveLength(0);
  });

  it('does not modify the styles if `useDayNightTheme` is false', async () => {
    const { modResults } = await createModResult(false, defaultStyles);
    expect(modResults.resources.style).toEqual(defaultStyles);
  });

  it('does not override user defined styles', async () => {
    const { modResults } = await createModResult(true, userDefined);

    const userStyle = modResults.resources.style.find(({ $ }) => $.name === 'MyTheme');
    expect(userStyle).toBeDefined();
  });
});

async function createModResult(useDayNightTheme: boolean, style: any[]) {
  return compileMockModWithResultsAsync(
    {},
    {
      plugin: withBuildProperties,
      pluginProps: { android: { useDayNightTheme } },
      mod: withAndroidStyles,
      modResults: {
        resources: {
          style,
        },
      },
    }
  );
}
