import { DevToolsPlugin } from '../DevToolsPlugin';

describe('DevToolsPlugin', () => {
  it('should create an instance from a plugin with only the webpageRoot configuration set', () => {
    const pluginDescriptor = {
      packageName: 'example-plugin',
      packageRoot: '/path/to/example-plugin',
      webpageRoot: 'https://example.com/plugin',
    };
    const projectRoot = '/path/to/project';
    const plugin = new DevToolsPlugin(pluginDescriptor, projectRoot);

    expect(plugin.packageName).toBe('example-plugin');
    expect(plugin.webpageRoot).toBe('https://example.com/plugin');
    expect(plugin.executor).toBeUndefined();
    expect(plugin.description).toBe('');
  });

  it('should create an instance from a plugin with only the cli extension set', () => {
    const commands = [
      {
        name: 'example-command',
        title: 'Perform example command',
        environment: ['cli'] as const,
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

  it('should spawn a process when executing a command and wait for it to finish', async () => {
    const commands = [
      {
        name: 'test-command',
        title: 'Test Command',
        environment: ['cli'] as const,
        parameters: [],
      },
    ];
    const pluginDescriptor = {
      packageName: 'test-plugin',
      packageRoot: '/path/to/test-plugin',
      cliExtensions: {
        commands,
        description: 'Test Plugin',
        entryPoint: 'index.js',
      },
    };
    const projectRoot = '/path/to/project';
    const closeListeneres: (() => void)[] = [];
    let resolver: (() => void) | null = null;
    const closePromise = new Promise<void>((resolve) => (resolver = resolve));
    const mock = {
      spawn: jest.fn().mockReturnValue({
        on: (_evt, listener) => {
          closeListeneres.push(() => {
            listener(0);
            resolver();
          });
        },
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn() },
      }),
    };
    jest.mock('child_process', () => mock);

    const plugin = new DevToolsPlugin(pluginDescriptor, projectRoot, mock.spawn);

    const resultPromise = plugin.executor!({ command: 'test-command', args: {}, apps: [] });
    closeListeneres.forEach((listener) => listener());
    await closePromise;
    const result = await resultPromise;

    expect(mock.spawn).toHaveBeenCalled();
    expect(result).toBe('');
  });
});
