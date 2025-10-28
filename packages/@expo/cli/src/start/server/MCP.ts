import type {
  McpServerProxy,
  TunnelMcpServerProxy as TunnelMcpServerProxyType,
} from '@expo/mcp-tunnel' with { 'resolution-mode': 'import' };
import resolveFrom from 'resolve-from';

import { getAccessToken, getSession } from '../../api/user/UserSettings';
import { Log } from '../../log';
import { env } from '../../utils/env';
import { installExitHooks } from '../../utils/exit';

const importESM = require('@expo/cli/add-module') as <T>(moduleName: string) => Promise<T>;

const debug = require('debug')('expo:start:server:mcp') as typeof console.log;

/**
 * The MCP server
 */
export type McpServer = Omit<McpServerProxy, 'close'> & {
  /**
   * Close the server
   */
  closeAsync: () => Promise<void>;
};

/**
 * Create the MCP server
 */
export async function maybeCreateMCPServerAsync({
  projectRoot,
  devServerUrl,
}: {
  projectRoot: string;
  devServerUrl: string;
}): Promise<McpServer | null> {
  const mcpServer = env.EXPO_UNSTABLE_MCP_SERVER;
  if (!mcpServer) {
    return null;
  }
  const mcpPackagePath = resolveFrom.silent(projectRoot, 'expo-mcp');
  if (!mcpPackagePath) {
    Log.error(
      'Missing the `expo-mcp` package in the project. To enable the MCP integration, add the `expo-mcp` package to your project.'
    );
    return null;
  }

  const normalizedServer = /^([a-zA-Z][a-zA-Z\d+\-.]*):\/\//.test(mcpServer)
    ? mcpServer
    : `wss://${mcpServer}`;
  const mcpServerUrlObject = new URL(normalizedServer);
  const scheme = mcpServerUrlObject.protocol ?? 'wss:';
  const mcpServerUrl = `${scheme}//${mcpServerUrlObject.host}`;
  debug(`Creating MCP tunnel - server URL: ${mcpServerUrl}`);

  try {
    const { addMcpCapabilities } = await importESM<{
      addMcpCapabilities: (server: McpServerProxy, projectRoot: string) => void;
    }>(mcpPackagePath);
    const { TunnelMcpServerProxy } = await importESM<{
      TunnelMcpServerProxy: typeof TunnelMcpServerProxyType;
    }>('@expo/mcp-tunnel');

    const logger = {
      ...Log,
      debug(...message: any[]): void {
        debug(...message);
      },
      info(...message: any[]): void {
        Log.log(...message);
      },
    };
    const serverProxy: McpServerProxy = new TunnelMcpServerProxy(mcpServerUrl, {
      logger,
      wsHeaders: createAuthHeaders(),
      projectRoot,
      devServerUrl,
    });
    addMcpCapabilities(serverProxy, projectRoot);

    const removeExitHook = installExitHooks(async () => {
      await serverProxy.close();
    });
    const server = serverProxy as unknown as McpServer;
    server.closeAsync = async () => {
      removeExitHook();
      await serverProxy.close();
    };

    return server;
  } catch (error: unknown) {
    debug(`Error creating MCP tunnel: ${error}`);
  }
  return null;
}

function createAuthHeaders(): Record<string, string> {
  const token = getAccessToken();
  if (token) {
    return {
      authorization: `Bearer ${token}`,
    };
  }
  const sessionSecret = getSession()?.sessionSecret;
  if (sessionSecret) {
    return {
      'expo-session': sessionSecret,
    };
  }
  return {};
}
