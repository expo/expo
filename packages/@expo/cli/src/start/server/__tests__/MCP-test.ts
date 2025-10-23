// @ts-expect-error
import resolveFrom from 'resolve-from';

import { Log } from '../../../log';
import { maybeCreateMCPServerAsync } from '../MCP';

jest.mock('@expo/mcp-tunnel', () => ({
  __esModule: true,
  default: {},
}));
jest.mock('@expo/cli/add-module', () =>
  jest.fn().mockReturnValue({
    TunnelMcpServerProxy: jest.fn().mockImplementation((mcpServerUrl: string) => ({
      // Adding a mock property that allows checking the server URL
      mockServerUrl: mcpServerUrl,
    })),
    addMcpCapabilities: jest.fn(),
  })
);
jest.mock('resolve-from');
jest.mock('../../../log');

describe(maybeCreateMCPServerAsync, () => {
  const mockResolveFromSilent = resolveFrom.silent as jest.MockedFunction<
    typeof resolveFrom.silent
  >;

  const originalEnv = process.env;
  beforeEach(() => {
    delete process.env.EXPO_STAGING;
    delete process.env.EXPO_UNSTABLE_MCP_SERVER;
  });

  afterEach(() => {
    mockResolveFromSilent.mockReset();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should return null if the MCP server is not enabled', async () => {
    const server = await maybeCreateMCPServerAsync('/app');
    expect(server).toBeNull();
  });

  it('should return non-null value if the MCP server is enabled', async () => {
    process.env.EXPO_UNSTABLE_MCP_SERVER = '1';
    mockResolveFromSilent.mockReturnValue('/app/node_modules/expo-mcp');
    const server = await maybeCreateMCPServerAsync('/app');
    expect(server).not.toBeNull();
  });

  it('should return null and log an error if the MCP server is enabled but the expo-mcp package is not installed', async () => {
    process.env.EXPO_UNSTABLE_MCP_SERVER = '1';
    const spyLogError = jest.spyOn(Log, 'error');
    const server = await maybeCreateMCPServerAsync('/app');
    expect(spyLogError).toHaveBeenCalledWith(
      'Missing the `expo-mcp` package in the project. To enable the MCP integration, add the `expo-mcp` package to your project.'
    );
    expect(server).toBeNull();
  });

  it('should use production MCP server by default', async () => {
    process.env.EXPO_UNSTABLE_MCP_SERVER = '1';
    mockResolveFromSilent.mockReturnValue('/app/node_modules/expo-mcp');
    const server = await maybeCreateMCPServerAsync('/app');
    // @ts-expect-error
    expect(server?.mockServerUrl).toBe('wss://mcp.expo.dev');
  });

  it('should use staging MCP server if the EXPO_STAGING environment variable is set', async () => {
    process.env.EXPO_UNSTABLE_MCP_SERVER = '1';
    process.env.EXPO_STAGING = '1';
    mockResolveFromSilent.mockReturnValue('/app/node_modules/expo-mcp');
    const server = await maybeCreateMCPServerAsync('/app');
    // @ts-expect-error
    expect(server?.mockServerUrl).toBe('wss://staging-mcp.expo.dev');
  });

  it('should allow specifying custom MCP server URL', async () => {
    process.env.EXPO_UNSTABLE_MCP_SERVER = 'ws://localhost:8787';
    mockResolveFromSilent.mockReturnValue('/app/node_modules/expo-mcp');
    const server = await maybeCreateMCPServerAsync('/app');
    // @ts-expect-error
    expect(server?.mockServerUrl).toBe('ws://localhost:8787');
  });
});
