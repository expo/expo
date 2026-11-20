import type {
  McpServerProxy,
  TunnelMcpServerProxy as TunnelMcpServerProxyType,
} from '@expo/mcp-tunnel' with { 'resolution-mode': 'import' };
import { loadModule, resolveFrom } from '@expo/require-utils';
import path from 'node:path';

import { getAccessToken, getSession } from '../../../api/user/UserSettings';
import { Log } from '../../../log';
import { env } from '../../../utils/env';
import { installExitHooks } from '../../../utils/exit';
import type { DevServerManager } from '../DevServerManager';
import { debugEvent } from '../devtoolsEvents';
import { addMcpCapabilities as addDevToolsPluginCapabilities } from './MCPDevToolsPluginCLIExtensions';

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
  devServerManager,
  devServerUrl,
}: {
  devServerManager: DevServerManager;
  devServerUrl: string;
}): Promise<McpServer | null> {
  const mcpServer = env.EXPO_UNSTABLE_MCP_SERVER;
  if (!mcpServer) {
    return null;
  }
  const { projectRoot } = devServerManager;
  let mcpPackagePath: string;
  try {
    mcpPackagePath = require.resolve('expo-mcp', { paths: [__dirname, projectRoot] });
  } catch {
    Log.error(
      'Missing the `expo-mcp` package in the project. To enable the MCP integration, add the `expo-mcp` package to your project.'
    );
    return null;
  }
  const mcpTunnelPackagePath = resolveFrom(path.dirname(mcpPackagePath), '@expo/mcp-tunnel');
  if (!mcpTunnelPackagePath) {
    Log.error('Unable to resolve the `@expo/mcp-tunnel` package');
    return null;
  }

  // TODO(@kitten): Move the Zod dependency and MCP schema construction into expo-mcp.
  const zodPackagePath = resolveFrom(path.dirname(mcpPackagePath), 'zod');
  if (!zodPackagePath) {
    Log.error(
      'Unable to resolve Zod from `expo-mcp`. Reinstall your project dependencies to enable MCP.'
    );
    return null;
  }

  const normalizedServer = /^([a-zA-Z][a-zA-Z\d+\-.]*):\/\//.test(mcpServer)
    ? mcpServer
    : `wss://${mcpServer}`;
  const mcpServerUrlObject = new URL(normalizedServer);
  const scheme = mcpServerUrlObject.protocol ?? 'wss:';
  const mcpServerUrl = `${scheme}//${mcpServerUrlObject.host}`;
  debugEvent('mcp_tunnel_create', { url: mcpServerUrl });

  try {
    const { addMcpCapabilities } = (await loadModule(mcpPackagePath)) as {
      addMcpCapabilities: (server: McpServerProxy, projectRoot: string) => void;
    };
    const { TunnelMcpServerProxy } = (await loadModule(mcpTunnelPackagePath)) as {
      TunnelMcpServerProxy: typeof TunnelMcpServerProxyType;
    };
    const { z } = (await loadModule(zodPackagePath)) as typeof import('zod');

    const logger = {
      ...Log,
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
    await addDevToolsPluginCapabilities(serverProxy, devServerManager, z);

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
    debugEvent('mcp_tunnel_failed', { error: debugEvent.error(error as Error) });
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
