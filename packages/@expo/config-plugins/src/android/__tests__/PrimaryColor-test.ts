import { compileMockModWithResultsAsync } from '../../plugins/__tests__/mockMods';
import { withAndroidColors, withAndroidStyles } from '../../plugins/android-plugins';
import { parseXMLAsync } from '../../utils/XML';
import { getColorsAsObject, getObjectAsColorsXml } from '../Colors';
import { getPrimaryColor, withPrimaryColorColors, withPrimaryColorStyles } from '../PrimaryColor';
import { getAppThemeLightNoActionBarGroup, getStylesGroupAsObject } from '../Styles';

jest.mock('../../plugins/android-plugins');

it(`returns default if no primary color is provided`, () => {
  expect(getPrimaryColor({})).toBe('#023c69');
});

it(`returns primary color if provided`, () => {
  expect(getPrimaryColor({ primaryColor: '#111111' })).toMatch('#111111');
});

it(`returns empty string`, () => {
  expect(getPrimaryColor({ primaryColor: '' })).toMatch('');
});

describe(withPrimaryColorColors, () => {
  it(`applies a custom color`, async () => {
    const { modResults } = await compileMockModWithResultsAsync(
      { primaryColor: '#FF00FF' },
      {
        plugin: withPrimaryColorColors,
        mod: withAndroidColors,
        modResults: { resources: {} },
      }
    );
    expect(getColorsAsObject(modResults)).toStrictEqual({ colorPrimary: '#FF00FF' });
  });
  it(`removes color with empty string`, async () => {
    const { modResults } = await compileMockModWithResultsAsync(
      { primaryColor: '' },
      {
        plugin: withPrimaryColorColors,
        mod: withAndroidColors,
        // Create a colors.xml JSON from a k/v pair
        modResults: getObjectAsColorsXml({ colorPrimary: '#FFF000' }),
      }
    );
    expect(getColorsAsObject(modResults)).toStrictEqual({});
  });
});

describe(withPrimaryColorStyles, () => {
  it(`links a style to the custom color`, async () => {
    const { modResults } = await compileMockModWithResultsAsync(
      { primaryColor: '#FF00FF' },
      {
        plugin: withPrimaryColorStyles,
        mod: withAndroidStyles,
        // Empty styles object
        modResults: { resources: {} },
      }
    );
    expect(getStylesGroupAsObject(modResults, getAppThemeLightNoActionBarGroup())).toStrictEqual({
      colorPrimary: '@color/colorPrimary',
    });
  });

  it(`removes styles with empty string`, async () => {
    // Parsed from a string for DX readability
    const styles = [
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
      '<resources>',
      '  <style name="AppTheme" parent="Theme.AppCompat.Light.NoActionBar">',
      '    <item name="colorPrimary">@color/colorPrimary</item>',
      '  </style>',
      '</resources>',
    ].join('\n');

    const { modResults } = await compileMockModWithResultsAsync(
      // Empty string in Expo config should disable the style
      { primaryColor: '' },
      {
        plugin: withPrimaryColorStyles,
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
