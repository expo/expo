import { MetroInspectorProxyApp } from './middleware/inspector/JsInspector';

export interface CliCommandParameterDescriptor {
  name: string;
  type: 'text' | 'number' | 'confirm';
  description?: string; // Optional description of the parameter
}
export interface CliCommandDescriptor {
  name: string;
  caption: string;
  parameters?: CliCommandParameterDescriptor[]; // Optional parameter to specify the type of parameters expected
}

export interface CliCommandExecutorArguments {
  command: string;
  args?: Record<string, string | number | boolean>; // Parameters for the command
  apps?: MetroInspectorProxyApp[]; // Optional apps to communicate with
}
export interface CliExtensionDescriptor {
  packageName: string;
  packageRoot: string;
  description: string;
  commands: CliCommandDescriptor[];
  mcpEnabled: boolean;
  cliEnabled?: boolean;
  main: string;
  executor: (args: CliCommandExecutorArguments) => Promise<string | undefined | null>;
}
