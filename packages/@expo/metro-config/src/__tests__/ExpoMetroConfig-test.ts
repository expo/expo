import path from 'path';

import { getDefaultConfig, loadAsync } from '../ExpoMetroConfig';

const projectRoot = path.join(__dirname, '__fixtures__', 'hello-world');
const consoleError = console.error;

beforeEach(() => {
  delete process.env.EXPO_USE_EXOTIC;
});

describe(getDefaultConfig, () => {
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
