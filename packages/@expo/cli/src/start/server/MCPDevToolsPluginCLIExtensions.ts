import { Log } from '../../log';
import type { DevServerManager } from './DevServerManager';
import type { DevToolsPluginInfo } from './DevToolsPlugin.schema';
import { DevToolsPluginOutputSchema } from './DevToolsPlugin.schema';
import { DevToolsPluginCliExtensionExecutor } from './DevToolsPluginCliExtensionExecutor';
import type { McpServer } from './MCP';
import { createMCPDevToolsExtensionSchema } from './createMCPDevToolsExtensionSchema';

const debug = require('debug')('expo:start:server:devtools:mcp');

export async function addMcpCapabilities(mcpServer: McpServer, devServerManager: DevServerManager) {
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

      const schema = createMCPDevToolsExtensionSchema(mcpPlugin);

      debug(
        `Installing MCP CLI extension for plugin: ${plugin.packageName} - found ${mcpCommands.length} commands`
      );

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

            const parsedResults = DevToolsPluginOutputSchema.safeParse(results);
            if (parsedResults.success === false) {
              throw new Error(
                `Invalid output from CLI command: ${parsedResults.error.issues
                  .map((issue) => issue.message)
                  .join(', ')}`
              );
            }
            return {
              content: parsedResults.data
                .map((line) => {
                  const { type } = line;
                  if (type === 'text') {
                    return { type, text: line.text, level: line.level, url: line.url };
                  } else if (line.type === 'image' || line.type === 'audio') {
                    // We could present this as a resource_link, but it seems not to be well supported in MCP clients,
                    // so we'll return a text with the link instead.
                    return {
                      type: 'text',
                      text: `${type} resource: ${line.url}${line.text ? ' (' + line.text + ')' : ''}`,
                    } as const;
                  }
                  return null;
                })
                .filter((line): line is Exclude<typeof line, null> => line !== null),
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
