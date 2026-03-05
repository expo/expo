import { Log } from '../../../log';
import { DevServerManager } from '../DevServerManager';
import { DevToolsPlugin } from '../DevToolsPlugin';
import { DevToolsPluginCommand } from '../DevToolsPlugin.schema';
import { DevToolsPluginCliExtensionExecutor } from '../DevToolsPluginCliExtensionExecutor';
import { McpServer } from '../MCP';
import { addMcpCapabilities } from '../MCPDevToolsPluginCLIExtensions';
import { queryAllInspectorAppsAsync } from '../middleware/inspector/JsInspector';

jest.mock('../DevToolsPluginCliExtensionExecutor');
jest.mock('../middleware/inspector/JsInspector');
jest.mock('../../../log', () => ({
  Log: {
    error: jest.fn(),
    log: jest.fn(),
  },
}));

const mockedQueryAllInspectorAppsAsync = queryAllInspectorAppsAsync as jest.MockedFunction<
  typeof queryAllInspectorAppsAsync
>;

const MockedExecutor = DevToolsPluginCliExtensionExecutor as jest.MockedClass<
  typeof DevToolsPluginCliExtensionExecutor
>;

const PROJECT_ROOT = '/tmp/project';

let executeMock: jest.Mock;

const MOCK_APP = {
  id: '1',
  title: 'Test App',
  appId: 'com.test.app',
  description: 'Test',
  type: 'node' as const,
  devtoolsFrontendUrl: '',
  webSocketDebuggerUrl: '',
  deviceName: 'iPhone 15',
};

const MOCK_APP_2 = {
  id: '2',
  title: 'Test App 2',
  appId: 'com.test.app2',
  description: 'Test 2',
  type: 'node' as const,
  devtoolsFrontendUrl: '',
  webSocketDebuggerUrl: '',
  deviceName: 'Pixel 8',
};

beforeEach(() => {
  jest.clearAllMocks();
  executeMock = jest.fn();
  MockedExecutor.mockImplementation(
    () =>
      ({
        execute: executeMock,
      }) as unknown as InstanceType<typeof DevToolsPluginCliExtensionExecutor>
  );
  mockedQueryAllInspectorAppsAsync.mockResolvedValue([MOCK_APP]);
});

describe(addMcpCapabilities, () => {
  it('registers MCP CLI commands as tools on the MCP server', async () => {
    const mcpCommands: DevToolsPluginCommand[] = [
      createCommand({
        name: 'first-command',
        parameters: [{ name: 'foo', type: 'text', description: 'Foo parameter' }],
      }),
      createCommand({ name: 'second-command' }),
    ];
    const plugin = createPlugin('test-plugin', 'Test MCP plugin', mcpCommands);

    const { devServerManager, queryPluginsAsync } = createDevServerManager([plugin]);
    const registerTool = jest.fn();
    const mcpServer = { registerTool } as unknown as McpServer;

    await addMcpCapabilities(mcpServer, devServerManager);

    expect(queryPluginsAsync).toHaveBeenCalledTimes(1);
    // expo-inspector + 1 plugin tool
    expect(registerTool).toHaveBeenCalledTimes(2);

    // First call is expo-inspector, second is the plugin
    const [toolName, toolDefinition, toolHandler] = registerTool.mock.calls[1];
    expect(toolName).toBe('test-plugin');
    expect(toolDefinition.title).toBe('test-plugin');
    expect(toolDefinition.description).toBe('Test MCP plugin');
    expect(typeof toolHandler).toBe('function');

    const schema = toolDefinition.inputSchema.parameters;
    expect(schema.safeParse({ command: 'first-command', id: '1', foo: 'bar' }).success).toBe(true);
    expect(schema.safeParse({ command: 'second-command', id: '1' }).success).toBe(true);
    expect(MockedExecutor).not.toHaveBeenCalled();
  });

  it('executes registered command and formats output lines', async () => {
    const command = createCommand({
      name: 'run-analysis',
      parameters: [{ name: 'path', type: 'text', description: 'Target path' }],
    });
    const plugin = createPlugin('analysis-plugin', 'Analysis Plugin', [command]);
    const { devServerManager, getJsInspectorBaseUrl } = createDevServerManager(
      [plugin],
      'http://localhost:19000'
    );
    const registerTool = jest.fn();
    const mcpServer = { registerTool } as unknown as McpServer;

    const pluginOutput = [
      { type: 'text', text: 'Run complete', level: 'info', uri: 'https://example.com' },
      { type: 'uri', uri: 'https://example.com/image.png', text: 'Screenshot' },
      { type: 'uri', uri: 'https://example.com/sound.mp3' },
    ] as const;

    executeMock.mockResolvedValue(pluginOutput);

    await addMcpCapabilities(mcpServer, devServerManager);

    // First call is expo-inspector, second is the plugin
    const [, , handler] = registerTool.mock.calls[1];
    const result = await handler({
      parameters: {
        command: 'run-analysis',
        id: '1',
        path: '/tmp/data',
      },
    });

    expect(MockedExecutor).toHaveBeenCalledTimes(1);
    expect(MockedExecutor).toHaveBeenLastCalledWith(plugin, PROJECT_ROOT, false); // no color for MCP
    expect(executeMock).toHaveBeenCalledWith({
      command: 'run-analysis',
      args: { path: '/tmp/data' },
      metroServerOrigin: 'http://localhost:19000',
      app: MOCK_APP,
    });
    expect(getJsInspectorBaseUrl).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: 'Run complete',
          level: 'info',
          uri: 'https://example.com',
        },
        {
          type: 'text',
          text: 'Resource: https://example.com/image.png (Screenshot)',
        },
        {
          type: 'text',
          text: 'Resource: https://example.com/sound.mp3',
        },
      ],
    });
  });

  it('resolves the correct app when id is provided', async () => {
    const command = createCommand({ name: 'run' });
    const plugin = createPlugin('test-plugin', 'Test Plugin', [command]);
    const { devServerManager } = createDevServerManager([plugin]);
    const registerTool = jest.fn();
    const mcpServer = { registerTool } as unknown as McpServer;

    mockedQueryAllInspectorAppsAsync.mockResolvedValue([MOCK_APP, MOCK_APP_2]);
    executeMock.mockResolvedValue([]);

    await addMcpCapabilities(mcpServer, devServerManager);
    const [, , handler] = registerTool.mock.calls[1];
    await handler({
      parameters: { command: 'run', id: '2' },
    });

    expect(executeMock).toHaveBeenCalledWith(expect.objectContaining({ app: MOCK_APP_2 }));
  });

  it('returns error when id does not match any connected app', async () => {
    const command = createCommand({ name: 'run' });
    const plugin = createPlugin('test-plugin', 'Test Plugin', [command]);
    const { devServerManager } = createDevServerManager([plugin]);
    const registerTool = jest.fn();
    const mcpServer = { registerTool } as unknown as McpServer;

    executeMock.mockResolvedValue([]);

    await addMcpCapabilities(mcpServer, devServerManager);
    const [, , handler] = registerTool.mock.calls[1];
    const result = await handler({
      parameters: { command: 'run', id: 'nonexistent-id' },
    });

    expect(result).toEqual({
      content: [{ type: 'text', text: 'No connected app found with ID: nonexistent-id' }],
      isError: true,
    });
    expect(executeMock).not.toHaveBeenCalled();
  });

  it('returns error output when command execution fails', async () => {
    const command = createCommand({ name: 'failing-command' });
    const plugin = createPlugin('broken-plugin', 'Broken Plugin', [command]);
    const { devServerManager } = createDevServerManager([plugin]);
    const registerTool = jest.fn();
    const mcpServer = { registerTool } as unknown as McpServer;
    const error = new Error('Execution exploded');
    executeMock.mockRejectedValue(error);

    await addMcpCapabilities(mcpServer, devServerManager);
    // First call is expo-inspector, second is the plugin
    const [, , handler] = registerTool.mock.calls[1];
    const response = await handler({
      parameters: { command: 'failing-command', id: '1' },
    });

    const logError = Log.error as jest.Mock;
    expect(logError).toHaveBeenCalledWith('Error executing MCP CLI command:', error);
    expect(response).toEqual({
      content: [
        {
          type: 'text',
          text: 'Error executing command: Error: Execution exploded',
        },
      ],
      isError: true,
    });
  });

  it('skips plugins without MCP-compatible commands', async () => {
    const cliOnlyCommand: DevToolsPluginCommand = {
      name: 'local-only',
      title: 'Local only',
      environments: ['cli'],
      parameters: [],
    };
    const plugin = createPlugin('cli-plugin', 'CLI Plugin', [cliOnlyCommand]);
    const pluginWithoutCliExtensions = new DevToolsPlugin(
      {
        packageName: 'ui-plugin',
        packageRoot: '/packages/ui-plugin',
      },
      PROJECT_ROOT
    );

    const { devServerManager, queryPluginsAsync } = createDevServerManager([
      plugin,
      pluginWithoutCliExtensions,
    ]);
    const registerTool = jest.fn();
    const mcpServer = { registerTool } as unknown as McpServer;

    await addMcpCapabilities(mcpServer, devServerManager);

    expect(queryPluginsAsync).toHaveBeenCalledTimes(1);
    // Only expo-inspector is registered, no plugin tools
    expect(registerTool).toHaveBeenCalledTimes(1);
    expect(registerTool.mock.calls[0][0]).toBe('expo-cli-list-apps');
  });
});

function createPlugin(
  packageName: string,
  description: string,
  commands: DevToolsPluginCommand[]
): DevToolsPlugin {
  return new DevToolsPlugin(
    {
      packageName,
      packageRoot: `/packages/${packageName}`,
      cliExtensions: {
        description,
        entryPoint: 'dist/cli.js',
        commands,
      },
    },
    PROJECT_ROOT
  );
}

function createCommand({
  name,
  title = name,
  parameters = [],
}: {
  name: string;
  title?: string;
  parameters?: DevToolsPluginCommand['parameters'];
}): DevToolsPluginCommand {
  return {
    name,
    title,
    environments: ['mcp'],
    parameters,
  };
}

function createDevServerManager(
  plugins: DevToolsPlugin[],
  metroServerOrigin: string = 'http://localhost:8081'
): {
  devServerManager: DevServerManager;
  queryPluginsAsync: jest.Mock<Promise<DevToolsPlugin[]>>;
  getJsInspectorBaseUrl: jest.Mock<string, []>;
} {
  const queryPluginsAsync = jest.fn().mockResolvedValue(plugins);
  const getJsInspectorBaseUrl = jest.fn().mockReturnValue(metroServerOrigin);
  const defaultDevServer = { getJsInspectorBaseUrl };
  const devServerManager = {
    projectRoot: PROJECT_ROOT,
    devtoolsPluginManager: { queryPluginsAsync },
    getDefaultDevServer: jest.fn(() => defaultDevServer),
  } as unknown as DevServerManager;

  return { devServerManager, queryPluginsAsync, getJsInspectorBaseUrl };
}
