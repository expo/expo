import { getDefaultMetroConfig, loadMetroUserConfigAsync } from '../../utils/metroConfigLoader';
import { MetroConfigCheck } from '../MetroConfigCheck';

jest.mock('../../utils/metroConfigLoader');

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

const mockDefaultConfig = (overrides: Record<string, unknown> = {}) => {
  jest
    .mocked(getDefaultMetroConfig)
    .mockReturnValueOnce({ ...stubDefaultConfig(), ...overrides } as any);
};

const mockUserConfig = (userConfig: Record<string, unknown> | null) => {
  jest.mocked(loadMetroUserConfigAsync).mockResolvedValueOnce(userConfig as any);
};

describe('runAsync', () => {
  it('returns result with isSuccessful = true when no user config is found', async () => {
    mockUserConfig(null);
    const check = new MetroConfigCheck();
    const result = await check.runAsync({
      projectRoot: '/path/to/project',
      ...additionalProjectProps,
    });
    expect(result.isSuccessful).toBeTruthy();
  });

  it('returns result with isSuccessful = true if a config includes `_expoRelativeProjectRoot`', async () => {
    mockUserConfig({
      transformer: {
        _expoRelativeProjectRoot: '...',
      },
    });
    mockDefaultConfig();
    const check = new MetroConfigCheck();
    const result = await check.runAsync({
      projectRoot: '/path/to/project',
      ...additionalProjectProps,
    });
    expect(result.isSuccessful).toBeTruthy();
  });

  it('returns result with isSuccessful = false if a config does not include `_expoRelativeProjectRoot`', async () => {
    mockUserConfig({
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
  const runWithUserConfig = async (
    userConfig: Record<string, unknown>,
    expOverrides: Record<string, unknown> = {}
  ) => {
    mockDefaultConfig();
    mockUserConfig({ ...stubDefaultConfig(), ...userConfig });
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
    mockDefaultConfig({ watchFolders: ['/path/to/project/packages/foo'] });
    mockUserConfig({ ...stubDefaultConfig(), watchFolders: [] });
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
    mockDefaultConfig({ watchFolders: ['/path/to/project/packages/foo'] });
    mockUserConfig({ ...stubDefaultConfig(), watchFolders: [] });
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
    mockDefaultConfig({
      resolver: { ...stubDefaultConfig().resolver, nodeModulesPaths: ['/expected/node_modules'] },
    });
    mockUserConfig({
      ...stubDefaultConfig(),
      resolver: { ...stubDefaultConfig().resolver, nodeModulesPaths: ['/other/node_modules'] },
    });
    const check = new MetroConfigCheck();
    const result = await check.runAsync({
      projectRoot: '/path/to/project',
      ...additionalProjectProps,
      exp: { ...additionalProjectProps.exp, sdkVersion: '56.0.0' } as any,
    });
    expect(result.issues.find((i) => i.includes('nodeModulesPaths'))).toBeDefined();
  });

  it('skips nodeModulesPaths check when user has not set any', async () => {
    mockDefaultConfig({
      resolver: { ...stubDefaultConfig().resolver, nodeModulesPaths: ['/expected/node_modules'] },
    });
    mockUserConfig(stubDefaultConfig());
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
