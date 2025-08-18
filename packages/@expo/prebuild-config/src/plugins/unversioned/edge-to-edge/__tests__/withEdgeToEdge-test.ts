import {
  WarningAggregator,
  AndroidConfig,
  ExportedConfigWithProps,
  ModConfig,
} from '@expo/config-plugins';
import { type ExpoConfig } from '@expo/config-types';

import { configureEdgeToEdgeEnforcement } from '../withConfigureEdgeToEdgeEnforcement';
import { applyEdgeToEdge } from '../withEdgeToEdge';
import { configureEdgeToEdgeEnabledGradleProperties } from '../withEdgeToEdgeEnabledGradleProperties';
import { applyEnforceNavigationBarContrast } from '../withEnforceNavigationBarContrast';
import { restoreDefaultTheme } from '../withRestoreDefaultTheme';

const mockWithRestoreDefaultTheme = jest.fn((config) => config);
const mockWithConfigureEdgeToEdgeEnforcement = jest.fn((config, _props) => config);
const mockWithEdgeToEdgeEnabledGradleProperties = jest.fn((config, _props) => config);

jest.mock('../withEdgeToEdgeEnabledGradleProperties', () => {
  const originalModule = jest.requireActual('../withEdgeToEdgeEnabledGradleProperties');
  return Object.assign({ __esModule: true }, originalModule, {
    withEdgeToEdgeEnabledGradleProperties: mockWithEdgeToEdgeEnabledGradleProperties,
  });
});

jest.mock('../withRestoreDefaultTheme', () => {
  const originalModule = jest.requireActual('../withRestoreDefaultTheme');
  return {
    __esModule: true,
    ...originalModule,
    withRestoreDefaultTheme: mockWithRestoreDefaultTheme,
  };
});

jest.mock('../withConfigureEdgeToEdgeEnforcement', () => {
  const originalModule = jest.requireActual('../withConfigureEdgeToEdgeEnforcement');
  return {
    __esModule: true,
    ...originalModule,
    withConfigureEdgeToEdgeEnforcement: mockWithConfigureEdgeToEdgeEnforcement,
  };
});

// Mock WarningAggregator
jest.mock('@expo/config-plugins', () => {
  const plugins = jest.requireActual('@expo/config-plugins');
  return {
    ...plugins,
    WarningAggregator: { addWarningAndroid: jest.fn() },
  };
});

// Define types for mock configs
type ResourceXMLConfig = ExportedConfigWithProps<AndroidConfig.Resources.ResourceXML>;
type GradlePropertiesConfig = ExportedConfigWithProps<AndroidConfig.Properties.PropertiesItem[]>;

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

describe('restoreDefaultTheme', () => {
  it('restores the default theme when parent includes EdgeToEdge', () => {
    const inputConfig: ResourceXMLConfig = {
      ...exportedConfigWithPopsCommon(),
      modResults: {
        resources: {
          style: [
            {
              $: {
                name: 'AppTheme',
                parent: 'Theme.EdgeToEdge', // Target theme
              },
              item: [{ $: { name: 'some-item' }, _: 'value' }], // Keep existing items
            },
            {
              $: {
                name: 'AnotherTheme', // Ensure other themes are preserved
                parent: 'Theme.SomeParent',
              },
              item: [],
            },
          ],
        },
      },
    };

    const resultConfig = restoreDefaultTheme(inputConfig);

    expect(resultConfig.modResults).toMatchInlineSnapshot(`
      {
        "resources": {
          "style": [
            {
              "$": {
                "name": "AppTheme",
                "parent": "Theme.AppCompat.DayNight.NoActionBar",
              },
              "item": [
                {
                  "$": {
                    "name": "some-item",
                  },
                  "_": "value",
                },
              ],
            },
            {
              "$": {
                "name": "AnotherTheme",
                "parent": "Theme.SomeParent",
              },
              "item": [],
            },
          ],
        },
      }
    `);
  });

  it('does nothing if AppTheme does not exist', () => {
    const inputConfig: ResourceXMLConfig = {
      ...exportedConfigWithPopsCommon(),
      modResults: {
        resources: {
          style: [
            {
              $: {
                name: 'SomeRandomTheme', // No AppTheme
                parent: 'Theme.EdgeToEdge',
              },
              item: [],
            },
          ],
        },
      },
    };
    // Deep copy for comparison
    const originalModResults = JSON.parse(JSON.stringify(inputConfig.modResults));

    const resultConfig = restoreDefaultTheme(inputConfig);

    expect(resultConfig.modResults).toEqual(originalModResults);
  });

  it("doesn't restore from non-edge-to-edge theme parent", () => {
    const inputConfig: ResourceXMLConfig = {
      ...exportedConfigWithPopsCommon(),
      modResults: {
        resources: {
          style: [
            {
              $: {
                name: 'AppTheme',
                parent: 'Theme.SomeTheme.Material3', // Not an EdgeToEdge parent
              },
              item: [],
            },
          ],
        },
      },
    };
    const originalModResults = JSON.parse(JSON.stringify(inputConfig.modResults));

    const resultConfig = restoreDefaultTheme(inputConfig);

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

    const resultConfig = restoreDefaultTheme(inputConfig);

    expect(resultConfig.modResults).toEqual(originalModResults);
  });
});

describe('configureEdgeToEdgeEnforcement', () => {
  const attributeName = 'android:windowOptOutEdgeToEdgeEnforcement';

  it('adds opt-out attribute when disableEdgeToEdgeEnforcement is true', () => {
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

    const resultConfig = configureEdgeToEdgeEnforcement(inputConfig, true); // disable = true

    const appTheme = resultConfig.modResults.resources.style?.find((s) => s.$.name === 'AppTheme');
    expect(appTheme?.item).toContainEqual({
      _: 'true',
      $: {
        name: attributeName,
        'tools:targetApi': '35',
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
                    "name": "android:otherSetting",
                  },
                  "_": "true",
                },
                {
                  "$": {
                    "name": "android:windowOptOutEdgeToEdgeEnforcement",
                    "tools:targetApi": "35",
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

  it('removes opt-out attribute when disableEdgeToEdgeEnforcement is false', () => {
    const inputConfig: ResourceXMLConfig = {
      ...exportedConfigWithPopsCommon(),
      modResults: {
        resources: {
          style: [
            {
              $: { name: 'AppTheme', parent: 'Theme.Whatever' },
              item: [
                { $: { name: 'android:otherSetting' }, _: 'true' },
                { _: 'true', $: { name: attributeName, 'tools:targetApi': '35' } }, // Attribute exists
              ],
            },
          ],
        },
      },
    };

    const resultConfig = configureEdgeToEdgeEnforcement(inputConfig, false); // disable = false

    const appTheme = resultConfig.modResults.resources.style?.find((s) => s.$.name === 'AppTheme');
    expect(appTheme?.item).not.toContainEqual(
      expect.objectContaining({ $: expect.objectContaining({ name: attributeName }) })
    );
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

    const resultConfig = configureEdgeToEdgeEnforcement(inputConfig, true);

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

    const resultConfig = configureEdgeToEdgeEnforcement(inputConfig, true);

    expect(resultConfig.modResults).toEqual(originalModResults);
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

describe('configureEdgeToEdgeEnabledGradleProperties', () => {
  it('adds property when edgeToEdgeEnabled is true and property does not exist', () => {
    const inputConfig: GradlePropertiesConfig = {
      ...exportedConfigWithPopsCommon('gradleProperties'),
      modResults: [{ type: 'property', key: 'other.prop', value: 'test' }],
    };

    const resultConfig = configureEdgeToEdgeEnabledGradleProperties(inputConfig, true); // enabled = true

    expect(resultConfig.modResults).toMatchInlineSnapshot(`
      [
        {
          "key": "other.prop",
          "type": "property",
          "value": "test",
        },
        {
          "type": "comment",
          "value": "Specifies whether the app is configured to use edge-to-edge via the app config or plugin
      # WARNING: This property has been deprecated and will be removed in Expo SDK 55. Use \`edgeToEdgeEnabled\` or \`react.edgeToEdgeEnabled\` to determine whether the project is using edge-to-edge.",
        },
        {
          "key": "expo.edgeToEdgeEnabled",
          "type": "property",
          "value": "true
      ",
        },
        {
          "type": "comment",
          "value": "Use this property to enable edge-to-edge display support.
      # This allows your app to draw behind system bars for an immersive UI.
      # Note: Only works with ReactActivity and should not be used with custom Activity.",
        },
        {
          "key": "edgeToEdgeEnabled",
          "type": "property",
          "value": "true
      ",
        },
      ]
    `);
  });

  it('adds property when edgeToEdgeEnabled is false and property does not exist', () => {
    const inputConfig: GradlePropertiesConfig = {
      ...exportedConfigWithPopsCommon('gradleProperties'),
      modResults: [], // Start empty
    };

    const resultConfig = configureEdgeToEdgeEnabledGradleProperties(inputConfig, false); // enabled = false

    expect(resultConfig.modResults).toMatchInlineSnapshot(`
      [
        {
          "type": "comment",
          "value": "Specifies whether the app is configured to use edge-to-edge via the app config or plugin
      # WARNING: This property has been deprecated and will be removed in Expo SDK 55. Use \`edgeToEdgeEnabled\` or \`react.edgeToEdgeEnabled\` to determine whether the project is using edge-to-edge.",
        },
        {
          "key": "expo.edgeToEdgeEnabled",
          "type": "property",
          "value": "false
      ",
        },
        {
          "type": "comment",
          "value": "Use this property to enable edge-to-edge display support.
      # This allows your app to draw behind system bars for an immersive UI.
      # Note: Only works with ReactActivity and should not be used with custom Activity.",
        },
        {
          "key": "edgeToEdgeEnabled",
          "type": "property",
          "value": "false
      ",
        },
      ]
    `);
  });

  it('updates property when edgeToEdgeEnabled is true and property exists as false', () => {
    const inputConfig: GradlePropertiesConfig = {
      ...exportedConfigWithPopsCommon('gradleProperties'),
      modResults: [
        { type: 'comment', value: 'Some other comment' },
        {
          type: 'comment',
          value:
            'Whether the app is configured to use edge-to-edge via the app config or `react-native-edge-to-edge` plugin',
        },
        { type: 'property', key: 'expo.edgeToEdgeEnabled', value: 'false' }, // Existing false
        { type: 'property', key: 'another.prop', value: 'hello' },
      ],
    };

    const resultConfig = configureEdgeToEdgeEnabledGradleProperties(inputConfig, true); // enabled = true

    expect(resultConfig.modResults).toMatchInlineSnapshot(`
      [
        {
          "type": "comment",
          "value": "Some other comment",
        },
        {
          "key": "expo.edgeToEdgeEnabled",
          "type": "property",
          "value": "true",
        },
        {
          "key": "another.prop",
          "type": "property",
          "value": "hello",
        },
        {
          "type": "comment",
          "value": "Use this property to enable edge-to-edge display support.
      # This allows your app to draw behind system bars for an immersive UI.
      # Note: Only works with ReactActivity and should not be used with custom Activity.",
        },
        {
          "key": "edgeToEdgeEnabled",
          "type": "property",
          "value": "true
      ",
        },
      ]
    `);
  });

  it('updates property when edgeToEdgeEnabled is false and property exists as true', () => {
    const inputConfig: GradlePropertiesConfig = {
      ...exportedConfigWithPopsCommon('gradleProperties'),
      modResults: [
        {
          type: 'comment',
          value:
            'Whether the app is configured to use edge-to-edge via the app config or `react-native-edge-to-edge` plugin',
        },
        { type: 'property', key: 'expo.edgeToEdgeEnabled', value: 'true' }, // Existing true
      ],
    };

    const resultConfig = configureEdgeToEdgeEnabledGradleProperties(inputConfig, false); // enabled = false

    expect(resultConfig.modResults).toMatchInlineSnapshot(`
      [
        {
          "key": "expo.edgeToEdgeEnabled",
          "type": "property",
          "value": "false",
        },
        {
          "type": "comment",
          "value": "Use this property to enable edge-to-edge display support.
      # This allows your app to draw behind system bars for an immersive UI.
      # Note: Only works with ReactActivity and should not be used with custom Activity.",
        },
        {
          "key": "edgeToEdgeEnabled",
          "type": "property",
          "value": "false
      ",
        },
      ]
    `);
  });
});

// --- Tests for applyEdgeToEdge ---

describe('applyEdgeToEdge', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    mockWithRestoreDefaultTheme.mockImplementation((config) => config);
    mockWithConfigureEdgeToEdgeEnforcement.mockImplementation((config) => config);
    mockWithEdgeToEdgeEnabledGradleProperties.mockImplementation((config) => config);
  });

  it("shouldn't add warnings when edgeToEdgeEnabled is undefined and plugin not configured", () => {
    const config: ExpoConfig = {
      name: 'test',
      slug: 'test',
      android: { edgeToEdgeEnabled: undefined },
    };
    applyEdgeToEdge(config, '/app');
    expect(WarningAggregator.addWarningAndroid).not.toHaveBeenCalledWith(
      'EDGE_TO_EDGE_PLUGIN',
      expect.stringContaining('No configuration found for `edgeToEdgeEnabled`'),
      expect.any(String)
    );
    expect(WarningAggregator.addWarningAndroid).toHaveBeenCalledTimes(0);
    expect(mockWithEdgeToEdgeEnabledGradleProperties).toHaveBeenCalledWith(expect.anything(), {
      edgeToEdgeEnabled: true,
    });
    expect(mockWithConfigureEdgeToEdgeEnforcement).toHaveBeenCalledWith(expect.anything(), {
      disableEdgeToEdgeEnforcement: false,
    });
    expect(mockWithRestoreDefaultTheme).toHaveBeenCalledTimes(1);
  });

  it('should add warnings when edgeToEdgeEnabled is false and plugin not configured', () => {
    const config: ExpoConfig = {
      name: 'test',
      slug: 'test',
      android: { edgeToEdgeEnabled: false },
    };
    applyEdgeToEdge(config, '/app');
    expect(WarningAggregator.addWarningAndroid).toHaveBeenCalledWith(
      'EDGE_TO_EDGE_PLUGIN',
      expect.stringContaining('`edgeToEdgeEnabled` field is explicitly set to false'),
      expect.any(String)
    );
    expect(WarningAggregator.addWarningAndroid).toHaveBeenCalledTimes(1);
    expect(mockWithEdgeToEdgeEnabledGradleProperties).toHaveBeenCalledWith(expect.anything(), {
      edgeToEdgeEnabled: false,
    });
    expect(mockWithConfigureEdgeToEdgeEnforcement).toHaveBeenCalledWith(expect.anything(), {
      disableEdgeToEdgeEnforcement: true,
    });
    expect(mockWithRestoreDefaultTheme).toHaveBeenCalledTimes(1);
  });

  it('should not add enablement warnings when edgeToEdgeEnabled is true', () => {
    const config: ExpoConfig = { name: 'test', slug: 'test', android: { edgeToEdgeEnabled: true } };
    applyEdgeToEdge(config, '/app');
    expect(WarningAggregator.addWarningAndroid).not.toHaveBeenCalledWith(
      'EDGE_TO_EDGE_PLUGIN',
      expect.stringContaining('No configuration found'),
      expect.any(String)
    );
    expect(WarningAggregator.addWarningAndroid).not.toHaveBeenCalledWith(
      'EDGE_TO_EDGE_PLUGIN',
      expect.stringContaining('explicitly set to false'),
      expect.any(String)
    );
    expect(mockWithEdgeToEdgeEnabledGradleProperties).toHaveBeenCalledWith(expect.anything(), {
      edgeToEdgeEnabled: true,
    });
    expect(mockWithConfigureEdgeToEdgeEnforcement).toHaveBeenCalledWith(expect.anything(), {
      disableEdgeToEdgeEnforcement: false,
    });
    expect(mockWithRestoreDefaultTheme).toHaveBeenCalled();
  });
});
