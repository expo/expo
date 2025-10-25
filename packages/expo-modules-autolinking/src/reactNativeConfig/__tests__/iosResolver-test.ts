import { vol } from 'memfs';

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
});
