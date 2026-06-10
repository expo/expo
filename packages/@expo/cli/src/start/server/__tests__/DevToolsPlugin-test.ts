import { DevToolsPlugin } from '../DevToolsPlugin';

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
    expect(plugin.webpageBanner).toBe(false);
    expect(plugin.executor).toBeUndefined();
    expect(plugin.description).toBe('');
  });

  it('should create an instance from a plugin with webpageBanner enabled', () => {
    const pluginDescriptor = {
      packageName: 'example-plugin',
      packageRoot: '/path/to/example-plugin',
      webpageRoot: '/path/to/example-plugin/web',
      webpageBanner: true,
    };
    const projectRoot = '/path/to/project';
    const plugin = new DevToolsPlugin(pluginDescriptor, projectRoot);

    expect(plugin.webpageBanner).toBe(true);
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
