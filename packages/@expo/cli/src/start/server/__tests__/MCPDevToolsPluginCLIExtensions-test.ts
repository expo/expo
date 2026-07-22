import { Log } from '../../../log';
import type { DevServerManager } from '../DevServerManager';
import { DevToolsPlugin } from '../DevToolsPlugin';
import type { DevToolsPluginCommand } from '../DevToolsPlugin.schema';
import { DevToolsPluginCliExtensionExecutor } from '../DevToolsPluginCliExtensionExecutor';
import type { McpServer } from '../MCP';
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
    // expo-cli-list-apps + 1 plugin tool
    expect(registerTool).toHaveBeenCalledTimes(2);

    // First call is expo-cli-list-apps, second is the plugin
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

    // First call is expo-cli-list-apps, second is the plugin
    const [, , handler] = registerTool.mock.calls[1];
    const result = await handler({
      parameters: {
        command: 'run-analysis',
        id: '1',
        path: '/tmp/data',
      },
    });

    expect(MockedExecutor).toHaveBeenCalledTimes(1);
    expect(MockedExecutor).toHaveBeenLastCalledWith(
      {
        packageName: plugin.packageName,
        packageRoot: plugin.packageRoot,
        cliExtensions: {
          description: plugin.cliExtensions!.description,
          entryPoint: plugin.cliExtensions!.entryPoint,
          commands: [command],
        },
      },
      PROJECT_ROOT,
      false // no color for MCP
    );
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

  it('lists connected apps through the expo-cli-list-apps tool', async () => {
    const command = createCommand({ name: 'run' });
    const plugin = createPlugin('test-plugin', 'Test Plugin', [command]);
    const { devServerManager } = createDevServerManager([plugin]);
    const registerTool = jest.fn();
    const mcpServer = { registerTool } as unknown as McpServer;

    mockedQueryAllInspectorAppsAsync.mockResolvedValue([MOCK_APP, MOCK_APP_2]);

    await addMcpCapabilities(mcpServer, devServerManager);

    const [toolName, , handler] = registerTool.mock.calls[0];
    expect(toolName).toBe('expo-cli-list-apps');

    const result = await handler({ parameters: {} });
    expect(result.content[0]).toEqual({
      type: 'text',
      text: JSON.stringify(MOCK_APP, null, 2),
    });
    expect(result.content[1]).toEqual({
      type: 'text',
      text: JSON.stringify(MOCK_APP_2, null, 2),
    });
    // Multi-app warning appended when more than one app is connected.
    expect(result.content[2].text).toMatch(/Multiple apps are connected/);
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
    // First call is expo-cli-list-apps, second is the plugin
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
    // Only expo-cli-list-apps is registered, no plugin tools
    expect(registerTool).toHaveBeenCalledTimes(1);
    expect(registerTool.mock.calls[0][0]).toBe('expo-cli-list-apps');
  });

  it('blocks CLI-only command invocation through the handler even if the schema is bypassed', async () => {
    // Restore the real executor for this test so we exercise the actual execute()/validate() path,
    // not the mocked one. A bypassed-schema scenario (future MCP client variant, internal misuse,
    // protocol-level smuggling) must still be rejected before any spawn occurs.
    const { DevToolsPluginCliExtensionExecutor: ActualExecutor } = jest.requireActual<
      typeof import('../DevToolsPluginCliExtensionExecutor')
    >('../DevToolsPluginCliExtensionExecutor');
    // Fake child that immediately fires `close(0)` so, if the executor IS reached without
    // throwing at validate, the handler resolves and assertions run deterministically
    // (instead of timing out the test).
    const spawnSpy = jest.fn(() => ({
      stdout: { on: jest.fn() },
      stderr: { on: jest.fn() },
      on: (event: string, cb: (code: number) => void) => {
        if (event === 'close') setImmediate(() => cb(0));
      },
      kill: jest.fn(),
    }));
    MockedExecutor.mockImplementationOnce(
      (plugin, projectRoot) =>
        new ActualExecutor(plugin, projectRoot, spawnSpy as any) as InstanceType<
          typeof DevToolsPluginCliExtensionExecutor
        >
    );

    const mcpCommand = createCommand({ name: 'safe-read' });
    const cliOnlyCommand: DevToolsPluginCommand = {
      name: 'cli-only-mutate',
      title: 'CLI-only mutate',
      environments: ['cli'],
      parameters: [{ name: 'target', type: 'text', description: 'Target' }],
    };
    const plugin = createPlugin('mixed-plugin', 'Mixed plugin', [mcpCommand, cliOnlyCommand]);

    const { devServerManager } = createDevServerManager([plugin]);
    const registerTool = jest.fn();
    const mcpServer = { registerTool } as unknown as McpServer;

    await addMcpCapabilities(mcpServer, devServerManager);
    // First call is expo-cli-list-apps, second is the plugin
    const [, , handler] = registerTool.mock.calls[1];

    // Smuggle a CLI-only command name past the schema by invoking the handler directly.
    const result = await handler({
      parameters: { command: 'cli-only-mutate', id: '1', target: 'value' },
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toMatch(
      /Command "cli-only-mutate" not found in plugin mixed-plugin/
    );
    // The real validate() must throw before the executor ever reaches spawnFunc.
    expect(spawnSpy).not.toHaveBeenCalled();
  });

  it('round-trips number and confirm parameters through schema and executor', async () => {
    const command = createCommand({
      name: 'configure',
      parameters: [
        { name: 'count', type: 'number', description: 'A count' },
        { name: 'force', type: 'confirm', description: 'Whether to force' },
      ],
    });
    const plugin = createPlugin('typed-plugin', 'Typed plugin', [command]);
    const { devServerManager } = createDevServerManager([plugin]);
    const registerTool = jest.fn();
    const mcpServer = { registerTool } as unknown as McpServer;
    executeMock.mockResolvedValue([]);

    await addMcpCapabilities(mcpServer, devServerManager);

    // First call is expo-cli-list-apps, second is the plugin
    const [, toolDefinition, handler] = registerTool.mock.calls[1];
    const schema = toolDefinition.inputSchema.parameters;

    expect(schema.safeParse({ command: 'configure', id: '1', count: 3, force: true }).success).toBe(
      true
    );
    expect(
      schema.safeParse({ command: 'configure', id: '1', count: '3', force: true }).success
    ).toBe(false);

    await handler({ parameters: { command: 'configure', id: '1', count: 3, force: true } });

    expect(executeMock).toHaveBeenCalledWith(
      expect.objectContaining({ command: 'configure', args: { count: 3, force: true } })
    );
  });

  it('omits CLI-only commands from the MCP schema and executor for mixed plugins', async () => {
    const mcpCommand = createCommand({
      name: 'safe-read',
      parameters: [{ name: 'id', type: 'text', description: 'Record id' }],
    });
    const cliOnlyCommand: DevToolsPluginCommand = {
      name: 'cli-only-mutate',
      title: 'CLI-only mutate',
      environments: ['cli'],
      parameters: [{ name: 'target', type: 'text', description: 'Target' }],
    };
    const plugin = createPlugin('mixed-plugin', 'Mixed plugin', [mcpCommand, cliOnlyCommand]);

    const { devServerManager } = createDevServerManager([plugin]);
    const registerTool = jest.fn();
    const mcpServer = { registerTool } as unknown as McpServer;

    await addMcpCapabilities(mcpServer, devServerManager);

    // expo-cli-list-apps + 1 plugin tool
    expect(registerTool).toHaveBeenCalledTimes(2);
    // First call is expo-cli-list-apps, second is the plugin
    const [, toolDefinition, handler] = registerTool.mock.calls[1];

    // The MCP schema enum must only accept MCP-enabled commands.
    const schema = toolDefinition.inputSchema.parameters;
    expect(schema.safeParse({ command: 'safe-read', id: 'abc' }).success).toBe(true);
    expect(schema.safeParse({ command: 'cli-only-mutate', target: 'abc' }).success).toBe(false);

    // The executor must also receive a descriptor that excludes CLI-only commands,
    // so a request that bypasses the schema (e.g., a future client variant) still fails
    // existence validation rather than running a CLI-only command.
    executeMock.mockResolvedValue([]);
    await handler({ parameters: { command: 'safe-read', id: '1' } });

    expect(MockedExecutor).toHaveBeenCalledTimes(1);
    const [executorPluginArg] = MockedExecutor.mock.calls[0]!;
    expect(
      executorPluginArg.cliExtensions?.commands.map((c: DevToolsPluginCommand) => c.name)
    ).toEqual(['safe-read']);
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
