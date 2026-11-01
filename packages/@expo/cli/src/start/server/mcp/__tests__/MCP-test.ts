import { resolveFrom } from '@expo/require-utils';

import { Log } from '../../../../log';
import * as ExitHooks from '../../../../utils/exit';
import type { DevServerManager } from '../../DevServerManager';
import { maybeCreateMCPServerAsync } from '../MCP';

const mockResolve = jest.spyOn(
  require.cache[require.resolve('../MCP')]!.require as NodeRequire,
  'resolve'
);
const mockQueryPluginsAsync = jest.fn(async () => []);
const devServerManager = {
  projectRoot: '/app',
  devtoolsPluginManager: { queryPluginsAsync: mockQueryPluginsAsync },
} as unknown as DevServerManager;
const mockAddMcpCapabilities = jest.fn();
const mockTunnelMcpServerProxy = jest.fn().mockImplementation((mcpServerUrl: string) => ({
  // Adding a mock property that allows checking the server URL
  mockServerUrl: mcpServerUrl,
  start: jest.fn(),
  close: jest.fn(),
}));

jest.mock('@expo/require-utils', () => ({
  ...jest.requireActual('@expo/require-utils'),
  resolveFrom: jest.fn(),
}));
jest.mock('@expo/cli/add-module', () => jest.fn());
jest.mock('../../../../log');
jest.mock('../../../../utils/exit');

describe(maybeCreateMCPServerAsync, () => {
  const mockLoadModule = require('@expo/cli/add-module') as jest.Mock;
  const mockResolveFrom = jest.mocked(resolveFrom);

  const mcpPackagePath = '/app/node_modules/expo-mcp/dist/index.js';
  const mcpTunnelPackagePath =
    '/app/node_modules/expo-mcp/node_modules/@expo/mcp-tunnel/dist/index.js';
  const zodPackagePath = '/app/node_modules/expo-mcp/node_modules/zod/index.js';

  const originalEnv = process.env;
  beforeEach(() => {
    mockResolve.mockReturnValue(mcpPackagePath);
    delete process.env.EXPO_STAGING;
    delete process.env.EXPO_UNSTABLE_MCP_SERVER;
    mockResolveFrom.mockImplementation((fromDir, moduleName) => {
      if (moduleName === 'zod') return zodPackagePath;
      if (moduleName === '@expo/mcp-tunnel') {
        return mcpTunnelPackagePath;
      }
      return null;
    });
    mockLoadModule.mockImplementation(async (modulePath) => {
      if (modulePath === zodPackagePath) return jest.requireActual('zod');
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
    mockResolve.mockReset();
    mockResolveFrom.mockReset();
    mockLoadModule.mockReset();
    mockAddMcpCapabilities.mockReset();
    mockTunnelMcpServerProxy.mockClear();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should return null if the MCP server is not enabled', async () => {
    const server = await maybeCreateMCPServerAsync({
      devServerManager,
      devServerUrl: 'http://localhost:8081',
    });
    expect(server).toBeNull();
  });

  it('should return non-null value if the MCP server is enabled', async () => {
    process.env.EXPO_UNSTABLE_MCP_SERVER = '1';
    const server = await maybeCreateMCPServerAsync({
      devServerManager,
      devServerUrl: 'http://localhost:8081',
    });
    expect(server).not.toBeNull();
    expect(mockResolve).toHaveBeenCalledWith('expo-mcp', {
      paths: [expect.any(String), '/app'],
    });
    expect(mockLoadModule).toHaveBeenCalledWith(mcpPackagePath);
    expect(mockLoadModule).toHaveBeenCalledWith(mcpTunnelPackagePath);
    expect(mockLoadModule).toHaveBeenCalledWith(zodPackagePath);
    expect(mockQueryPluginsAsync).toHaveBeenCalledTimes(1);
  });

  it('should return null and log an error if the MCP server is enabled but the expo-mcp package is not installed', async () => {
    process.env.EXPO_UNSTABLE_MCP_SERVER = '1';
    const spyLogError = jest.spyOn(Log, 'error');
    mockResolve.mockImplementationOnce(() => {
      throw new Error('Cannot find expo-mcp');
    });
    const server = await maybeCreateMCPServerAsync({
      devServerManager,
      devServerUrl: 'http://localhost:8081',
    });
    expect(spyLogError).toHaveBeenCalledWith(
      'Missing the `expo-mcp` package in the project. To enable the MCP integration, add the `expo-mcp` package to your project.'
    );
    expect(server).toBeNull();
  });

  it('reports missing Zod before registering DevTools capabilities', async () => {
    process.env.EXPO_UNSTABLE_MCP_SERVER = '1';
    mockResolveFrom.mockImplementation((_, moduleName) =>
      moduleName === 'zod' ? null : mcpTunnelPackagePath
    );
    const server = await maybeCreateMCPServerAsync({
      devServerManager,
      devServerUrl: 'http://localhost:8081',
    });
    expect(server).toBeNull();
    expect(mockQueryPluginsAsync).not.toHaveBeenCalled();
    expect(Log.error).toHaveBeenCalledWith(
      'Unable to resolve Zod from `expo-mcp`. Reinstall your project dependencies to enable MCP.'
    );
  });

  it('should use production MCP server by default', async () => {
    process.env.EXPO_UNSTABLE_MCP_SERVER = '1';
    const server = await maybeCreateMCPServerAsync({
      devServerManager,
      devServerUrl: 'http://localhost:8081',
    });
    // @ts-expect-error
    expect(server?.mockServerUrl).toBe('wss://mcp.expo.dev');
  });

  it('should use staging MCP server if the EXPO_STAGING environment variable is set', async () => {
    process.env.EXPO_UNSTABLE_MCP_SERVER = '1';
    process.env.EXPO_STAGING = '1';
    const server = await maybeCreateMCPServerAsync({
      devServerManager,
      devServerUrl: 'http://localhost:8081',
    });
    // @ts-expect-error
    expect(server?.mockServerUrl).toBe('wss://staging-mcp.expo.dev');
  });

  it('should allow specifying custom MCP server URL', async () => {
    process.env.EXPO_UNSTABLE_MCP_SERVER = 'ws://localhost:8787';
    const server = await maybeCreateMCPServerAsync({
      devServerManager,
      devServerUrl: 'http://localhost:8081',
    });
    // @ts-expect-error
    expect(server?.mockServerUrl).toBe('ws://localhost:8787');
  });

  it('should install the exit hook', async () => {
    process.env.EXPO_UNSTABLE_MCP_SERVER = '1';
    const spyInstallExitHooks = jest.spyOn(ExitHooks, 'installExitHooks');
    await maybeCreateMCPServerAsync({
      devServerManager,
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
      devServerManager,
      devServerUrl: 'http://localhost:8081',
    });
    await server.closeAsync();
    expect(mockRemoveExitHook).toHaveBeenCalledTimes(1);
  });
});
