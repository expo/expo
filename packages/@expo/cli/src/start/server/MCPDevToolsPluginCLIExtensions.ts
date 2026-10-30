import { Log } from '../../log';
import type { DevServerManager } from './DevServerManager';
import type { McpServer } from './MCP';
import { createMCPDevToolsExtensionSchema } from './createMCPDevToolsExtensionSchema';
import type { DevToolsPluginInfo } from './devtools/DevToolsPlugin.schema';
import { DevToolsPluginCliExtensionExecutor } from './devtools/DevToolsPluginCliExtensionExecutor';
import { debugEvent } from './devtoolsEvents';

export async function addMcpCapabilities(
  mcpServer: Pick<McpServer, 'registerTool'>,
  devServerManager: DevServerManager,
  z: typeof import('zod').z
) {
  const plugins = await devServerManager.devtoolsPluginManager.queryPluginsAsync();

  for (const plugin of plugins) {
    if (plugin.cliExtensions) {
      const mcpCommands = (plugin.cliExtensions.commands ?? []).filter((p) =>
        p.environments?.includes('mcp')
      );
      if (mcpCommands.length === 0) {
        continue;
      }

      // Build an MCP-scoped descriptor so the schema enum and the executor's
      // existence check both reject commands that were not declared MCP-enabled.
      const mcpPlugin: DevToolsPluginInfo = {
        packageName: plugin.packageName,
        packageRoot: plugin.packageRoot,
        cliExtensions: {
          ...plugin.cliExtensions,
          commands: mcpCommands,
        },
      };

      const schema = createMCPDevToolsExtensionSchema(mcpPlugin, z);

      debugEvent('mcp_extension_installed', {
        packageName: plugin.packageName,
        commandCount: mcpCommands.length,
      });

      mcpServer.registerTool(
        plugin.packageName,
        {
          title: plugin.packageName,
          description: plugin.description,
          inputSchema: { parameters: schema },
        },
        async ({ parameters }) => {
          try {
            const { command, ...args } = parameters;

            const metroServerOrigin = devServerManager
              .getDefaultDevServer()
              .getJsInspectorBaseUrl();

            const results = await new DevToolsPluginCliExtensionExecutor(
              mcpPlugin,
              devServerManager.projectRoot
            ).execute({ command, args, metroServerOrigin });

            return {
              content: results.map((line) => {
                if (line.type === 'text') {
                  return line;
                }
                // We could present this as a resource_link, but it seems not to be well supported in MCP clients,
                // so we'll return a text with the link instead.
                return {
                  type: 'text',
                  text: `${line.type} resource: ${line.url}${line.text ? ' (' + line.text + ')' : ''}`,
                } as const;
              }),
            };
          } catch (e: any) {
            Log.error('Error executing MCP CLI command:', e);
            return {
              content: [{ type: 'text', text: `Error executing command: ${e.toString()}` }],
              isError: true,
            };
          }
        }
      );
    }
  }
}
