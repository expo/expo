import { Log } from '../../../log';
import DevToolsPluginManager from '../DevToolsPluginManager';

jest.mock('../../../log');

jest.mock('../../../events', () => ({
  events: jest.fn(() => jest.fn()),
}));

const { events } = require('../../../events') as { events: jest.Mock };
const mockEvent = events.mock.results[0].value as jest.Mock;

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
  plugins: {
    packageName: string;
    packageRoot: string;
    bannerTitle?: boolean | string;
    cliExtensions?: any;
    webpageRoot?: string;
    serverEntryPoint?: string;
  }[]
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
        webpageRoot: '/path/to/valid-plugin/web',
      },
    ]);

    const manager = new DevToolsPluginManager('/project');
    const plugins = await manager.queryPluginsAsync();

    expect(plugins.length).toBe(1);
    expect(plugins[0]!.packageName).toBe('valid-plugin');
  });

  it('should skip a plugin whose webpageRoot escapes the package directory', async () => {
    mockAutolinkingPlugins([
      {
        packageName: 'malicious-plugin',
        packageRoot: '/path/to/project/node_modules/malicious-plugin',
        // The autolinking-side check should reject this before we get here,
        // but this guard catches it if a bad descriptor is supplied directly.
        webpageRoot: '/path/to/project',
      },
    ]);

    const manager = new DevToolsPluginManager('/project');
    const plugins = await manager.queryPluginsAsync();

    expect(plugins.length).toBe(0);
    expect(Log.warn).toHaveBeenCalledWith(
      expect.stringContaining('Skipping plugin "malicious-plugin"')
    );
  });

  it('should skip a plugin with an invalid config without affecting other valid plugins', async () => {
    mockAutolinkingPlugins([
      {
        packageName: 'valid-plugin',
        packageRoot: '/path/to/valid-plugin',
        webpageRoot: '/path/to/valid-plugin/web',
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
    expect(plugins[0]!.packageName).toBe('valid-plugin');
    expect(plugins[1]!.packageName).toBe('another-valid-plugin');
    expect(Log.warn).toHaveBeenCalledWith(
      expect.stringContaining('Skipping plugin "invalid-plugin"')
    );
  });

  it('should log loaded plugins with their banner and webpage endpoint metadata', async () => {
    mockAutolinkingPlugins([
      {
        packageName: 'web-plugin',
        packageRoot: '/path/to/web-plugin',
        webpageRoot: '/path/to/web-plugin/web',
        bannerTitle: 'Web Plugin',
      },
      {
        packageName: 'server-plugin',
        packageRoot: '/path/to/server-plugin',
        serverEntryPoint: '/path/to/server-plugin/server.js',
        bannerTitle: true,
      },
      {
        packageName: 'untitled-web-plugin',
        packageRoot: '/path/to/untitled-web-plugin',
        webpageRoot: '/path/to/untitled-web-plugin/web',
      },
      {
        packageName: 'cli-only-plugin',
        packageRoot: '/path/to/cli-only-plugin',
        cliExtensions: {
          description: 'A CLI-only extension',
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
    await manager.queryPluginsAsync();

    expect(mockEvent).toHaveBeenCalledWith('dev-tools-plugin:load', {
      plugins: [
        {
          packageName: 'web-plugin',
          bannerTitle: 'Web Plugin',
          cliBanner: true,
          webpageEndpoint: '/_expo/plugins/web-plugin',
        },
        {
          packageName: 'server-plugin',
          bannerTitle: 'server-plugin',
          cliBanner: true,
          webpageEndpoint: '/_expo/plugins/server-plugin',
        },
        {
          packageName: 'untitled-web-plugin',
          bannerTitle: 'untitled-web-plugin',
          cliBanner: false,
          webpageEndpoint: '/_expo/plugins/untitled-web-plugin',
        },
        {
          packageName: 'cli-only-plugin',
          bannerTitle: 'cli-only-plugin',
          cliBanner: false,
          webpageEndpoint: undefined,
        },
      ],
    });
  });
});
