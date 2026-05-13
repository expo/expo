import { getDefaultConfig } from 'expo/metro-config';

import {
  configExistsAsync,
  loadConfigAsync,
  loadExpoMetroConfig,
} from '../../utils/metroConfigLoader';
import { MetroConfigCheck } from '../MetroConfigCheck';

jest.mock('../../utils/metroConfigLoader');

// required by runAsync
const additionalProjectProps = {
  exp: {
    name: 'name',
    slug: 'slug',
  },
  pkg: {},
  hasUnusedStaticConfig: false,
  staticConfigPath: null,
  dynamicConfigPath: null,
};

const stubDefaultConfig = () =>
  ({
    watchFolders: [],
    transformer: {
      _expoRelativeProjectRoot: '.',
    },
    resolver: {
      nodeModulesPaths: [],
      sourceExts: ['js', 'ts'],
      assetExts: ['png'],
      platforms: ['ios', 'android'],
    },
  }) as any;

const mockExpoMetroConfig = (overrides: Record<string, unknown> = {}) => {
  jest.mocked(loadExpoMetroConfig).mockResolvedValueOnce({
    getDefaultConfig: () => ({ ...stubDefaultConfig(), ...overrides }),
  } as any);
};

describe('runAsync', () => {
  beforeEach(() => {
    jest.mocked(loadExpoMetroConfig).mockResolvedValueOnce({
      getDefaultConfig,
    } as any);
  });

  it('returns result with isSuccessful = true if there is no custom metro config', async () => {
    jest.mocked(configExistsAsync).mockResolvedValueOnce(false);
    const check = new MetroConfigCheck();
    const result = await check.runAsync({
      projectRoot: '/path/to/project',
      ...additionalProjectProps,
    });
    expect(result.isSuccessful).toBeTruthy();
  });

  it('returns result with isSuccessful = true if there is a custom metro config and it includes `_expoRelativeProjectRoot`', async () => {
    jest.mocked(configExistsAsync).mockResolvedValueOnce(true);
    jest.mocked(loadConfigAsync).mockResolvedValueOnce({
      transformer: {
        // @ts-ignore: we don't need to mock the entire config
        _expoRelativeProjectRoot: '...',
      },
    });
    const check = new MetroConfigCheck();
    const result = await check.runAsync({
      projectRoot: '/path/to/project',
      ...additionalProjectProps,
    });
    expect(result.isSuccessful).toBeTruthy();
  });

  it('returns result with isSuccessful = false if there is a custom metro config and it does not include `_expoRelativeProjectRoot`', async () => {
    jest.mocked(configExistsAsync).mockResolvedValueOnce(true);
    jest.mocked(loadConfigAsync).mockResolvedValueOnce({
      // @ts-ignore: we don't need to mock the entire config
      transformer: {},
    });
    const check = new MetroConfigCheck();
    const result = await check.runAsync({
      projectRoot: '/path/to/project',
      ...additionalProjectProps,
    });
    expect(result.isSuccessful).toBeFalsy();
  });
});

describe('config-comparison checks', () => {
  beforeEach(() => {
    jest.mocked(configExistsAsync).mockResolvedValue(true);
  });

  const runWithUserConfig = async (
    userConfig: Record<string, unknown>,
    expOverrides: Record<string, unknown> = {}
  ) => {
    jest.mocked(loadExpoMetroConfig).mockReset();
    mockExpoMetroConfig();
    jest.mocked(loadConfigAsync).mockResolvedValueOnce({
      ...stubDefaultConfig(),
      ...userConfig,
    } as any);
    const check = new MetroConfigCheck();
    return check.runAsync({
      projectRoot: '/path/to/project',
      ...additionalProjectProps,
      exp: { ...additionalProjectProps.exp, sdkVersion: '56.0.0', ...expOverrides },
    });
  };

  it('passes when user config matches Expo defaults', async () => {
    const result = await runWithUserConfig({});
    expect(result.isSuccessful).toBe(true);
  });

  it('skips watchFolders subset check on SDK 56+ with onDemandFilesystem default', async () => {
    const result = await runWithUserConfig(
      { watchFolders: [] },
      { experiments: { onDemandFilesystem: true } }
    );
    expect(result.issues.find((i) => i.includes('watchFolders'))).toBeUndefined();
  });

  it('runs watchFolders subset check on SDK 56+ when onDemandFilesystem is disabled', async () => {
    jest.mocked(loadExpoMetroConfig).mockReset();
    mockExpoMetroConfig({
      watchFolders: ['/path/to/project/packages/foo'],
    });
    jest.mocked(loadConfigAsync).mockResolvedValueOnce({
      ...stubDefaultConfig(),
      watchFolders: [],
    } as any);
    const check = new MetroConfigCheck();
    const result = await check.runAsync({
      projectRoot: '/path/to/project',
      ...additionalProjectProps,
      exp: {
        ...additionalProjectProps.exp,
        sdkVersion: '56.0.0',
        experiments: { onDemandFilesystem: false },
      } as any,
    });
    expect(result.issues.find((i) => i.includes('watchFolders'))).toBeDefined();
  });

  it('runs watchFolders subset check on SDK <56 regardless of experiments', async () => {
    jest.mocked(loadExpoMetroConfig).mockReset();
    mockExpoMetroConfig({
      watchFolders: ['/path/to/project/packages/foo'],
    });
    jest.mocked(loadConfigAsync).mockResolvedValueOnce({
      ...stubDefaultConfig(),
      watchFolders: [],
    } as any);
    const check = new MetroConfigCheck();
    const result = await check.runAsync({
      projectRoot: '/path/to/project',
      ...additionalProjectProps,
      exp: { ...additionalProjectProps.exp, sdkVersion: '55.0.0' } as any,
    });
    expect(result.issues.find((i) => i.includes('watchFolders'))).toBeDefined();
  });

  it('flags deprecated resolver.blacklistRE', async () => {
    const result = await runWithUserConfig({
      resolver: { ...stubDefaultConfig().resolver, blacklistRE: /node_modules/ },
    });
    expect(result.issues.find((i) => i.includes('blacklistRE'))).toBeDefined();
  });

  it('flags blockList patterns with the `g` flag', async () => {
    const result = await runWithUserConfig({
      resolver: { ...stubDefaultConfig().resolver, blockList: /foo/g },
    });
    expect(result.issues.find((i) => i.includes('blockList'))).toBeDefined();
  });

  it('flags blockList patterns with the `y` flag in arrays', async () => {
    const result = await runWithUserConfig({
      resolver: { ...stubDefaultConfig().resolver, blockList: [/safe/, /sticky/y] },
    });
    expect(result.issues.find((i) => i.includes('blockList'))).toBeDefined();
  });

  it('passes for blockList patterns without `g` or `y` flags', async () => {
    const result = await runWithUserConfig({
      resolver: { ...stubDefaultConfig().resolver, blockList: [/foo/i, /bar/] },
    });
    expect(result.issues.find((i) => i.includes('blockList'))).toBeUndefined();
  });

  it('flags nodeModulesPaths missing Expo defaults', async () => {
    jest.mocked(loadExpoMetroConfig).mockReset();
    mockExpoMetroConfig({
      resolver: { ...stubDefaultConfig().resolver, nodeModulesPaths: ['/expected/node_modules'] },
    });
    jest.mocked(loadConfigAsync).mockResolvedValueOnce({
      ...stubDefaultConfig(),
      resolver: { ...stubDefaultConfig().resolver, nodeModulesPaths: ['/other/node_modules'] },
    } as any);
    const check = new MetroConfigCheck();
    const result = await check.runAsync({
      projectRoot: '/path/to/project',
      ...additionalProjectProps,
      exp: { ...additionalProjectProps.exp, sdkVersion: '56.0.0' } as any,
    });
    expect(result.issues.find((i) => i.includes('nodeModulesPaths'))).toBeDefined();
  });

  it('skips nodeModulesPaths check when user has not set any', async () => {
    jest.mocked(loadExpoMetroConfig).mockReset();
    mockExpoMetroConfig({
      resolver: { ...stubDefaultConfig().resolver, nodeModulesPaths: ['/expected/node_modules'] },
    });
    jest.mocked(loadConfigAsync).mockResolvedValueOnce({ ...stubDefaultConfig() } as any);
    const check = new MetroConfigCheck();
    const result = await check.runAsync({
      projectRoot: '/path/to/project',
      ...additionalProjectProps,
      exp: { ...additionalProjectProps.exp, sdkVersion: '56.0.0' } as any,
    });
    expect(result.issues.find((i) => i.includes('nodeModulesPaths'))).toBeUndefined();
  });

  it('flags missing source/asset extensions', async () => {
    const result = await runWithUserConfig({
      resolver: { ...stubDefaultConfig().resolver, sourceExts: ['js'], assetExts: ['png'] },
    });
    expect(
      result.issues.find((i) => i.includes('sourceExts') && i.includes('assetExts'))
    ).toBeDefined();
  });

  it('passes when extensions are moved between source and asset', async () => {
    const result = await runWithUserConfig({
      resolver: { ...stubDefaultConfig().resolver, sourceExts: ['js'], assetExts: ['png', 'ts'] },
    });
    expect(
      result.issues.find((i) => i.includes('sourceExts') && i.includes('assetExts'))
    ).toBeUndefined();
  });

  it('flags resolver.disableHierarchicalLookup mismatch', async () => {
    const result = await runWithUserConfig({
      resolver: { ...stubDefaultConfig().resolver, disableHierarchicalLookup: true },
    });
    expect(result.issues.find((i) => i.includes('disableHierarchicalLookup'))).toBeDefined();
  });

  it('flags resolver.unstable_allowRequireContext mismatch', async () => {
    const result = await runWithUserConfig({
      resolver: { ...stubDefaultConfig().resolver, unstable_allowRequireContext: false },
    });
    expect(result.issues.find((i) => i.includes('unstable_allowRequireContext'))).toBeDefined();
  });

  it('flags resolver.unstable_enableSymlinks mismatch', async () => {
    const result = await runWithUserConfig({
      resolver: { ...stubDefaultConfig().resolver, unstable_enableSymlinks: false },
    });
    expect(result.issues.find((i) => i.includes('unstable_enableSymlinks'))).toBeDefined();
  });
});
