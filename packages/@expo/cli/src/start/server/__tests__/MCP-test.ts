import { loadModule } from '@expo/require-utils';
import resolveFrom from 'resolve-from';

import { Log } from '../../../log';
import * as ExitHooks from '../../../utils/exit';
import { maybeCreateMCPServerAsync } from '../MCP';

const mockAddMcpCapabilities = jest.fn();
const mockTunnelMcpServerProxy = jest.fn().mockImplementation((mcpServerUrl: string) => ({
  // Adding a mock property that allows checking the server URL
  mockServerUrl: mcpServerUrl,
  start: jest.fn(),
  close: jest.fn(),
}));

jest.mock('@expo/require-utils', () => ({
  ...jest.requireActual('@expo/require-utils'),
  loadModule: jest.fn(),
}));
jest.mock('resolve-from');
jest.mock('../../../log');
jest.mock('../../../utils/exit');

describe(maybeCreateMCPServerAsync, () => {
  const mockLoadModule = loadModule as jest.MockedFunction<typeof loadModule>;
  const mockResolveFromSilent = resolveFrom.silent as jest.MockedFunction<
    typeof resolveFrom.silent
  >;

  const mcpPackagePath = '/app/node_modules/expo-mcp/dist/index.js';
  const mcpTunnelPackagePath =
    '/app/node_modules/expo-mcp/node_modules/@expo/mcp-tunnel/dist/index.js';

  const originalEnv = process.env;
  beforeEach(() => {
    delete process.env.EXPO_STAGING;
    delete process.env.EXPO_UNSTABLE_MCP_SERVER;
    mockResolveFromSilent.mockImplementation((fromDir, moduleName) => {
      if (moduleName === 'expo-mcp') {
        return mcpPackagePath;
      }
      if (moduleName === '@expo/mcp-tunnel') {
        return mcpTunnelPackagePath;
      }
      return undefined;
    });
    mockLoadModule.mockImplementation(async (modulePath) => {
      if (modulePath === mcpPackagePath) {
        return { addMcpCapabilities: mockAddMcpCapabilities };
      }
      if (modulePath === mcpTunnelPackagePath) {
        return { TunnelMcpServerProxy: mockTunnelMcpServerProxy };
      }
      throw new Error(`Unexpected module path: ${modulePath}`);
    });
  });

  afterEach(() => {
    mockResolveFromSilent.mockReset();
    mockLoadModule.mockReset();
    mockAddMcpCapabilities.mockReset();
    mockTunnelMcpServerProxy.mockClear();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should return null if the MCP server is not enabled', async () => {
    const server = await maybeCreateMCPServerAsync({
      projectRoot: '/app',
      devServerUrl: 'http://localhost:8081',
    });
    expect(server).toBeNull();
  });

  it('should return non-null value if the MCP server is enabled', async () => {
    process.env.EXPO_UNSTABLE_MCP_SERVER = '1';
    const server = await maybeCreateMCPServerAsync({
      projectRoot: '/app',
      devServerUrl: 'http://localhost:8081',
    });
    expect(server).not.toBeNull();
    expect(mockLoadModule).toHaveBeenCalledWith(mcpPackagePath);
    expect(mockLoadModule).toHaveBeenCalledWith(mcpTunnelPackagePath);
  });

  it('should return null and log an error if the MCP server is enabled but the expo-mcp package is not installed', async () => {
    process.env.EXPO_UNSTABLE_MCP_SERVER = '1';
    const spyLogError = jest.spyOn(Log, 'error');
    mockResolveFromSilent.mockReturnValue(undefined);
    const server = await maybeCreateMCPServerAsync({
      projectRoot: '/app',
      devServerUrl: 'http://localhost:8081',
    });
    expect(spyLogError).toHaveBeenCalledWith(
      'Missing the `expo-mcp` package in the project. To enable the MCP integration, add the `expo-mcp` package to your project.'
    );
    expect(server).toBeNull();
  });

  it('should use production MCP server by default', async () => {
    process.env.EXPO_UNSTABLE_MCP_SERVER = '1';
    const server = await maybeCreateMCPServerAsync({
      projectRoot: '/app',
      devServerUrl: 'http://localhost:8081',
    });
    // @ts-expect-error
    expect(server?.mockServerUrl).toBe('wss://mcp.expo.dev');
  });

  it('should use staging MCP server if the EXPO_STAGING environment variable is set', async () => {
    process.env.EXPO_UNSTABLE_MCP_SERVER = '1';
    process.env.EXPO_STAGING = '1';
    const server = await maybeCreateMCPServerAsync({
      projectRoot: '/app',
      devServerUrl: 'http://localhost:8081',
    });
    // @ts-expect-error
    expect(server?.mockServerUrl).toBe('wss://staging-mcp.expo.dev');
  });

  it('should allow specifying custom MCP server URL', async () => {
    process.env.EXPO_UNSTABLE_MCP_SERVER = 'ws://localhost:8787';
    const server = await maybeCreateMCPServerAsync({
      projectRoot: '/app',
      devServerUrl: 'http://localhost:8081',
    });
    // @ts-expect-error
    expect(server?.mockServerUrl).toBe('ws://localhost:8787');
  });

  it('should install the exit hook', async () => {
    process.env.EXPO_UNSTABLE_MCP_SERVER = '1';
    const spyInstallExitHooks = jest.spyOn(ExitHooks, 'installExitHooks');
    await maybeCreateMCPServerAsync({
      projectRoot: '/app',
      devServerUrl: 'http://localhost:8081',
    });
    expect(spyInstallExitHooks).toHaveBeenCalledTimes(1);
  });

  it('should cleanup the registered exit hook when explicitly closing the server', async () => {
    process.env.EXPO_UNSTABLE_MCP_SERVER = '1';
    const spyInstallExitHooks = jest.spyOn(ExitHooks, 'installExitHooks');
    const mockRemoveExitHook = jest.fn();
    spyInstallExitHooks.mockReturnValue(mockRemoveExitHook);
    const server = await maybeCreateMCPServerAsync({
      projectRoot: '/app',
      devServerUrl: 'http://localhost:8081',
    });
    await server!.closeAsync();
    expect(mockRemoveExitHook).toHaveBeenCalledTimes(1);
  });
});
