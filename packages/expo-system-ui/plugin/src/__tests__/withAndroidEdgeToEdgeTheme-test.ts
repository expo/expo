import { AndroidConfig, withAndroidStyles, XML } from 'expo/config-plugins';

import { compileMockModWithResultsAsync } from './mockMods';
import { withAndroidEdgeToEdgeTheme } from '../withAndroidEdgeToEdgeTheme';

const { parseXMLAsync } = XML;

jest.mock('expo/config-plugins', () => {
  const plugins = jest.requireActual('expo/config-plugins');
  return {
    ...plugins,
    withAndroidStyles: jest.fn(),
  };
});

describe(withAndroidEdgeToEdgeTheme, () => {
  it(`updates AppTheme style parent when edgeToEdge is enabled`, async () => {
    const { modResults } = await compileMockModWithResultsAsync(
      { experiments: { edgeToEdge: true } },
      {
        plugin: withAndroidEdgeToEdgeTheme,
        mod: withAndroidStyles,
        modResults: (await parseXMLAsync(`
<resources>
  <style name="AppTheme" parent="Theme.AppCompat.Light.NoActionBar">
  </style>
</resources>
`)) as AndroidConfig.Resources.ResourceXML,
      }
    );

    expect(modResults.resources.style?.at(0)).toStrictEqual({
      $: { name: 'AppTheme', parent: 'Theme.EdgeToEdge' },
      item: [],
    });
  });

  it(`adds windowLightSystemBars if userInterfaceStyle is set`, async () => {
    const { modResults: lightModResults } = await compileMockModWithResultsAsync(
      {
        userInterfaceStyle: 'light',
        experiments: { edgeToEdge: true },
      },
      {
        plugin: withAndroidEdgeToEdgeTheme,
        mod: withAndroidStyles,
        modResults: (await parseXMLAsync(`
<resources>
  <style name="AppTheme" parent="Theme.AppCompat.Light.NoActionBar">
  </style>
</resources>
`)) as AndroidConfig.Resources.ResourceXML,
      }
    );

    expect(lightModResults.resources.style?.at(0)).toStrictEqual({
      $: { name: 'AppTheme', parent: 'Theme.EdgeToEdge' },
      item: [{ $: { name: 'windowLightSystemBars' }, _: 'true' }],
    });

    const { modResults: darkModResults } = await compileMockModWithResultsAsync(
      {
        userInterfaceStyle: 'dark',
        experiments: { edgeToEdge: true },
      },
      {
        plugin: withAndroidEdgeToEdgeTheme,
        mod: withAndroidStyles,
        modResults: (await parseXMLAsync(`
<resources>
  <style name="AppTheme" parent="Theme.AppCompat.Light.NoActionBar">
  </style>
</resources>
`)) as AndroidConfig.Resources.ResourceXML,
      }
    );

    expect(darkModResults.resources.style?.at(0)).toStrictEqual({
      $: { name: 'AppTheme', parent: 'Theme.EdgeToEdge' },
      item: [{ $: { name: 'windowLightSystemBars' }, _: 'false' }],
    });
  });

  it(`filters unwanted theme attributes`, async () => {
    const { modResults } = await compileMockModWithResultsAsync(
      { experiments: { edgeToEdge: true } },
      {
        plugin: withAndroidEdgeToEdgeTheme,
        mod: withAndroidStyles,
        modResults: (await parseXMLAsync(`
<resources>
  <style name="AppTheme" parent="Theme.AppCompat.Light.NoActionBar">
    <item name="colorPrimary">@color/colorPrimary</item>
    <item name="android:statusBarColor">@android:color/red</item>
    <item name="android:windowLightStatusBar">false</item>
    <item name="android:navigationBarColor">@android:color/red</item>
  	<item name="android:windowLightStatusBar">false</item>
  </style>
</resources>
`)) as AndroidConfig.Resources.ResourceXML,
      }
    );

    expect(modResults.resources.style?.at(0)).toStrictEqual({
      $: { name: 'AppTheme', parent: 'Theme.EdgeToEdge' },
      item: [{ _: '@color/colorPrimary', $: { name: 'colorPrimary' } }],
    });
  });

  it(`removes Theme.EdgeToEdge if edgeToEdge is disabled`, async () => {
    const { modResults } = await compileMockModWithResultsAsync(
      { experiments: { edgeToEdge: false } },
      {
        plugin: withAndroidEdgeToEdgeTheme,
        mod: withAndroidStyles,
        modResults: (await parseXMLAsync(`
<resources>
  <style name="AppTheme" parent="Theme.EdgeToEdge">
    <item name="windowLightSystemBars">true</item>
  </style>
</resources>
`)) as AndroidConfig.Resources.ResourceXML,
      }
    );

    expect(modResults.resources.style?.at(0)).toStrictEqual({
      $: { name: 'AppTheme', parent: 'Theme.AppCompat.Light.NoActionBar' },
      item: [],
    });
  });
});
