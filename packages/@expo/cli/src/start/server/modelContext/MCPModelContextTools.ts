import { z } from 'zod';

import { Log } from '../../../log';
import type { McpServer } from '../MCP';
import { describeBlockReason, describeOwner } from './ModelContextPolicy';
import type { ModelContextRegistry, RegisteredTool } from './ModelContextRegistry';

/**
 * Exposes runtime-registered app tools to the MCP server.
 *
 * `@expo/mcp-tunnel` cannot unregister tools or announce `tools/list_changed` yet, so this
 * registers two stable tools: `app_list_tools` and `app_call_tool`. Per-tool registration can
 * replace this once the tunnel supports removal.
 */
export function addModelContextMcpCapabilities(
  mcpServer: McpServer,
  registry: ModelContextRegistry
) {
  mcpServer.registerTool(
    'app_list_tools',
    {
      title: 'List tools registered by the running app',
      description:
        'List tools the running Expo app registered at runtime through `modelContext` from `expo/devtools`. ' +
        'Returns each tool with its name, description, input schema, and owner. ' +
        'Call a listed tool with "app_call_tool". Tools blocked by the project policy are listed separately and cannot be called.',
    },
    async () => {
      if (registry.getConnectionCount() === 0) {
        return {
          content: [
            {
              type: 'text',
              text: 'No app is connected to the model context endpoint. Start the app in development and register a tool with `modelContext` from `expo/devtools`.',
            },
          ],
        };
      }
      const tools = registry.listAllowedTools().map(serializeTool);
      const blocked = registry.listBlockedTools().map((tool) => ({
        name: tool.mcpName,
        owner: describeOwner(tool.owner),
        reason: describeBlockReason(tool.blockedReason!, tool.owner),
      }));
      return { content: [{ type: 'text', text: JSON.stringify({ tools, blocked }, null, 2) }] };
    }
  );

  mcpServer.registerTool(
    'app_call_tool',
    {
      title: 'Call a tool registered by the running app',
      description:
        'Call a tool the running Expo app registered at runtime. Use the "name" from "app_list_tools" ' +
        'and pass "arguments" that match its input schema. The tool runs inside the app on the device or simulator.',
      inputSchema: {
        name: z.string().describe('Tool name as returned by "app_list_tools".'),
        arguments: z
          .record(z.unknown())
          .optional()
          .describe('Arguments that match the tool input schema.'),
        timeoutMs: z
          .number()
          .int()
          .min(1)
          .max(60_000)
          .optional()
          .describe('How long to wait for the app, in milliseconds. Default 10000.'),
      },
    },
    async ({ name, arguments: args, timeoutMs }) => {
      try {
        // The app already answers with MCP content, so it passes through unchanged.
        const { content, isError } = await registry.callToolAsync(name, args, { timeoutMs });
        return { content, isError };
      } catch (error: any) {
        Log.debug(`[model-context] app_call_tool failed: ${error?.message ?? error}`);
        return {
          content: [{ type: 'text', text: `Error calling "${name}": ${error?.message ?? error}` }],
          isError: true,
        };
      }
    }
  );
}

/** Descriptions are untrusted text. The owner prefix is fixed and the app cannot remove it. */
function serializeTool(tool: RegisteredTool) {
  return {
    name: tool.mcpName,
    description: `[Registered at runtime by ${describeOwner(tool.owner)}] ${tool.descriptor.description}`,
    inputSchema: tool.descriptor.inputSchema,
    owner: tool.owner.kind === 'package' ? tool.owner.name : tool.owner.kind,
  };
}
