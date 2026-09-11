import { Cache } from '@expo/metro/metro-cache';
import { vol } from 'memfs';

import { getDefaultConfig, createStableModuleIdFactory } from '../ExpoMetroConfig';
import { FileStore } from '../binary-file-store';

const projectRoot = '/';
const consoleError = console.error;

function mockProject() {
  vol.fromJSON(
    {
      'package.json': JSON.stringify({
        name: 'hello-world',
        private: true,
      }),
      'node_modules/react-native/package.json': '',
      'node_modules/react-native/node_modules/metro-runtime/package.json': '',
      'node_modules/react-native/node_modules/metro-runtime/src/modules/asyncRequire.js': '',
      'node_modules/metro-react-native-babel-transformer/package.json': '',
    },
    projectRoot
  );
}
describe(getDefaultConfig, () => {
  beforeEach(() => {
    delete process.env.EXPO_METRO_CACHE_DIR;
    mockProject();
  });
  afterEach(() => {
    delete process.env.EXPO_METRO_CACHE_DIR;
    vol.reset();
  });
  afterAll(() => {
    console.error = consoleError;
  });

  it.each([undefined, ''])('keeps the default store with cache root=%s', (root) => {
    if (root !== undefined) {
      process.env.EXPO_METRO_CACHE_DIR = root;
    }
    const stores = getDefaultConfig(projectRoot).cacheStores;
    expect(stores).toHaveLength(1);
    expect(Array.isArray(stores) && stores[0]).toBeInstanceOf(FileStore);
  });

  it('collects restored hits and new transforms without unused restored entries', async () => {
    process.env.EXPO_METRO_CACHE_DIR = '/cache';
    const restored = new FileStore<Buffer>({ root: '/cache/restored' });
    const output = new FileStore<Buffer>({ root: '/cache/output' });
    const reusedKey = Buffer.from('aabb', 'hex');
    const unusedKey = Buffer.from('aacc', 'hex');
    const newKey = Buffer.from('aadd', 'hex');
    const reusedValue = Buffer.from('unchanged module');
    const newValue = Buffer.from('changed module');
    await restored.set(reusedKey, reusedValue);
    await restored.set(unusedKey, Buffer.from('unused module'));

    const stores = getDefaultConfig(projectRoot).cacheStores;
    if (!Array.isArray(stores)) {
      throw new Error('Expected an array of cache stores');
    }
    expect(stores).toHaveLength(1);
    const cache = new Cache<Buffer>(stores);
    expect(await cache.get(reusedKey)).toEqual(reusedValue);
    // A read alone must collect the restored entry.
    expect(await output.get(reusedKey)).toEqual(reusedValue);
    expect(await cache.get(newKey)).toBeNull();
    await cache.set(newKey, newValue);

    expect(await output.get(reusedKey)).toEqual(reusedValue);
    expect(await output.get(newKey)).toEqual(newValue);
    expect(await output.get(unusedKey)).toBeNull();
    expect(await restored.get(unusedKey)).toEqual(Buffer.from('unused module'));

    for (const store of stores) {
      await store.clear();
    }
    expect(await output.get(reusedKey)).toBeNull();
    expect(await restored.get(reusedKey)).toBeNull();
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

  it('loads default configuration for apps', () => {
    expect(getDefaultConfig(projectRoot).resolver?.sourceExts).toEqual(
      expect.not.arrayContaining(['expo.js'])
    );
  });

  it("neutralizes Metro's `useWatchman` default so the Node watcher is used by default", () => {
    expect(getDefaultConfig(projectRoot).resolver?.useWatchman).toBeNull();
  });
});

describe(createStableModuleIdFactory, () => {
  it('defaults to standard behavior without context object', () => {
    const factory = createStableModuleIdFactory('/');
    expect(factory('/react.js')).toBe(factory('react.js'));
  });
  it('creates scoped module IDs for SSR', () => {
    const factory = createStableModuleIdFactory('/');
    expect(factory('/react.js', { platform: 'ios', environment: 'react-server' })).toBe(
      factory('react.js?platform=ios&env=react-server')
    );
    expect(factory('/react.js', { platform: 'ios', environment: 'client' })).toBe(
      factory('react.js')
    );
  });
  it('asserts platform is missing for SSR context', () => {
    const factory = createStableModuleIdFactory('/');
    // @ts-expect-error
    expect(() => factory('/react.js', { environment: 'react-server' })).toThrow();
  });
});
