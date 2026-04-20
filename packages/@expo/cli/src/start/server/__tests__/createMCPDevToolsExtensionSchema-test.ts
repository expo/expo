import { DevToolsPlugin } from '../DevToolsPlugin';
import { DevToolsPluginInfo } from '../DevToolsPlugin.schema';
import { createMCPDevToolsExtensionSchema } from '../createMCPDevToolsExtensionSchema';

describe(createMCPDevToolsExtensionSchema, () => {
  const mockPlugin: DevToolsPluginInfo = {
    packageName: 'mock-plugin',
    packageRoot: '/path/to/mock-plugin',
    cliExtensions: {
      description: 'Expo: manage background tasks',
      commands: [
        { name: 'list', title: 'List registered background tasks', environments: ['cli', 'mcp'] },
        {
          name: 'task',
          title: 'Show information about a registered background task',
          environments: ['cli', 'mcp'],
          parameters: [{ name: 'name', type: 'text', required: true }],
        },
        {
          name: 'trigger-test',
          title: 'Trigger a test background task',
          environments: ['cli', 'mcp'],
        },
      ],
      entryPoint: 'cli/build/index.js',
    },
  } as DevToolsPluginInfo;

  it('generates correct schema for plugin with commands and parameters', () => {
    const schema = createMCPDevToolsExtensionSchema(new DevToolsPlugin(mockPlugin, ''));
    const parameters = {
      command: 'task',
      name: 'task 1',
    };
    expect(schema.parse(parameters)).toEqual({
      command: 'task',
      name: 'task 1',
    });
  });

  it('throws error if plugin has no commands', () => {
    const pluginWithoutCommands: DevToolsPlugin = {
      packageName: 'no-commands-plugin',
      packageRoot: '/path/to/no-commands-plugin',
      cliExtensions: {
        entryPoint: 'cli-extension.js',
        commands: [],
      },
    } as DevToolsPlugin;

    expect(() => {
      createMCPDevToolsExtensionSchema(pluginWithoutCommands);
    }).toThrow(
      'Plugin no-commands-plugin has no commands defined. Please define at least one command.'
    );
  });
});
