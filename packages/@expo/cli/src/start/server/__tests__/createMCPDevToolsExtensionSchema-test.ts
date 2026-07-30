import { DevToolsPlugin } from '../DevToolsPlugin';
import type { DevToolsPluginInfo } from '../DevToolsPlugin.schema';
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
    // Intentionally invalid (no commands) to exercise the validation path in
    // `createMCPDevToolsExtensionSchema`. The `DevToolsPlugin` constructor would reject this
    // configuration earlier via its schema, so we pass the raw plugin info instead.
    const pluginWithoutCommands = {
      packageName: 'no-commands-plugin',
      packageRoot: '/path/to/no-commands-plugin',
      cliExtensions: {
        entryPoint: 'cli-extension.js',
        commands: [],
      },
    } as unknown as DevToolsPluginInfo;

    expect(() => {
      createMCPDevToolsExtensionSchema(pluginWithoutCommands);
    }).toThrow(
      'Plugin no-commands-plugin has no commands defined. Please define at least one command.'
    );
  });
});
