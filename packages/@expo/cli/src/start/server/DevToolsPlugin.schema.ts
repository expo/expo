import { z } from 'zod';

const CommandParameterSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['text', 'number', 'confirm']),
  description: z.string().optional(),
});

export type DevToolsPluginCommandParameter = z.infer<typeof CommandParameterSchema>;

const CommandSchema = z.object({
  name: z.string().min(1),
  title: z.string().min(1),
  environments: z.array(z.enum(['cli', 'mcp'])).readonly(),
  parameters: z.array(CommandParameterSchema).optional(),
});

export type DevToolsPluginCommand = z.infer<typeof CommandSchema>;

export type DevToolsPluginExecutorArguments = {
  command: string;
  metroServerOrigin: string;
  args?: Record<string, string | number | boolean> | undefined;
  onOutput?: (output: DevToolsPluginOutput) => void;
};

const CliExtensionsSchema = z.object({
  description: z.string(),
  commands: z.array(CommandSchema).min(1),
  entryPoint: z.string().min(1),
});

export type DevToolsPluginCliExtensions = z.infer<typeof CliExtensionsSchema>;

export const PluginSchema = z.object({
  packageName: z.string().min(1),
  packageRoot: z.string().min(1),
  webpageRoot: z.string().optional(),
  cliExtensions: CliExtensionsSchema.optional(),
});

export type DevToolsPluginInfo = z.infer<typeof PluginSchema>;

const DevToolsPluginOutputLinesSchema = z.union([
  z.object({
    type: z.literal('text'),
    text: z.string(),
    uri: z.string().optional(),
    level: z.enum(['info', 'warning', 'error']),
  }),
  z.object({
    type: z.literal('uri'),
    uri: z.string().url(),
    text: z.string().optional(),
  }),
]);

export const DevToolsPluginOutputSchema = z.array(DevToolsPluginOutputLinesSchema);

export type DevToolsPluginOutput = z.infer<typeof DevToolsPluginOutputSchema>;
