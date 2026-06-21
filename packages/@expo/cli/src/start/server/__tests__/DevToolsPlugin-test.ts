import { vol } from 'memfs';
import path from 'path';

import { DevToolsPlugin } from '../DevToolsPlugin';
import { isEsmEntryPoint } from '../DevToolsPluginServerHelpers';

describe('DevToolsPlugin', () => {
  it('should create an instance from a plugin with only the webpageRoot configuration set', () => {
    const pluginDescriptor = {
      packageName: 'example-plugin',
      packageRoot: '/path/to/example-plugin',
      webpageRoot: '/path/to/example-plugin/web',
    };
    const projectRoot = '/path/to/project';
    const plugin = new DevToolsPlugin(pluginDescriptor, projectRoot);

    expect(plugin.packageName).toBe('example-plugin');
    expect(plugin.webpageRoot).toBe('/path/to/example-plugin/web');
    expect(plugin.cliBanner).toBe(false);
    expect(plugin.bannerTitle).toBe('example-plugin');
    expect(plugin.executor).toBeUndefined();
    expect(plugin.description).toBe('');
  });

  it('should create an instance from a plugin with a custom bannerTitle', () => {
    const pluginDescriptor = {
      packageName: 'example-plugin',
      packageRoot: '/path/to/example-plugin',
      webpageRoot: '/path/to/example-plugin/web',
      bannerTitle: 'Example Plugin',
    };
    const projectRoot = '/path/to/project';
    const plugin = new DevToolsPlugin(pluginDescriptor, projectRoot);

    expect(plugin.cliBanner).toBe(true);
    expect(plugin.bannerTitle).toBe('Example Plugin');
  });

  it('should use the package name when bannerTitle is true', () => {
    const pluginDescriptor = {
      packageName: 'example-plugin',
      packageRoot: '/path/to/example-plugin',
      webpageRoot: '/path/to/example-plugin/web',
      bannerTitle: true,
    };
    const projectRoot = '/path/to/project';
    const plugin = new DevToolsPlugin(pluginDescriptor, projectRoot);

    expect(plugin.cliBanner).toBe(true);
    expect(plugin.bannerTitle).toBe('example-plugin');
  });

  it('should reject an empty bannerTitle', () => {
    const pluginDescriptor = {
      packageName: 'example-plugin',
      packageRoot: '/path/to/example-plugin',
      webpageRoot: '/path/to/example-plugin/web',
      bannerTitle: '',
    };
    const projectRoot = '/path/to/project';

    expect(() => new DevToolsPlugin(pluginDescriptor, projectRoot)).toThrow(
      'Invalid plugin configuration:'
    );
  });

  it('should use the package name when a resolved bannerTitle is an empty string', () => {
    const plugin = new DevToolsPlugin(
      {
        packageName: 'example-plugin',
        packageRoot: '/path/to/example-plugin',
        webpageRoot: '/path/to/example-plugin/web',
        bannerTitle: true,
      },
      '/path/to/project'
    );
    (plugin as unknown as { plugin: { bannerTitle: string } }).plugin.bannerTitle = '';

    expect(plugin.cliBanner).toBe(true);
    expect(plugin.bannerTitle).toBe('example-plugin');
  });

  it('should not set a banner title when bannerTitle is false', () => {
    const pluginDescriptor = {
      packageName: 'example-plugin',
      packageRoot: '/path/to/example-plugin',
      webpageRoot: '/path/to/example-plugin/web',
      bannerTitle: false,
    };
    const projectRoot = '/path/to/project';
    const plugin = new DevToolsPlugin(pluginDescriptor, projectRoot);

    expect(plugin.cliBanner).toBe(false);
    expect(plugin.bannerTitle).toBe('example-plugin');
  });

  it('should reject a webpageRoot that escapes the package directory', () => {
    expect(
      () =>
        new DevToolsPlugin(
          {
            packageName: 'malicious-plugin',
            packageRoot: '/path/to/project/node_modules/malicious-plugin',
            webpageRoot: '/path/to/project',
          },
          '/path/to/project'
        )
    ).toThrow(/is not inside packageRoot/);
  });

  it('should create an instance from a plugin with only the cli extension set', () => {
    const commands = [
      {
        name: 'example-command',
        title: 'Perform example command',
        environments: ['cli'] as const,
        parameters: [
          {
            name: 'param1',
            type: 'text' as const,
            description: 'An example parameter',
          },
        ],
      },
    ];
    const pluginDescriptor = {
      packageName: 'example-plugin',
      packageRoot: '/path/to/example-plugin',
      cliExtensions: {
        commands,
        description: 'An example extension',
        entryPoint: 'index.js',
      },
    };
    const projectRoot = '/path/to/project';
    const plugin = new DevToolsPlugin(pluginDescriptor, projectRoot);

    expect(plugin.packageName).toBe('example-plugin');
    expect(plugin.webpageRoot).toBeUndefined();
    expect(plugin.executor).toBeDefined();
    expect(plugin.description).toBe('An example extension');
    expect(plugin.cliExtensions?.commands).toEqual(commands);
    expect(plugin.cliExtensions?.entryPoint).toBe('index.js');
  });

  it('should create an instance from a plugin with only the serverEntryPoint configuration set', () => {
    const pluginDescriptor = {
      packageName: 'example-plugin',
      packageRoot: '/path/to/example-plugin',
      serverEntryPoint: '/path/to/example-plugin/dist/server.js',
    };
    const plugin = new DevToolsPlugin(pluginDescriptor, '/path/to/project');

    expect(plugin.serverEntryPoint).toBe('/path/to/example-plugin/dist/server.js');
    expect(plugin.webpageRoot).toBeUndefined();
    // Plugins serving their page dynamically should still get an endpoint URL.
    expect(plugin.webpageEndpoint).toBe('/_expo/plugins/example-plugin');
  });

  it('should reject a serverEntryPoint that escapes the package directory', () => {
    expect(
      () =>
        new DevToolsPlugin(
          {
            packageName: 'malicious-plugin',
            packageRoot: '/path/to/project/node_modules/malicious-plugin',
            serverEntryPoint: '/path/to/project/evil.js',
          },
          '/path/to/project'
        )
    ).toThrow(/is not inside packageRoot/);
  });

  describe('requestHandler', () => {
    const fixturesRoot = path.join(__dirname, 'fixtures');

    beforeEach(() => {
      vol.fromJSON({
        [path.join(fixturesRoot, 'package.json')]: JSON.stringify({}),
      });
    });

    it('should be undefined when no serverEntryPoint is set', async () => {
      const plugin = new DevToolsPlugin(
        { packageName: 'example-plugin', packageRoot: '/path/to/example-plugin' },
        '/path/to/project'
      );
      await expect(plugin.getRequestHandlerAsync()).resolves.toBeUndefined();
    });

    it('should load the handler default-exported by a CommonJS server entry point', async () => {
      const plugin = new DevToolsPlugin(
        {
          packageName: 'example-plugin',
          packageRoot: fixturesRoot,
          serverEntryPoint: path.join(fixturesRoot, 'devtools-plugin-server.js'),
        },
        '/path/to/project'
      );
      const handler = await plugin.getRequestHandlerAsync();
      expect(typeof handler).toBe('function');

      const response = await handler!(new Request('http://localhost:8081/api/hello'));
      expect(response).not.toBeNull();
      expect(response!.status).toBe(200);
      expect(await response!.json()).toEqual({ message: 'hello' });

      const passthrough = await handler!(new Request('http://localhost:8081/unknown'));
      expect(passthrough).toBeNull();
    });

    it('should throw when the server entry point does not default-export a function', async () => {
      const plugin = new DevToolsPlugin(
        {
          packageName: 'example-plugin',
          packageRoot: fixturesRoot,
          serverEntryPoint: path.join(fixturesRoot, 'devtools-plugin-server-invalid.js'),
        },
        '/path/to/project'
      );
      await expect(plugin.getRequestHandlerAsync()).rejects.toThrow(
        /must default-export a handler function/
      );
    });
  });

  describe('isEsmEntryPoint', () => {
    beforeEach(() => {
      vol.reset();
    });

    it('treats .mjs as ESM and .cjs as CommonJS regardless of any package.json', () => {
      vol.fromJSON({
        '/pkg/package.json': JSON.stringify({ type: 'commonjs' }),
      });

      expect(isEsmEntryPoint('/pkg/server.mjs', '/pkg')).toBe(true);
      expect(isEsmEntryPoint('/pkg/server.cjs', '/pkg')).toBe(false);
    });

    describe('resolving a .js entry point from package.json files up to packageRoot', () => {
      it('resolves to ESM via the package root "type": "module"', () => {
        vol.fromJSON({
          '/pkg/package.json': JSON.stringify({ type: 'module' }),
        });

        expect(isEsmEntryPoint('/pkg/dist/server.js', '/pkg')).toBe(true);
      });

      it('resolves from a nested package.json inside packageRoot', () => {
        vol.fromJSON({
          '/pkg/package.json': JSON.stringify({ type: 'commonjs' }),
          '/pkg/dist/package.json': JSON.stringify({ type: 'module' }),
        });

        expect(isEsmEntryPoint('/pkg/dist/server.js', '/pkg')).toBe(true);
      });

      it('does not traverse above packageRoot', () => {
        vol.fromJSON({
          '/package.json': JSON.stringify({ type: 'module' }),
          '/pkg/dist/package.json': JSON.stringify({ type: 'commonjs' }),
        });

        expect(isEsmEntryPoint('/pkg/dist/server.js', '/pkg')).toBe(false);
      });

      it('resolves to CommonJS when the package root package.json omits "type"', () => {
        vol.fromJSON({
          '/pkg/package.json': JSON.stringify({}),
        });

        expect(isEsmEntryPoint('/pkg/server.js', '/pkg')).toBe(false);
      });
    });

    it('defaults a .js entry point to CommonJS when the package root package.json cannot be read', () => {
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

      expect(isEsmEntryPoint('/pkg/dist/server.js', '/pkg')).toBe(false);
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining(
          'Unable to load package.json for DevTools plugin server entry point /pkg/dist/server.js, loading as CommonJS.'
        )
      );
      warn.mockRestore();
    });
  });

  it("should validate the schema using and throw if the schema doesn't match", () => {
    const invalidPluginDescriptor = {
      packageName: 'invalid-plugin',
      packageRoot: '/path/to/invalid-plugin',
      cliExtensions: {
        // Missing `commands` and `entryPoint`
        description: 'An invalid extension',
      } as any,
    };
    const projectRoot = '/path/to/project';

    expect(() => new DevToolsPlugin(invalidPluginDescriptor, projectRoot)).toThrow(
      'Invalid plugin configuration:'
    );
  });
});
