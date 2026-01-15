import z from 'zod';

import { DevServerManager } from './DevServerManager';
import { DevToolsPluginOutputSchema } from './DevToolsPlugin.schema';
import { DevToolsPluginCliExtensionExecutor } from './DevToolsPluginCliExtensionExecutor';
import { DevToolsPluginCliExtensionResults } from './DevToolsPluginCliExtensionResults';
import { McpServer } from './MCP';
import { createMCPDevToolsExtensionSchema } from './createMCPDevToolsExtensionSchema';
import { Log } from '../../log';
import { queryAllInspectorAppsAsync } from './middleware/inspector/JsInspector';

const debug = require('debug')('expo:start:server:devtools:mcp');

export async function addMcpCapabilities(mcpServer: McpServer, devServerManager: DevServerManager) {
  const plugins = await devServerManager.devtoolsPluginManager.queryPluginsAsync();

  // Register tool for looking up running apps through the JsInspector middleware.
  mcpServer.registerTool(
    'expo-cli-apps',
    {
      title: 'Expo CLI Apps',
      description: 'Query running apps and their details from the Expo Metro server',
      inputSchema: {
        parameters: z.object({}), //   no parameters needed for this command
      },
    },
    async () => {
      const metroServerOrigin = devServerManager.getDefaultDevServer().getJsInspectorBaseUrl();
      try {
        const apps = await queryAllInspectorAppsAsync(metroServerOrigin);
        return {
          content: apps.map((app) => ({
            type: 'text' as const,
            text: JSON.stringify(app, null, 2),
          })),
        };
      } catch (e: any) {
        Log.error(' Error querying running apps from Metro server:', e);
        return {
          content: [{ type: 'text', text: `Error querying running apps: ${e.toString()}` }],
          isError: true,
        };
      }
    }
  );

  // Register tools for CLI extensions
  for (const plugin of plugins) {
    if (plugin.cliExtensions) {
      const commands = (plugin.cliExtensions.commands ?? []).filter((p) =>
        p.environments?.includes('mcp')
      );
      if (commands.length === 0) {
        continue;
      }

      const schema = createMCPDevToolsExtensionSchema(plugin);

      debug(
        `Installing MCP CLI extension for plugin: ${plugin.packageName} - found ${commands.length} commands`
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
            const { command, appId, ...args } = parameters;

            const metroServerOrigin = devServerManager
              .getDefaultDevServer()
              .getJsInspectorBaseUrl();

            // Auto-resolve the connected app
            const apps = await queryAllInspectorAppsAsync(metroServerOrigin);
            if (apps.length === 0) {
              return {
                content: [
                  {
                    type: 'text' as const,
                    text: 'No connected apps found. Make sure a device or simulator is running your app.',
                  },
                ],
                isError: true,
              };
            }
            const app = appId ? apps.find((a) => a.appId === appId) : apps[0];
            if (!app) {
              return {
                content: [
                  {
                    type: 'text' as const,
                    text: `No connected app found with ID: ${appId}`,
                  },
                ],
                isError: true,
              };
            }

            const results = await new DevToolsPluginCliExtensionExecutor(
              plugin,
              devServerManager.projectRoot,
              false // disable tty color for MCP clients
            ).execute({ command, args, metroServerOrigin, app });

            const parsedResults = DevToolsPluginOutputSchema.safeParse(results);
            if (parsedResults.success === false) {
              throw new Error(
                `Invalid output from CLI command: ${DevToolsPluginCliExtensionResults.formatZodError(parsedResults.error)}`
              );
            }
            return {
              content: parsedResults.data
                .map((line) => {
                  const { type } = line;
                  if (type === 'text') {
                    return { type, text: line.text, level: line.level, uri: line.uri };
                  } else if (line.type === 'uri') {
                    // We could present this as a resource_link, but it seems not to be well supported in MCP clients,
                    // so we'll return a text with the link instead.
                    return {
                      type: 'text',
                      text: `Resource: ${line.uri}${line.text ? ' (' + line.text + ')' : ''}`,
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
