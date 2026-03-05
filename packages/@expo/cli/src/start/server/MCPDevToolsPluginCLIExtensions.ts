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
    'expo-cli-list-apps',
    {
      title: 'Expo CLI Apps',
      description:
        'List connected apps and devices running in the Expo Metro server. Call this tool first ' +
        'before using any other expo- tools to discover available apps and verify device ' +
        'connectivity if the tool requires an id parameter. When multiple apps are connected, you MUST ' +
        'present the user with a tool for selecting which app to target, then STOP and wait for the user to respond ' +
        'with their selection. Do NOT proceed, guess, or pick a default app. Only after the user has ' +
        'explicitly selected an app should you continue with the next tool call. ' +
        'Once the user has selected an app, remember that selection and reuse it for all subsequent ' +
        'tool calls in the same conversation. Do NOT ask the user to select again unless they ' +
        'explicitly ask to switch devices.',
      inputSchema: {
        parameters: z.object({}), //   no parameters needed for this command
      },
    },
    async () => {
      const metroServerOrigin = devServerManager.getDefaultDevServer().getJsInspectorBaseUrl();
      try {
        const apps = await queryAllInspectorAppsAsync(metroServerOrigin);
        const content = apps.map((app) => ({
          type: 'text' as const,
          text: JSON.stringify(app, null, 2),
        }));
        if (apps.length > 1) {
          content.push({
            type: 'text' as const,
            text:
              'IMPORTANT: Multiple apps are connected. You MUST present the user with a tool for selecting ' +
              'which app to target, then STOP and wait for the user to respond with their selection. ' +
              'Do NOT automatically pick one or proceed without the user explicitly choosing an app. ' +
              'Once selected, remember the chosen app id and reuse it for all subsequent tool calls ' +
              'in this conversation without asking again.',
          });
        }
        return { content };
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
            const { command, id, ...args } = parameters;

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
            const app = apps.find((a) => a.id === id);
            if (!app) {
              return {
                content: [
                  {
                    type: 'text' as const,
                    text: `No connected app found with ID: ${id}`,
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
