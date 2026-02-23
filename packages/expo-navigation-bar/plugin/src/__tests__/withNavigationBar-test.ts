import { ModConfig } from '@expo/config-plugins';

import {
  applyEnforceNavigationBarContrast,
  resolveProps,
  ResourceXMLConfig,
  setStrings,
  withAndroidNavigationBarExpoGoManifest,
} from '../withNavigationBar';

const exportedConfigWithPopsCommon = (modName: string = 'styles') => ({
  name: 'test',
  slug: 'test',
  modRequest: {
    platform: 'android' as keyof ModConfig,
    modName,
    projectRoot: '/app',
    platformProjectRoot: '/app/android',
    introspect: false,
  },
  modRawConfig: {
    name: 'test',
    slug: 'test',
  },
});

describe(resolveProps, () => {
  it(`resolves no props`, () => {
    expect(resolveProps({})).toStrictEqual({
      barStyle: undefined,
      enforceContrast: undefined,
    });
  });
  it(`resolves props`, () => {
    expect(
      resolveProps({
        androidNavigationBar: {
          barStyle: 'light-content',
        },
      })
    ).toStrictEqual({
      barStyle: 'light',
      enforceContrast: undefined,
    });
  });
  it(`skips props if any config plugin props are provided`, () => {
    expect(
      resolveProps(
        {
          androidNavigationBar: {
            barStyle: 'light-content',
          },
        },
        // config plugin props
        {}
      )
    ).toStrictEqual({});
  });
  it(`resolves config plugin props`, () => {
    expect(
      resolveProps(
        {},
        // config plugin props
        {
          barStyle: 'dark',
          visibility: 'hidden',
        }
      )
    ).toStrictEqual({
      barStyle: 'dark',
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
        visibility: 'hidden',
      }
    );
  }

  it(`sets all strings`, () => {
    expect(setStrings({ resources: {} }, getAllProps())).toStrictEqual({
      resources: {
        string: [
          {
            $: {
              name: 'expo_navigation_bar_visibility',
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
    const strings = setStrings({ resources: {} }, { visibility: 'hidden' });

    expect(strings.resources.string).toStrictEqual([
      {
        $: { name: 'expo_navigation_bar_visibility', translatable: 'false' },
        // Test an initial value
        _: 'hidden',
      },
    ]);
    expect(
      setStrings(strings, resolveProps({}, { visibility: 'visible' })).resources.string
    ).toStrictEqual([
      {
        $: { name: 'expo_navigation_bar_visibility', translatable: 'false' },
        // Test a redefined value
        _: 'visible',
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
          barStyle: 'dark',
          visibility: 'hidden',
        }
      )
    ).toStrictEqual({
      name: expect.any(String),
      slug: expect.any(String),
      androidNavigationBar: {
        // Ensure `content` is added
        barStyle: 'dark-content',
      },
    });
  });
});

describe('applyEnforceNavigationBarContrast', () => {
  const attributeName = 'android:enforceNavigationBarContrast';

  it('adds attribute when enforceNavigationBarContrast is true and it does not exist', () => {
    const inputConfig: ResourceXMLConfig = {
      ...exportedConfigWithPopsCommon(),
      modResults: {
        resources: {
          style: [
            {
              $: { name: 'AppTheme', parent: 'Theme.Whatever' },
              item: [{ $: { name: 'android:otherSetting' }, _: 'true' }],
            },
          ],
        },
      },
    };

    const resultConfig = applyEnforceNavigationBarContrast(inputConfig, true);

    const appTheme = resultConfig.modResults.resources.style?.find((s) => s.$.name === 'AppTheme');
    expect(appTheme?.item).toContainEqual({
      _: 'true',
      $: {
        name: attributeName,
        'tools:targetApi': '29',
      },
    });
    expect(appTheme?.item).toContainEqual({ $: { name: 'android:otherSetting' }, _: 'true' });
    expect(resultConfig.modResults).toMatchInlineSnapshot(`
      {
        "resources": {
          "style": [
            {
              "$": {
                "name": "AppTheme",
                "parent": "Theme.Whatever",
              },
              "item": [
                {
                  "$": {
                    "name": "android:enforceNavigationBarContrast",
                    "tools:targetApi": "29",
                  },
                  "_": "true",
                },
                {
                  "$": {
                    "name": "android:otherSetting",
                  },
                  "_": "true",
                },
              ],
            },
          ],
        },
      }
    `);
  });

  it('updates attribute to true when it already exists as false', () => {
    const inputConfig: ResourceXMLConfig = {
      ...exportedConfigWithPopsCommon(),
      modResults: {
        resources: {
          style: [
            {
              $: { name: 'AppTheme', parent: 'Theme.Whatever' },
              item: [
                { $: { name: 'android:otherSetting' }, _: 'true' },
                { _: 'false', $: { name: attributeName, 'tools:targetApi': '29' } }, // Attribute exists as false
              ],
            },
          ],
        },
      },
    };

    const resultConfig = applyEnforceNavigationBarContrast(inputConfig, true); // enforce = true

    const appTheme = resultConfig.modResults.resources.style?.find((s) => s.$.name === 'AppTheme');
    const targetItem = appTheme?.item?.find((i) => i.$.name === attributeName);
    expect(targetItem?._).toBe('true');
    expect(resultConfig.modResults).toMatchInlineSnapshot(`
      {
        "resources": {
          "style": [
            {
              "$": {
                "name": "AppTheme",
                "parent": "Theme.Whatever",
              },
              "item": [
                {
                  "$": {
                    "name": "android:otherSetting",
                  },
                  "_": "true",
                },
                {
                  "$": {
                    "name": "android:enforceNavigationBarContrast",
                    "tools:targetApi": "29",
                  },
                  "_": "true",
                },
              ],
            },
          ],
        },
      }
    `);
  });

  it('updates attribute to false when enforceNavigationBarContrast is false', () => {
    const inputConfig: ResourceXMLConfig = {
      ...exportedConfigWithPopsCommon(),
      modResults: {
        resources: {
          style: [
            {
              $: { name: 'AppTheme', parent: 'Theme.Whatever' },
              item: [
                { $: { name: 'android:otherSetting' }, _: 'true' },
                { _: 'true', $: { name: attributeName, 'tools:targetApi': '29' } }, // Attribute exists as true
              ],
            },
          ],
        },
      },
    };

    const resultConfig = applyEnforceNavigationBarContrast(inputConfig, false); // enforce = false

    const appTheme = resultConfig.modResults.resources.style?.find((s) => s.$.name === 'AppTheme');
    const targetItem = appTheme?.item?.find((i) => i.$.name === attributeName);
    expect(targetItem?._).toBe('false');
    expect(resultConfig.modResults).toMatchInlineSnapshot(`
      {
        "resources": {
          "style": [
            {
              "$": {
                "name": "AppTheme",
                "parent": "Theme.Whatever",
              },
              "item": [
                {
                  "$": {
                    "name": "android:otherSetting",
                  },
                  "_": "true",
                },
                {
                  "$": {
                    "name": "android:enforceNavigationBarContrast",
                    "tools:targetApi": "29",
                  },
                  "_": "false",
                },
              ],
            },
          ],
        },
      }
    `);
  });

  it('does nothing if AppTheme is not found', () => {
    const inputConfig: ResourceXMLConfig = {
      ...exportedConfigWithPopsCommon(),
      modResults: {
        resources: {
          style: [
            {
              $: { name: 'SomeOtherTheme', parent: 'Theme.Whatever' },
              item: [],
            },
          ],
        },
      },
    };
    const originalModResults = JSON.parse(JSON.stringify(inputConfig.modResults));

    const resultConfig = applyEnforceNavigationBarContrast(inputConfig, true);

    expect(resultConfig.modResults).toEqual(originalModResults);
  });

  it('does nothing if styles resource is missing', () => {
    const inputConfig: ResourceXMLConfig = {
      ...exportedConfigWithPopsCommon(),
      modResults: {
        resources: {
          // style: [] // Missing style array
        },
      },
    };
    const originalModResults = JSON.parse(JSON.stringify(inputConfig.modResults));

    const resultConfig = applyEnforceNavigationBarContrast(inputConfig, true);

    expect(resultConfig.modResults).toEqual(originalModResults);
  });
});
