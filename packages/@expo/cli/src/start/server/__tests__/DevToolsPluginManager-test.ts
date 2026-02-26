import { Log } from '../../../log';
import DevToolsPluginManager from '../DevToolsPluginManager';

jest.mock('../../../log');

// Mock the autolinking module
jest.mock('expo/internal/unstable-autolinking-exports', () => ({
  makeCachedDependenciesLinker: jest.fn(),
  scanExpoModuleResolutionsForPlatform: jest.fn(),
  getLinkingImplementationForPlatform: jest.fn(),
}));

const autolinking = require('expo/internal/unstable-autolinking-exports') as jest.Mocked<
  typeof import('expo-modules-autolinking/exports')
>;

function mockAutolinkingPlugins(
  plugins: { packageName: string; packageRoot: string; cliExtensions?: any; webpageRoot?: string }[]
) {
  const revisions: Record<string, { name: string }> = {};
  const descriptors: Record<string, any> = {};

  for (const plugin of plugins) {
    revisions[plugin.packageName] = { name: plugin.packageName };
    descriptors[plugin.packageName] = plugin;
  }

  autolinking.makeCachedDependenciesLinker.mockReturnValue({} as any);
  autolinking.scanExpoModuleResolutionsForPlatform.mockResolvedValue(revisions as any);
  autolinking.getLinkingImplementationForPlatform.mockReturnValue({
    resolveModuleAsync: jest.fn(async (name: string) => descriptors[name] ?? null),
  } as any);
}

describe('DevToolsPluginManager', () => {
  it('should return valid plugins', async () => {
    mockAutolinkingPlugins([
      {
        packageName: 'valid-plugin',
        packageRoot: '/path/to/valid-plugin',
        webpageRoot: '/web',
      },
    ]);

    const manager = new DevToolsPluginManager('/project');
    const plugins = await manager.queryPluginsAsync();

    expect(plugins.length).toBe(1);
    expect(plugins[0].packageName).toBe('valid-plugin');
  });

  it('should skip a plugin with an invalid config without affecting other valid plugins', async () => {
    mockAutolinkingPlugins([
      {
        packageName: 'valid-plugin',
        packageRoot: '/path/to/valid-plugin',
        webpageRoot: '/web',
      },
      {
        packageName: 'invalid-plugin',
        packageRoot: '/path/to/invalid-plugin',
        cliExtensions: {
          // Missing required `commands` and `entryPoint` fields
          description: 'An invalid extension',
        },
      },
      {
        packageName: 'another-valid-plugin',
        packageRoot: '/path/to/another-valid-plugin',
        cliExtensions: {
          description: 'A valid CLI extension',
          entryPoint: 'index.js',
          commands: [
            {
              name: 'test-cmd',
              title: 'Test Command',
              environments: ['cli'],
            },
          ],
        },
      },
    ]);

    const manager = new DevToolsPluginManager('/project');
    const plugins = await manager.queryPluginsAsync();

    expect(plugins.length).toBe(2);
    expect(plugins[0].packageName).toBe('valid-plugin');
    expect(plugins[1].packageName).toBe('another-valid-plugin');
    expect(Log.warn).toHaveBeenCalledWith(
      expect.stringContaining('Skipping plugin "invalid-plugin"')
    );
  });
});
