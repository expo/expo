import { AndroidConfig, withAndroidColors, withAndroidStyles, XML } from '@expo/config-plugins';

import {
  getRootViewBackgroundColor,
  withRootViewBackgroundColorColors,
  withRootViewBackgroundColorStyles,
} from '../withAndroidRootViewBackgroundColor';
import { compileMockModWithResultsAsync } from './mockMods';

const { parseXMLAsync } = XML;
const { getColorsAsObject, getObjectAsColorsXml } = AndroidConfig.Colors;
const { getAppThemeLightNoActionBarGroup, getStylesGroupAsObject } = AndroidConfig.Styles;

jest.mock('@expo/config-plugins', () => {
  const plugins = jest.requireActual('@expo/config-plugins');
  return {
    ...plugins,
    withAndroidColors: jest.fn(),
    withAndroidStyles: jest.fn(),
  };
});

describe(getRootViewBackgroundColor, () => {
  it(`returns null if no backgroundColor is provided`, () => {
    expect(getRootViewBackgroundColor({})).toBe(null);
  });
  it(`returns backgroundColor if provided`, () => {
    expect(getRootViewBackgroundColor({ backgroundColor: '#111111' })).toMatch('#111111');
  });
  it(`returns the backgroundColor under android if provided`, () => {
    expect(
      getRootViewBackgroundColor({
        backgroundColor: '#111111',
        android: { backgroundColor: '#222222' },
      })
    ).toMatch('#222222');
  });
});

describe(withRootViewBackgroundColorColors, () => {
  it(`applies a custom color`, async () => {
    const { modResults } = await compileMockModWithResultsAsync(
      { backgroundColor: '#FF00FF' },
      {
        plugin: withRootViewBackgroundColorColors,
        mod: withAndroidColors,
        modResults: { resources: {} },
      }
    );
    expect(getColorsAsObject(modResults)).toStrictEqual({ activityBackground: '#FF00FF' });
  });
  it(`removes color`, async () => {
    const { modResults } = await compileMockModWithResultsAsync(
      {},
      {
        plugin: withRootViewBackgroundColorColors,
        mod: withAndroidColors,
        // Create a colors.xml JSON from a k/v pair
        modResults: getObjectAsColorsXml({ activityBackground: '#FFF000' }),
      }
    );
    expect(getColorsAsObject(modResults)).toStrictEqual({});
  });
});

describe(withRootViewBackgroundColorStyles, () => {
  it(`links a style to the custom color`, async () => {
    const { modResults } = await compileMockModWithResultsAsync(
      { backgroundColor: '#FF00FF' },
      {
        plugin: withRootViewBackgroundColorStyles,
        mod: withAndroidStyles,
        // Empty styles object
        modResults: { resources: {} },
      }
    );
    expect(getStylesGroupAsObject(modResults, getAppThemeLightNoActionBarGroup())).toStrictEqual({
      'android:windowBackground': '@color/activityBackground',
    });
  });

  it(`removes styles with empty string`, async () => {
    // Parsed from a string for DX readability
    const styles = [
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
      '<resources>',
      '  <style name="AppTheme" parent="Theme.AppCompat.Light.NoActionBar">',
      '    <item name="android:windowBackground">@color/activityBackground</item>',
      '  </style>',
      '</resources>',
    ].join('\n');

    const { modResults } = await compileMockModWithResultsAsync(
      // Empty string in Expo config should disable the style
      {},
      {
        plugin: withRootViewBackgroundColorStyles,
        mod: withAndroidStyles,
        modResults: (await parseXMLAsync(styles)) as any,
      }
    );
    // Extract the styles group items given the group
    expect(getStylesGroupAsObject(modResults, getAppThemeLightNoActionBarGroup())).toStrictEqual(
      // Should be an empty k/v pair
      {}
    );
  });
});
