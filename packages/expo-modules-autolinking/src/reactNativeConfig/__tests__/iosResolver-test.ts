import { vol } from 'memfs';

import { ExpoModuleConfig } from '../../ExpoModuleConfig';
import { resolveDependencyConfigImplIosAsync } from '../iosResolver';

jest.mock('fs/promises');
jest.mock('fs');

describe(resolveDependencyConfigImplIosAsync, () => {
  afterEach(() => {
    vol.reset();
  });

  it('should return ios config if podspec found', async () => {
    vol.fromJSON({
      '/app/node_modules/react-native-test/RNTest.podspec': '',
    });
    const result = await resolveDependencyConfigImplIosAsync(
      { path: '/app/node_modules/react-native-test', version: '1.0.0' },
      undefined
    );
    expect(result).toMatchInlineSnapshot(`
      {
        "configurations": [],
        "podspecPath": "/app/node_modules/react-native-test/RNTest.podspec",
        "scriptPhases": [],
        "version": "1.0.0",
      }
    `);
  });

  it('should return ios config with override reactNativeConfig', async () => {
    vol.fromJSON({
      '/app/node_modules/react-native-test/RNTest.podspec': '',
    });
    const result = await resolveDependencyConfigImplIosAsync(
      { path: '/app/node_modules/react-native-test', version: '1.0.0' },
      {
        configurations: ['Debug'],
        scriptPhases: [{ name: 'test', path: './test.sh' }],
      }
    );
    expect(result).toMatchInlineSnapshot(`
      {
        "configurations": [
          "Debug",
        ],
        "podspecPath": "/app/node_modules/react-native-test/RNTest.podspec",
        "scriptPhases": [
          {
            "name": "test",
            "path": "./test.sh",
          },
        ],
        "version": "1.0.0",
      }
    `);
  });

  it('should return null if reactNativeConfig is null', async () => {
    const result = await resolveDependencyConfigImplIosAsync(
      { path: '/app/node_modules/react-native-test', version: '' },
      null
    );
    expect(result).toBeNull();
  });

  it('should return null if no podspec found', async () => {
    const result = await resolveDependencyConfigImplIosAsync(
      { path: '/app/node_modules/react-native-test', version: '' },
      undefined
    );
    expect(result).toBeNull();
  });

  it('should resolve podspec if the base name is matching the package name', async () => {
    vol.fromJSON({
      '/app/node_modules/react-native-maps/react-native-google-maps.podspec': '',
      '/app/node_modules/react-native-maps/react-native-maps.podspec': '',
    });
    const result = await resolveDependencyConfigImplIosAsync(
      { path: '/app/node_modules/react-native-maps', version: '' },
      undefined
    );
    expect(result?.podspecPath).toBe(
      '/app/node_modules/react-native-maps/react-native-maps.podspec'
    );
  });

  it('should resolve podspec if the base name is matching the package name case-insensitively', async () => {
    vol.fromJSON({
      '/app/node_modules/react-native-maps/react-native-google-maps.podspec': '',
      '/app/node_modules/react-native-maps/React-Native-Maps.podspec': '',
    });
    const result = await resolveDependencyConfigImplIosAsync(
      { path: '/app/node_modules/react-native-maps', version: '' },
      undefined
    );
    expect(result?.podspecPath).toBe(
      '/app/node_modules/react-native-maps/React-Native-Maps.podspec'
    );
  });

  it('should not resolve podspec if the file overlaps with Expo Module', async () => {
    vol.fromJSON({
      '/app/node_modules/react-native-maps/react-native-maps.podspec': '',
    });
    const result = await resolveDependencyConfigImplIosAsync(
      { path: '/app/node_modules/react-native-maps', version: '' },
      undefined,
      new ExpoModuleConfig({
        platforms: ['ios'],
        apple: {
          podspecPath: 'react-native-maps.podspec',
        },
      })
    );
    expect(result?.podspecPath).toBe(undefined);
  });

  describe('out-of-tree Apple platforms', () => {
    const resolution = { path: '/app/node_modules/react-native-test', version: '1.0.0' };
    const podspec = (contents: string) => {
      vol.fromJSON({ '/app/node_modules/react-native-test/RNTest.podspec': contents });
    };

    it('returns null for macos when the podspec declares platforms without osx', async () => {
      podspec(
        `s.platforms = { :ios => min_ios_version_supported, :tvos => '15.1', :visionos => '1.0' }`
      );
      const result = await resolveDependencyConfigImplIosAsync(resolution, undefined, undefined, {
        platform: 'macos',
      });
      expect(result).toBeNull();
    });

    it('returns null for tvos when the podspec only has an ios deployment target', async () => {
      podspec(`s.ios.deployment_target = '15.1'`);
      const result = await resolveDependencyConfigImplIosAsync(resolution, undefined, undefined, {
        platform: 'tvos',
      });
      expect(result).toBeNull();
    });

    it('returns the config for macos when the podspec declares osx', async () => {
      podspec(`s.platforms = { :ios => '15.1', :osx => '10.15' }`);
      const result = await resolveDependencyConfigImplIosAsync(resolution, undefined, undefined, {
        platform: 'macos',
      });
      expect(result?.podspecPath).toBe('/app/node_modules/react-native-test/RNTest.podspec');
    });

    it('accepts the symbol-key hash syntax and per-platform deployment targets', async () => {
      podspec(`s.platforms = { ios: '15.1', osx: '10.15' }`);
      expect(
        await resolveDependencyConfigImplIosAsync(resolution, undefined, undefined, {
          platform: 'macos',
        })
      ).not.toBeNull();

      podspec(`s.ios.deployment_target = '15.1'\ns.tvos.deployment_target = '15.1'`);
      expect(
        await resolveDependencyConfigImplIosAsync(resolution, undefined, undefined, {
          platform: 'tvos',
        })
      ).not.toBeNull();
    });

    it('ignores platforms that only appear in comments', async () => {
      podspec(`s.platforms = {\n  :ios => '16.4',\n  # :osx => '13.4',\n  :tvos => '16.4'\n}`);
      const result = await resolveDependencyConfigImplIosAsync(resolution, undefined, undefined, {
        platform: 'macos',
      });
      expect(result).toBeNull();
    });

    it('keeps the dependency when the podspec does not spell out its platforms', async () => {
      podspec(`s.platforms = min_supported_versions`);
      const result = await resolveDependencyConfigImplIosAsync(resolution, undefined, undefined, {
        platform: 'macos',
      });
      expect(result).not.toBeNull();
    });

    it('never filters the ios platform itself', async () => {
      podspec(`s.osx.deployment_target = '10.15'`);
      const result = await resolveDependencyConfigImplIosAsync(resolution, undefined, undefined, {
        platform: 'ios',
      });
      expect(result).not.toBeNull();
    });
  });
});
