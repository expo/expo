import type { ExpoMetroConfig } from '../ExpoMetroConfig';

jest.mock('@expo/metro-file-map', () => {
  const FileMap = Object.assign(jest.fn(), { H: { NATIVE_PLATFORM: 'native' } });
  return {
    __esModule: true,
    default: FileMap,
    DependencyPlugin: jest.fn(),
    DiskCacheManager: jest.fn(),
    HastePlugin: jest.fn(),
  };
});

const config = {
  projectRoot: '/project',
  watchFolders: ['/project'],
  maxWorkers: 1,
  resetCache: false,
  server: { unstable_serverRoot: null },
  resolver: {
    assetExts: [],
    blockList: [],
    dependencyExtractor: null,
    enableGlobalPackages: false,
    platforms: [],
    sourceExts: ['js'],
  },
  watcher: {
    additionalExts: [],
    healthCheck: { enabled: false },
    watchman: { deferStates: [] },
  },
} as unknown as ExpoMetroConfig;

/** Loads `createFileMap` fresh, so it sees the current environment, and returns the `watch` passed to `FileMap`. */
function getWatch(options?: { watch?: boolean }): boolean {
  let watch: boolean | undefined;
  jest.isolateModules(() => {
    const { default: FileMap }: { default: jest.Mock } = require('@expo/metro-file-map');
    const {
      default: createFileMap,
    }: typeof import('../createFileMap-fork') = require('../createFileMap-fork');
    createFileMap(config, options);
    watch = FileMap.mock.calls[0][0].watch;
  });
  return watch!;
}

describe('createFileMap watch default', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.CI;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  test('watches when CI is unset', () => {
    expect(getWatch()).toBe(true);
  });

  test.each(['true', '1'])('does not watch when CI=%s', (value) => {
    process.env.CI = value;
    expect(getWatch()).toBe(false);
  });

  test.each(['', '0', 'false'])('watches when CI=%j', (value) => {
    process.env.CI = value;
    expect(getWatch()).toBe(true);
  });

  test('watches when only a CI vendor variable is set', () => {
    process.env.BUILD_NUMBER = '42';
    expect(getWatch()).toBe(true);
  });

  test('prefers an explicit watch option', () => {
    process.env.CI = 'true';
    expect(getWatch({ watch: true })).toBe(true);
  });
});
