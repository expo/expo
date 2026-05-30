import FileMap from '@expo/metro-file-map';

import createFileMap from '../createFileMap-fork';

jest.mock('@expo/metro-file-map', () => {
  const MockFileMap = jest.fn();
  (MockFileMap as any).H = {
    NATIVE_PLATFORM: 'native',
  };

  return {
    __esModule: true,
    default: MockFileMap,
    DependencyPlugin: jest.fn(),
    DiskCacheManager: jest.fn(),
    HastePlugin: jest.fn(),
  };
});

function createConfig(useWatchman: boolean | null | undefined) {
  return {
    fileMapCacheDirectory: '/tmp/metro-cache',
    hasteMapCacheDirectory: '/tmp/haste-cache',
    maxWorkers: 1,
    projectRoot: '/project',
    resetCache: false,
    resolver: {
      assetExts: [],
      blacklistRE: null,
      blockList: null,
      dependencyExtractor: null,
      enableGlobalPackages: false,
      hasteImplModulePath: null,
      platforms: [],
      sourceExts: ['js'],
      unstable_onDemandFilesystem: true,
      useWatchman,
    },
    server: {
      unstable_serverRoot: '/project',
    },
    unstable_fileMapPlugins: [],
    unstable_perfLoggerFactory: null,
    watcher: {
      additionalExts: [],
      healthCheck: {
        enabled: false,
        filePrefix: '.metro-health-check',
        interval: 30000,
        timeout: 5000,
      },
      unstable_autoSaveCache: {
        enabled: false,
      },
      unstable_lazySha1: true,
      watchman: {
        deferStates: [],
      },
    },
  } as any;
}

describe(createFileMap, () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test.each([undefined, null, true, false])(
    'passes resolver.useWatchman %s through to FileMap',
    (useWatchman) => {
      createFileMap(createConfig(useWatchman), { watch: true });

      expect(FileMap).toHaveBeenCalledWith(expect.objectContaining({ useWatchman }));
    }
  );
});
