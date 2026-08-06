import resolveFrom from 'resolve-from';

import { getExpoConfigAsync, diffLoadedModules } from '../ExpoConfig';
import type { LoadedModuleSource } from '../ExpoConfigLoader';
import { normalizeOptionsAsync } from '../Options';

jest.mock('resolve-from');
jest.mock('../ProjectWorkflow');

describe(getExpoConfigAsync, () => {
  it('should return null if the expo package is not found', async () => {
    const result = await getExpoConfigAsync('/app', await normalizeOptionsAsync('/app'));
    const mockedResolveFrom = resolveFrom.silent as jest.MockedFunction<typeof resolveFrom.silent>;
    mockedResolveFrom.mockImplementationOnce((fromDirectory: string, moduleId: string) => {
      const actualResolver = jest.requireActual('resolve-from').silent;
      // To fake the case as no expo installed, trying to resolve as **nonexist/expo/config** module
      return actualResolver(fromDirectory, 'nonexist/expo/config');
    });

    expect(result.config).toBeNull();
    expect(result.loadedModules).toBeNull();
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
