import glob from 'fast-glob';
import { vol } from 'memfs';

import { resolveDependencyConfigImplIosAsync } from '../iosResolver';

jest.mock('fast-glob');
jest.mock('fs/promises');

describe(resolveDependencyConfigImplIosAsync, () => {
  const mockGlob = glob as jest.MockedFunction<typeof glob>;

  afterEach(() => {
    vol.reset();
  });

  it('should return ios config if podspec found', async () => {
    mockGlob.mockResolvedValueOnce(['RNTest.podspec']);
    vol.fromJSON({
      '/app/node_modules/react-native-test/package.json': JSON.stringify({ version: '1.0.0' }),
      '/app/node_modules/react-native-test/RNTest.podspec': '',
    });
    const result = await resolveDependencyConfigImplIosAsync(
      '/app/node_modules/react-native-test',
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
    mockGlob.mockResolvedValueOnce(['RNTest.podspec']);
    vol.fromJSON({
      '/app/node_modules/react-native-test/package.json': JSON.stringify({ version: '1.0.0' }),
      '/app/node_modules/react-native-test/RNTest.podspec': '',
    });
    const result = await resolveDependencyConfigImplIosAsync(
      '/app/node_modules/react-native-test',
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
      '/app/node_modules/react-native-test',
      null
    );
    expect(result).toBeNull();
  });

  it('should return null if no podspec found', async () => {
    const result = await resolveDependencyConfigImplIosAsync(
      '/app/node_modules/react-native-test',
      undefined
    );
    expect(result).toBeNull();
  });

  it('should resolve podspec if the base name is matching the package name', async () => {
    mockGlob.mockResolvedValueOnce([
      'react-native-google-maps.podspec',
      'react-native-maps.podspec',
    ]);
    vol.fromJSON({
      '/app/node_modules/react-native-maps/package.json': JSON.stringify({ version: '1.0.0' }),
      '/app/node_modules/react-native-maps/react-native-google-maps.podspec': '',
      '/app/node_modules/react-native-maps/react-native-maps.podspec': '',
    });
    const result = await resolveDependencyConfigImplIosAsync(
      '/app/node_modules/react-native-maps',
      undefined
    );
    expect(result?.podspecPath).toBe(
      '/app/node_modules/react-native-maps/react-native-maps.podspec'
    );
  });
});
