import {
  applyEnforceNavigationBarContrast,
  resolveProps,
  ResourceXMLConfig,
  setNavigationBarStyles,
} from '../withNavigationBar';

const exportedConfigWithPopsCommon = (modName: string = 'styles') => ({
  name: 'test',
  slug: 'test',
  modRequest: {
    platform: 'android' as const,
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
  it('returns undefined for nullish or empty props', () => {
    expect(resolveProps(undefined)).toBeUndefined();
    expect(resolveProps({})).toBeUndefined();
    expect(resolveProps({ style: undefined })).toBeUndefined();
  });

  it('resolves props', () => {
    expect(resolveProps({ style: 'dark' })).toStrictEqual({ style: 'dark' });
    expect(resolveProps({ hidden: true })).toStrictEqual({ hidden: true });
  });

  it('maps deprecated props, preferring new ones', () => {
    expect(resolveProps({ barStyle: 'dark' })).toStrictEqual({ style: 'dark' });
    expect(resolveProps({ visibility: 'hidden' })).toStrictEqual({ hidden: true });
    expect(resolveProps({ visibility: 'visible' })).toStrictEqual({ hidden: false });

    expect(resolveProps({ style: 'light', barStyle: 'dark' })).toStrictEqual({ style: 'light' });
    expect(resolveProps({ hidden: false, visibility: 'hidden' })).toStrictEqual({ hidden: false });
  });
});

describe(setNavigationBarStyles, () => {
  const parent = 'Theme.AppCompat.DayNight.NoActionBar';

  const baseStyles = () => ({
    resources: { style: [{ $: { name: 'AppTheme', parent }, item: [] }] },
  });

  const appTheme = (items: { name: string; value: string }[]) => ({
    $: { name: 'AppTheme', parent },
    item: items.map(({ name, value }) => ({ $: { name }, _: value })),
  });

  it('sets all styles', () => {
    const result = setNavigationBarStyles({ hidden: true, style: 'dark' }, baseStyles());

    expect(result.resources.style).toStrictEqual([
      appTheme([
        { name: 'expoNavigationBarHidden', value: 'true' },
        { name: 'android:windowLightNavigationBar', value: 'true' },
      ]),
    ]);
  });

  it('sets light style', () => {
    const result = setNavigationBarStyles({ style: 'light' }, baseStyles());

    expect(result.resources.style).toStrictEqual([
      appTheme([{ name: 'android:windowLightNavigationBar', value: 'false' }]),
    ]);
  });

  it('sets hidden only', () => {
    const result = setNavigationBarStyles({ hidden: true }, baseStyles());

    expect(result.resources.style).toStrictEqual([
      appTheme([{ name: 'expoNavigationBarHidden', value: 'true' }]),
    ]);
  });

  it('does nothing with empty props', () => {
    const result = setNavigationBarStyles({}, baseStyles());

    expect(result).toStrictEqual(baseStyles());
  });

  it('redefines duplicates', () => {
    const styles = setNavigationBarStyles({ hidden: true }, baseStyles());

    expect(styles.resources.style).toStrictEqual([
      appTheme([{ name: 'expoNavigationBarHidden', value: 'true' }]),
    ]);

    const updated = setNavigationBarStyles({ hidden: false }, styles);

    expect(updated.resources.style).toStrictEqual([
      appTheme([{ name: 'expoNavigationBarHidden', value: 'false' }]),
    ]);
  });

  it('removes style when prop is unset', () => {
    const styles = setNavigationBarStyles({ hidden: true, style: 'dark' }, baseStyles());
    const result = setNavigationBarStyles({}, styles);

    expect(result.resources.style).toStrictEqual([appTheme([])]);
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
