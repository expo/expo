import { vol } from 'memfs';

import { getDefaultConfig, loadAsync } from '../ExpoMetroConfig';

const projectRoot = '/';
const consoleError = console.error;

beforeEach(() => {
  delete process.env.EXPO_USE_EXOTIC;
});

function mockProject() {
  vol.fromJSON(
    {
      'package.json': JSON.stringify({
        name: 'hello-world',
        private: true,
      }),
      'node_modules/expo-asset/tools/hashAssetFiles.js': '',
      'node_modules/react-native/package.json': '',
      'node_modules/babel-preset-fbjs/package.json': '',
      'node_modules/metro-react-native-babel-transformer/package.json': '',
    },
    projectRoot
  );
}
describe(getDefaultConfig, () => {
  beforeEach(() => {
    mockProject();
  });
  afterEach(() => {
    vol.reset();
  });
  afterAll(() => {
    console.error = consoleError;
  });

  it('loads default configuration', () => {
    expect(getDefaultConfig(projectRoot)).toEqual(
      expect.objectContaining({
        projectRoot,
        resolver: expect.objectContaining({
          resolverMainFields: expect.arrayContaining(['react-native', 'browser', 'main']),
          sourceExts:
            expect.not.arrayContaining(['expo.ts', 'expo.tsx', 'expo.js', 'expo.jsx', 'jsx']) &&
            expect.arrayContaining(['json']),
          assetExts: expect.not.arrayContaining(['json']),
        }),
      })
    );
  });

  it('loads exotic configuration', () => {
    expect(getDefaultConfig(projectRoot, { mode: 'exotic' })).toEqual(
      expect.objectContaining({
        projectRoot,
        resolver: expect.objectContaining({
          resolverMainFields: ['browser', 'main'],
          sourceExts: expect.arrayContaining(['cjs']),
        }),
      })
    );
  });

  it('loads default configuration for apps', () => {
    expect(getDefaultConfig(projectRoot).resolver.sourceExts).toEqual(
      expect.not.arrayContaining(['expo.js'])
    );
  });
});

describe(loadAsync, () => {
  beforeEach(() => {
    mockProject();
  });
  afterEach(() => {
    vol.reset();
  });
  it('adds runtime options to the default configuration', async () => {
    const options = {
      maxWorkers: 10,
      resetCache: true,
      reporter: { update() {} },
      sourceExts: ['yml', 'toml', 'json'],
      assetExts: ['json'],
    };
    const config = await loadAsync(projectRoot, options);

    expect(config).toMatchObject({
      maxWorkers: options.maxWorkers,
      resetCache: options.resetCache,
      reporter: options.reporter,
      resolver: {
        sourceExts: options.sourceExts,
        assetExts: options.assetExts,
      },
    });
  });
});
