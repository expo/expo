import { z } from 'zod';

import { DevToolsPlugin } from './DevToolsPlugin';
import { DevToolsPluginCommand } from './DevToolsPlugin.schema';

/**
 * Creates an MCP-compatible JSON schema for a DevTools plugin's CLI extensions.
 *
 * LLM agents have varying support for complex JSON schema features like `anyOf`/`oneOf`
 * discriminated unions. This implementation uses a flat schema with an enum for the
 * command name, which provides the best compatibility across different LLM providers:
 *
 * - OpenAI: Supports `anyOf` but requires `additionalProperties: false` and all fields `required`
 * - Claude/Anthropic: Works best with simple flat schemas with enums
 * - Other providers: Generally have limited or inconsistent support for discriminated unions
 *
 * To compensate for the lack of discriminated unions, parameter descriptions include
 * which command(s) they belong to, and command descriptions include their parameters.
 *
 * The resulting schema structure is:
 * ```json
 * {
 *   "type": "object",
 *   "properties": {
 *     "command": {
 *       "type": "string",
 *       "enum": ["cmd1", "cmd2", ...],
 *       "description": "The command to execute. Available commands: \"cmd1\" - Title 1 (params: foo); ..."
 *     },
 *     "foo": { "type": "string", "description": "Foo description (Used by: \"cmd1\")" },
 *     ...
 *   },
 *   "required": ["command"],
 *   "additionalProperties": false
 * }
 * ```
 */
export function createMCPDevToolsExtensionSchema(plugin: DevToolsPlugin) {
  if (plugin.cliExtensions == null || plugin.cliExtensions?.commands.length === 0) {
    throw new Error(
      `Plugin ${plugin.packageName} has no commands defined. Please define at least one command.`
    );
  }

  const commands = plugin.cliExtensions.commands;

  // Build a rich description that explains each command and its parameters
  const commandDescriptions = commands
    .map((c) => {
      const params = c.parameters?.map((p) => p.name).join(', ');
      return params ? `"${c.name}": ${c.title} (params: ${params})` : `"${c.name}": ${c.title}`;
    })
    .join('. ');

  // Create enum of command names for clear LLM selection
  const commandNames = commands.map((c) => c.name) as [string, ...string[]];

  // Collect all unique parameters across all commands
  // Track which commands use each parameter for documentation
  const parameterCommandMap: Record<string, string[]> = {};
  const parameterDescriptions: Record<string, string> = {};

  for (const command of commands) {
    if (command.parameters && command.parameters.length > 0) {
      for (const param of command.parameters) {
        if (!parameterCommandMap[param.name]) {
          parameterCommandMap[param.name] = [];
          parameterDescriptions[param.name] = param.description || '';
        }
        parameterCommandMap[param.name].push(command.name);
      }
    }
  }

  // Build parameters with descriptions that indicate which command(s) they belong to
  const allParameters: Record<string, z.ZodTypeAny> = {};
  for (const [paramName, commandList] of Object.entries(parameterCommandMap)) {
    const baseDescription = parameterDescriptions[paramName];
    const commandsUsingParam =
      commandList.length === commands.length
        ? 'all commands'
        : commandList.map((c) => `"${c}"`).join(', ');

    // Include command context in the description so LLMs know when to use each parameter
    const fullDescription = baseDescription
      ? `${baseDescription} (Used by: ${commandsUsingParam})`
      : `Parameter for: ${commandsUsingParam}`;

    allParameters[paramName] = z.string().optional().describe(fullDescription);
  }

  // Build the command description with clear instructions for the LLM
  const hasParameters = Object.keys(allParameters).length > 0;
  const commandDescription = hasParameters
    ? `Required. The command to execute. You must select exactly one command from the enum values. ` +
      `Each command may require specific parameters - only include parameters that belong to the selected command. ` +
      `Commands: ${commandDescriptions}.`
    : `Required. The command to execute. Select exactly one from the available options. ` +
      `Commands: ${commandDescriptions}.`;

  // Build the flat schema with additionalProperties: false for LLM compatibility
  const schema = z
    .object({
      command: z.enum(commandNames).describe(commandDescription),
      ...allParameters,
    })
    .strict(); // .strict() adds additionalProperties: false

  return {
    parameters: schema,
  };
}
