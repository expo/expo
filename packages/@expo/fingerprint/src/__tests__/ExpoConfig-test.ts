import resolveFrom from 'resolve-from';

import { getExpoConfigAsync, diffLoadedModules } from '../ExpoConfig';
import type { LoadedModuleSource } from '../ExpoConfigLoader';
import { normalizeOptionsAsync } from '../Options';
import { spawnWithIpcAsync } from '../utils/SpawnIPC';

jest.mock('resolve-from');
jest.mock('../ProjectWorkflow');
jest.mock('../utils/SpawnIPC');

describe(getExpoConfigAsync, () => {
  const originalEnv = process.env;
  const actualResolveFromSilent = jest.requireActual('resolve-from').silent;

  beforeEach(() => {
    process.env = { ...originalEnv };
    jest
      .mocked(resolveFrom.silent)
      .mockImplementation((_fromDirectory, moduleId) =>
        actualResolveFromSilent(__dirname, moduleId)
      );
    jest.mocked(spawnWithIpcAsync).mockResolvedValue({
      output: [],
      stdout: JSON.stringify({ config: null, loadedModules: [] }),
      message: JSON.stringify({ config: null, loadedModules: [] }),
      stderr: '',
      signal: null,
      status: 0,
    });
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.clearAllMocks();
  });

  it('should return null if the expo package is not found', async () => {
    jest
      .mocked(resolveFrom.silent)
      .mockImplementation((_fromDirectory, moduleId) =>
        moduleId === 'expo/config' ? undefined : actualResolveFromSilent(__dirname, moduleId)
      );

    const result = await getExpoConfigAsync('/app', await normalizeOptionsAsync('/app'));

    expect(result.config).toBeNull();
    expect(result.loadedModules).toBeNull();
  });

  it('uses development mode for the config loader', async () => {
    process.env.NODE_ENV = 'production';
    process.env.EXPO_CONFIG_MODE = 'production';

    await getExpoConfigAsync('/app', await normalizeOptionsAsync('/app'));

    expect(spawnWithIpcAsync).toHaveBeenCalledTimes(2);
    for (const [, args, options] of jest.mocked(spawnWithIpcAsync).mock.calls) {
      expect(args).toEqual(expect.arrayContaining(['--mode', 'development']));
      expect(options?.env).toMatchObject({ NODE_ENV: 'development' });
      expect(options?.env?.EXPO_CONFIG_MODE).toBeUndefined();
    }
  });
});

describe(diffLoadedModules, () => {
  const file = (p: string): LoadedModuleSource => ({ type: 'file', path: p });
  const contents = (id: string): LoadedModuleSource => ({ type: 'contents', id, contents: 'x' });

  it('should drop a node_modules module that also loads without plugins', async () => {
    const full = [file('node_modules/@expo/config-plugins/build/index.js')];
    const withoutPlugins = [file('node_modules/@expo/config-plugins/build/index.js')];
    expect(diffLoadedModules(full, withoutPlugins)).toEqual([]);
  });

  it('should keep a node_modules module that only loads when plugins are applied', async () => {
    const full = [file('node_modules/expo-router/plugin/build/withRouter.js')];
    expect(diffLoadedModules(full, [])).toEqual([
      file('node_modules/expo-router/plugin/build/withRouter.js'),
    ]);
  });

  it('should always keep an in-repo file even when it also loads without plugins', async () => {
    const full = [file('plugins/withLocalPlugin.ts')];
    const withoutPlugins = [file('plugins/withLocalPlugin.ts')];
    expect(diffLoadedModules(full, withoutPlugins)).toEqual([file('plugins/withLocalPlugin.ts')]);
  });

  it('should always keep an in-repo contents (virtual) module', async () => {
    const full = [contents('plugins/virtual.js')];
    const withoutPlugins = [contents('plugins/virtual.js')];
    expect(diffLoadedModules(full, withoutPlugins)).toEqual([contents('plugins/virtual.js')]);
  });

  it('should treat a linked/hoisted dep (starting with ..) as excludable framework', async () => {
    const full = [file('../../packages/@expo/config/build/index.js')];
    const withoutPlugins = [file('../../packages/@expo/config/build/index.js')];
    expect(diffLoadedModules(full, withoutPlugins)).toEqual([]);
  });
});
