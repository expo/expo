import type { JSONSchema } from '@expo/schema-utils';

export type DevToolsPluginCommandParameter = {
  name: string;
  type: 'text' | 'number' | 'confirm';
  description?: string;
};

const CommandParameterSchema: JSONSchema<DevToolsPluginCommandParameter> = {
  type: 'object',
  required: ['name', 'type'],
  properties: {
    name: { type: 'string', minLength: 1 },
    type: { enum: ['text', 'number', 'confirm'] },
    description: { type: 'string' },
  },
};

export type DevToolsPluginCommand = {
  name: string;
  title: string;
  environments: readonly ('cli' | 'mcp')[];
  parameters?: DevToolsPluginCommandParameter[];
};

const CommandSchema: JSONSchema<DevToolsPluginCommand> = {
  type: 'object',
  required: ['name', 'title', 'environments'],
  properties: {
    name: { type: 'string', minLength: 1 },
    title: { type: 'string', minLength: 1 },
    environments: { type: 'array', items: { enum: ['cli', 'mcp'] } },
    parameters: { type: 'array', items: CommandParameterSchema },
  },
};

export type DevToolsPluginCliExtensions = {
  description: string;
  commands: DevToolsPluginCommand[];
  entryPoint: string;
};

const CliExtensionsSchema: JSONSchema<DevToolsPluginCliExtensions> = {
  type: 'object',
  required: ['description', 'commands', 'entryPoint'],
  properties: {
    description: { type: 'string' },
    commands: { type: 'array', items: CommandSchema, minItems: 1 },
    entryPoint: { type: 'string', minLength: 1 },
  },
};

export type DevToolsPluginInfo = {
  packageName: string;
  packageRoot: string;
  webpageRoot?: string;
  cliExtensions?: DevToolsPluginCliExtensions;
};

export const PluginSchema: JSONSchema<DevToolsPluginInfo> = {
  type: 'object',
  required: ['packageName', 'packageRoot'],
  properties: {
    packageName: { type: 'string', minLength: 1 },
    packageRoot: { type: 'string', minLength: 1 },
    webpageRoot: { type: 'string' },
    cliExtensions: CliExtensionsSchema,
  },
};

export type DevToolsPluginOutput = (
  | { type: 'text'; text: string; url?: string; level: 'info' | 'warning' | 'error' }
  | { type: 'audio'; url: string; text?: string }
  | { type: 'image'; url: string; text?: string }
)[];

export const DevToolsPluginOutputSchema: JSONSchema<DevToolsPluginOutput> = {
  type: 'array',
  items: {
    type: 'object',
    allOf: [
      {
        required: ['type'],
        properties: { type: { enum: ['text', 'audio', 'image'] } },
      },
      {
        if: { properties: { type: { enum: ['text'] } } },
        then: {
          required: ['text', 'level'],
          properties: {
            text: { type: 'string' },
            url: { type: 'string' },
            level: { enum: ['info', 'warning', 'error'] },
          },
        },
        else: {
          required: ['url'],
          properties: {
            url: { type: 'string', format: 'url' },
            text: { type: 'string' },
          },
        },
      },
    ],
  },
};

export type DevToolsPluginExecutorArguments = {
  command: string;
  metroServerOrigin: string;
  args?: Record<string, string | number | boolean> | undefined;
  onOutput?: (output: DevToolsPluginOutput) => void;
};
