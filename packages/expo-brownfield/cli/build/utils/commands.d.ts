import { RunCommandOptions, RunCommandResult } from './types';
export declare const runCommand: (command: string, args?: string[], options?: RunCommandOptions) => Promise<RunCommandResult>;
