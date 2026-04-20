import {
  WarningAggregator,
  AndroidConfig,
  ExportedConfigWithProps,
  ModConfig,
} from '@expo/config-plugins';
import { type ExpoConfig } from '@expo/config-types';

import { applyEdgeToEdge } from '../withEdgeToEdge';
import { restoreDefaultTheme } from '../withRestoreDefaultTheme';

const mockWithRestoreDefaultTheme = jest.fn((config) => config);

jest.mock('../withRestoreDefaultTheme', () => {
  const originalModule = jest.requireActual('../withRestoreDefaultTheme');
  return {
    __esModule: true,
    ...originalModule,
    withRestoreDefaultTheme: mockWithRestoreDefaultTheme,
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

// --- Tests for applyEdgeToEdge ---

describe('applyEdgeToEdge', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    mockWithRestoreDefaultTheme.mockImplementation((config) => config);
  });

  it('should add warnings when edgeToEdgeEnabled is defined', () => {
    const config: ExpoConfig = {
      name: 'test',
      slug: 'test',
      android: { edgeToEdgeEnabled: true },
    };
    applyEdgeToEdge(config);
    expect(WarningAggregator.addWarningAndroid).toHaveBeenCalledWith(
      'EDGE_TO_EDGE_PLUGIN',
      expect.stringContaining('`edgeToEdgeEnabled`')
    );
    expect(WarningAggregator.addWarningAndroid).toHaveBeenCalledTimes(1);

    expect(mockWithRestoreDefaultTheme).toHaveBeenCalledTimes(1);
  });
});
