import { DevServerManager } from './DevServerManager';
import { DevToolsPluginOutputSchema } from './DevToolsPlugin.schema';
import { DevToolsPluginCliExtensionExecutor } from './DevToolsPluginCliExtensionExecutor';
import { McpServer } from './MCP';
import { createMCPDevToolsExtensionSchema } from './createMCPDevToolsExtensionSchema';
import { Log } from '../../log';

const debug = require('debug')('expo:start:server:devtools:mcp');

export async function addMcpCapabilities(mcpServer: McpServer, devServerManager: DevServerManager) {
  const plugins = await devServerManager.devtoolsPluginManager.queryPluginsAsync();

  for (const plugin of plugins) {
    if (plugin.cliExtensions) {
      const commands = (plugin.cliExtensions.commands ?? []).filter((p) =>
        p.environments?.includes('mcp')
      );
      if (commands.length === 0) {
        continue;
      }

      const inputSchema = createMCPDevToolsExtensionSchema(plugin);

      debug(
        `Installing MCP CLI extension for plugin: ${plugin.packageName} - found ${commands.length} commands`
      );
      const devServerManagerRef = new WeakRef(devServerManager);

      mcpServer.registerTool(
        plugin.packageName,
        { title: plugin.packageName, description: plugin.description, inputSchema },
        async (cliCommandArgs) => {
          try {
            if (!('parameters' in cliCommandArgs)) {
              throw new Error(`No parameters provided : ${JSON.stringify(cliCommandArgs)}`);
            }
            const parameters = cliCommandArgs['parameters'];
            if (!('command' in parameters)) {
              throw new Error('No command provided');
            }
            const devServerManager = devServerManagerRef.deref();
            if (!devServerManager) {
              throw new Error('DevServerManager has been garbage collected');
            }
            const { command, ...args } = parameters;

            const metroServerOrigin = devServerManager
              .getDefaultDevServer()
              .getJsInspectorBaseUrl();

            const results = await new DevToolsPluginCliExtensionExecutor(
              plugin,
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
              content: [
                { type: 'text', text: `Error executing command: ${e.toString()}`, error: true },
              ],
            };
          }
        }
      );
    }
  }
}
