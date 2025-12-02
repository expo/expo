import { z } from 'zod';

import { DevToolsPlugin } from './DevToolsPlugin';
import { DevToolsPluginCommand } from './DevToolsPlugin.schema';

export function createMCPDevToolsExtensionSchema(plugin: DevToolsPlugin) {
  if (plugin.cliExtensions == null || plugin.cliExtensions?.commands.length === 0) {
    throw new Error(
      `Plugin ${plugin.packageName} has no commands defined. Please define at least one command.`
    );
  }

  const createCommandSchema = (c: DevToolsPluginCommand) =>
    z.object({
      command: z.literal(c.name).describe(c.title),
      ...((c.parameters?.length ?? 0) > 0
        ? {
            // If the command has parameters, extend schema for them
            ...c.parameters!.reduce(
              (acc, param) => ({
                ...acc,
                [param.name]: z.string().describe(param.description || ''),
              }),
              {} as Record<string, z.ZodTypeAny>
            ),
          }
        : {}),
    });

  // If we only have a single command, we can return the schema directly.
  const commandSchemas = plugin.cliExtensions.commands.map((c) => createCommandSchema(c));
  if (commandSchemas.length === 1) {
    return {
      parameters: commandSchemas[0],
    };
  }

  // The union type expects an array with at least two elements, so we need to create the type based
  // on the actual command schemas.
  type First = (typeof commandSchemas)[0];
  type Second = (typeof commandSchemas)[1];
  type Schema = [First, Second, ...z.ZodTypeAny[]];

  return {
    parameters: commandSchemas.length === 1 ? commandSchemas[0] : z.union(commandSchemas as Schema),
  };
}
