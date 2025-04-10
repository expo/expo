import {
  WarningAggregator,
  AndroidConfig,
  ExportedConfigWithProps,
  ModConfig,
} from '@expo/config-plugins';
import { type ExpoConfig } from '@expo/config-types';

import { hasEnabledEdgeToEdge } from '../helpers'; // Adjust path as needed
import { configureEdgeToEdgeEnforcement } from '../withConfigureEdgeToEdgeEnforcement';
import { applyEdgeToEdge } from '../withEdgeToEdge';
import { configureEdgeToEdgeEnabledGradleProperties } from '../withEdgeToEdgeEnabledGradleProperties';
import { restoreDefaultTheme } from '../withRestoreDefaultTheme';

const mockEdgeToEdgePlugin = jest.fn();
const mockLoadEdgeToEdgeConfigPlugin = jest.fn(() => {
  return mockEdgeToEdgePlugin;
});
const mockWithRestoreDefaultTheme = jest.fn((config) => config);
const mockWithConfigureEdgeToEdgeEnforcement = jest.fn((config, _props) => config);
const mockWithEdgeToEdgeEnabledGradleProperties = jest.fn((config, _props) => config);

jest.mock('../withEdgeToEdgeEnabledGradleProperties', () => {
  const originalModule = jest.requireActual('../withEdgeToEdgeEnabledGradleProperties');
  return {
    __esModule: true,
    ...originalModule,
    withEdgeToEdgeEnabledGradleProperties: mockWithEdgeToEdgeEnabledGradleProperties,
  };
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

jest.mock('../helpers', () => {
  const originalModule = jest.requireActual('../helpers');
  return {
    ...originalModule,
    loadEdgeToEdgeConfigPlugin: mockLoadEdgeToEdgeConfigPlugin,
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
          "value": "Whether the app is configured to use edge-to-edge via the application config or \`react-native-edge-to-edge\` plugin",
        },
        {
          "key": "expo.edgeToEdgeEnabled",
          "type": "property",
          "value": "true",
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
          "value": "Whether the app is configured to use edge-to-edge via the application config or \`react-native-edge-to-edge\` plugin",
        },
        {
          "key": "expo.edgeToEdgeEnabled",
          "type": "property",
          "value": "false",
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
            'Whether the app is configured to use edge-to-edge via the application config or `react-native-edge-to-edge` plugin',
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
          "key": "another.prop",
          "type": "property",
          "value": "hello",
        },
        {
          "type": "comment",
          "value": "Whether the app is configured to use edge-to-edge via the application config or \`react-native-edge-to-edge\` plugin",
        },
        {
          "key": "expo.edgeToEdgeEnabled",
          "type": "property",
          "value": "true",
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
            'Whether the app is configured to use edge-to-edge via the application config or `react-native-edge-to-edge` plugin',
        },
        { type: 'property', key: 'expo.edgeToEdgeEnabled', value: 'true' }, // Existing true
      ],
    };

    const resultConfig = configureEdgeToEdgeEnabledGradleProperties(inputConfig, false); // enabled = false

    expect(resultConfig.modResults).toMatchInlineSnapshot(`
      [
        {
          "type": "comment",
          "value": "Whether the app is configured to use edge-to-edge via the application config or \`react-native-edge-to-edge\` plugin",
        },
        {
          "key": "expo.edgeToEdgeEnabled",
          "type": "property",
          "value": "false",
        },
      ]
    `);
  });
});

// --- Tests for hasEnabledEdgeToEdge (Remains the Same) ---
describe('hasEnabledEdgeToEdge', () => {
  const pluginString = 'react-native-edge-to-edge/app.plugin.js';
  const pluginArray: [string, object] = [pluginString, {}];

  it('returns true if edgeToEdgeEnabled is true, regardless of plugin', () => {
    expect(
      hasEnabledEdgeToEdge({ name: 'test', slug: 'test', android: { edgeToEdgeEnabled: true } })
    ).toBe(true);
    expect(
      hasEnabledEdgeToEdge({
        name: 'test',
        slug: 'test',
        android: { edgeToEdgeEnabled: true },
        plugins: [],
      })
    ).toBe(true);
    expect(
      hasEnabledEdgeToEdge({
        name: 'test',
        slug: 'test',
        android: { edgeToEdgeEnabled: true },
        plugins: [pluginString],
      })
    ).toBe(true);
    expect(
      hasEnabledEdgeToEdge({
        name: 'test',
        slug: 'test',
        android: { edgeToEdgeEnabled: true },
        plugins: [pluginArray],
      })
    ).toBe(true);
  });

  it('returns true if plugin is present (string), regardless of edgeToEdgeEnabled flag', () => {
    expect(
      hasEnabledEdgeToEdge({
        name: 'test',
        slug: 'test',
        android: { edgeToEdgeEnabled: false },
        plugins: [pluginString],
      })
    ).toBe(true);
    expect(
      hasEnabledEdgeToEdge({
        name: 'test',
        slug: 'test',
        android: { edgeToEdgeEnabled: undefined },
        plugins: [pluginString],
      })
    ).toBe(true);
    expect(hasEnabledEdgeToEdge({ name: 'test', slug: 'test', plugins: [pluginString] })).toBe(
      true
    );
  });

  it('returns true if plugin is present (array), regardless of edgeToEdgeEnabled flag', () => {
    expect(
      hasEnabledEdgeToEdge({
        name: 'test',
        slug: 'test',
        android: { edgeToEdgeEnabled: false },
        plugins: [pluginArray],
      })
    ).toBe(true);
    expect(
      hasEnabledEdgeToEdge({
        name: 'test',
        slug: 'test',
        android: { edgeToEdgeEnabled: undefined },
        plugins: [pluginArray],
      })
    ).toBe(true);
    expect(hasEnabledEdgeToEdge({ name: 'test', slug: 'test', plugins: [pluginArray] })).toBe(true);
  });

  it('returns true if plugin is present later in list', () => {
    expect(
      hasEnabledEdgeToEdge({ name: 'test', slug: 'test', plugins: ['other-plugin', pluginString] })
    ).toBe(true);
    expect(
      hasEnabledEdgeToEdge({ name: 'test', slug: 'test', plugins: ['other-plugin', pluginArray] })
    ).toBe(true);
  });

  it('returns false if edgeToEdgeEnabled is false or undefined and plugin is not present', () => {
    expect(
      hasEnabledEdgeToEdge({ name: 'test', slug: 'test', android: { edgeToEdgeEnabled: false } })
    ).toBe(false);
    expect(
      hasEnabledEdgeToEdge({
        name: 'test',
        slug: 'test',
        android: { edgeToEdgeEnabled: undefined },
      })
    ).toBe(false);
    expect(hasEnabledEdgeToEdge({ name: 'test', slug: 'test' })).toBe(false);
    expect(hasEnabledEdgeToEdge({ name: 'test', slug: 'test', plugins: [] })).toBe(false);
    expect(
      hasEnabledEdgeToEdge({ name: 'test', slug: 'test', plugins: ['some-other-plugin'] })
    ).toBe(false);
  });
});

// --- Tests for applyEdgeToEdge (testing interactions) ---

describe('applyEdgeToEdge', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    // Default: plugin is loadable and does nothing by default
    mockLoadEdgeToEdgeConfigPlugin.mockReturnValue(mockEdgeToEdgePlugin);
    mockEdgeToEdgePlugin.mockImplementation((config) => config);
    mockWithRestoreDefaultTheme.mockImplementation((config) => config);
    mockWithConfigureEdgeToEdgeEnforcement.mockImplementation((config) => config);
    mockWithEdgeToEdgeEnabledGradleProperties.mockImplementation((config) => config);
  });

  it('should add warnings when edgeToEdgeEnabled is undefined and plugin not configured', () => {
    const config: ExpoConfig = {
      name: 'test',
      slug: 'test',
      android: { edgeToEdgeEnabled: undefined },
    };
    applyEdgeToEdge(config);
    expect(WarningAggregator.addWarningAndroid).toHaveBeenCalledWith(
      'EDGE_TO_EDGE_PLUGIN',
      expect.stringContaining('No configuration found for `edgeToEdgeEnabled`'),
      expect.any(String)
    );
    expect(WarningAggregator.addWarningAndroid).toHaveBeenCalledTimes(1);
    // Check flow: Should attempt to load plugin, find it (default mock), determine enabled=false, configure gradle, configure enforcement (disable=true), restore theme
    expect(mockLoadEdgeToEdgeConfigPlugin).toHaveBeenCalledTimes(1);
    expect(mockWithEdgeToEdgeEnabledGradleProperties).toHaveBeenCalledWith(expect.anything(), {
      edgeToEdgeEnabled: false,
    });
    expect(mockWithConfigureEdgeToEdgeEnforcement).toHaveBeenCalledWith(expect.anything(), {
      disableEdgeToEdgeEnforcement: true,
    });
    expect(mockWithRestoreDefaultTheme).toHaveBeenCalledTimes(1);
    expect(mockEdgeToEdgePlugin).not.toHaveBeenCalled(); // Should not run the external plugin
  });

  it('should add warnings when edgeToEdgeEnabled is false and plugin not configured', () => {
    const config: ExpoConfig = {
      name: 'test',
      slug: 'test',
      android: { edgeToEdgeEnabled: false },
    };
    applyEdgeToEdge(config);
    expect(WarningAggregator.addWarningAndroid).toHaveBeenCalledWith(
      'EDGE_TO_EDGE_PLUGIN',
      expect.stringContaining('`edgeToEdgeEnabled` field is explicitly set to false'),
      expect.any(String)
    );
    expect(WarningAggregator.addWarningAndroid).toHaveBeenCalledTimes(1);
    // Check flow: Same as undefined case when plugin not present
    expect(mockLoadEdgeToEdgeConfigPlugin).toHaveBeenCalledTimes(1);
    expect(mockWithEdgeToEdgeEnabledGradleProperties).toHaveBeenCalledWith(expect.anything(), {
      edgeToEdgeEnabled: false,
    });
    expect(mockWithConfigureEdgeToEdgeEnforcement).toHaveBeenCalledWith(expect.anything(), {
      disableEdgeToEdgeEnforcement: true,
    });
    expect(mockWithRestoreDefaultTheme).toHaveBeenCalledTimes(1);
    expect(mockEdgeToEdgePlugin).not.toHaveBeenCalled();
  });

  it('should not add enablement warnings when edgeToEdgeEnabled is true', () => {
    const config: ExpoConfig = { name: 'test', slug: 'test', android: { edgeToEdgeEnabled: true } };
    applyEdgeToEdge(config);
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
    // Check flow: Should load plugin, determine enabled=true, configure gradle, configure enforcement (disable=false), run external plugin
    expect(mockLoadEdgeToEdgeConfigPlugin).toHaveBeenCalledTimes(1);
    expect(mockWithEdgeToEdgeEnabledGradleProperties).toHaveBeenCalledWith(expect.anything(), {
      edgeToEdgeEnabled: true,
    });
    expect(mockWithConfigureEdgeToEdgeEnforcement).toHaveBeenCalledWith(expect.anything(), {
      disableEdgeToEdgeEnforcement: false,
    });
    expect(mockWithRestoreDefaultTheme).not.toHaveBeenCalled();
    expect(mockEdgeToEdgePlugin).toHaveBeenCalledTimes(1);
    expect(mockEdgeToEdgePlugin).toHaveBeenCalledWith(expect.anything(), {
      android: { parentTheme: 'Default', enforceNavigationBarContrast: true },
    });
  });

  it('should add conflict warning and skip external plugin/restore if plugin is manually configured and edgeToEdgeEnabled=false', () => {
    const config: ExpoConfig = {
      name: 'test',
      slug: 'test',
      android: { edgeToEdgeEnabled: false },
      plugins: ['react-native-edge-to-edge/app.plugin.js'],
    };
    applyEdgeToEdge(config);
    expect(WarningAggregator.addWarningAndroid).toHaveBeenCalledWith(
      'EDGE_TO_EDGE_CONFLICT',
      expect.stringContaining('configured the `react-native-edge-to-edge` plugin')
    );
    expect(WarningAggregator.addWarningAndroid).not.toHaveBeenCalledWith(
      // Should not show the 'explicitly false' warning
      'EDGE_TO_EDGE_PLUGIN',
      expect.stringContaining('explicitly set to false'),
      expect.any(String)
    );
    // Check flow: Should load plugin, determine enabled=true (due to plugin presence), configure gradle, configure enforcement (disable=false), *skip* restore/external plugin call
    expect(mockLoadEdgeToEdgeConfigPlugin).toHaveBeenCalledTimes(1);
    expect(mockWithEdgeToEdgeEnabledGradleProperties).toHaveBeenCalledWith(expect.anything(), {
      edgeToEdgeEnabled: true,
    }); // Enabled=true because plugin is present
    expect(mockWithConfigureEdgeToEdgeEnforcement).toHaveBeenCalledWith(expect.anything(), {
      disableEdgeToEdgeEnforcement: false,
    }); // Enforcement ON
    expect(mockWithRestoreDefaultTheme).not.toHaveBeenCalled();
    expect(mockEdgeToEdgePlugin).not.toHaveBeenCalled(); // External plugin skipped
  });

  it('should skip external plugin/restore if plugin is manually configured and edgeToEdgeEnabled=true', () => {
    const config: ExpoConfig = {
      name: 'test',
      slug: 'test',
      android: { edgeToEdgeEnabled: true },
      plugins: ['react-native-edge-to-edge/app.plugin.js'],
    };
    applyEdgeToEdge(config);
    expect(WarningAggregator.addWarningAndroid).not.toHaveBeenCalledWith(
      // No conflict warning needed here
      'EDGE_TO_EDGE_CONFLICT',
      expect.any(String)
    );
    // Check flow: Should load plugin, determine enabled=true, configure gradle, configure enforcement (disable=false), *skip* restore/external plugin call
    expect(mockLoadEdgeToEdgeConfigPlugin).toHaveBeenCalledTimes(1);
    expect(mockWithEdgeToEdgeEnabledGradleProperties).toHaveBeenCalledWith(expect.anything(), {
      edgeToEdgeEnabled: true,
    });
    expect(mockWithConfigureEdgeToEdgeEnforcement).toHaveBeenCalledWith(expect.anything(), {
      disableEdgeToEdgeEnforcement: false,
    }); // Enforcement ON
    expect(mockWithRestoreDefaultTheme).not.toHaveBeenCalled();
    expect(mockEdgeToEdgePlugin).not.toHaveBeenCalled(); // External plugin skipped
  });

  it('should warn, disable enforcement, and restore theme if edge-to-edge plugin cannot be loaded', () => {
    mockLoadEdgeToEdgeConfigPlugin.mockReturnValue(null); // Simulate load failure
    const config: ExpoConfig = { name: 'test', slug: 'test', android: { edgeToEdgeEnabled: true } }; // Try to enable

    applyEdgeToEdge(config);

    expect(WarningAggregator.addWarningAndroid).toHaveBeenCalledWith(
      'EDGE_TO_EDGE_PLUGIN',
      expect.stringContaining('Failed to load the react-native-edge-to-edge config plugin')
    );
    // Check flow: Load plugin fails, determine enabled=false, configure gradle(false), configure enforcement (disable=true), restore theme
    expect(mockLoadEdgeToEdgeConfigPlugin).toHaveBeenCalledTimes(1);
    expect(mockWithEdgeToEdgeEnabledGradleProperties).toHaveBeenCalledWith(expect.anything(), {
      edgeToEdgeEnabled: false,
    });
    expect(mockWithConfigureEdgeToEdgeEnforcement).toHaveBeenCalledWith(expect.anything(), {
      disableEdgeToEdgeEnforcement: true,
    });
    expect(mockWithRestoreDefaultTheme).toHaveBeenCalledTimes(1);
    expect(mockEdgeToEdgePlugin).not.toHaveBeenCalled();
  });
});
