import { spawn } from 'child_process';
import path from 'path';
import { createInterface } from 'readline';

import {
  DevToolsPluginExecutorArguments,
  DevToolsPluginInfo,
  DevToolsPluginOutput,
} from './DevToolsPlugin.schema';
import { DevToolsPluginCliExtensionResults } from './DevToolsPluginCliExtensionResults';

const DEFAULT_TIMEOUT_MS = 10_000; // 10 seconds

/**
 * Class that executes CLI Extension commands for a given plugin
 *
 * ## Responsibilities:
 * - Verifies that requested commands exist and have correct parameters
 * - Validates that provided arguments match expected parameter schema
 * - Spawns and manages child processes for command execution
 *  - Captures and streams stdout/stderr data from executed commands
 *  - Manages process errors, timeouts, and unexpected failures
 *  - Enforces execution time limits to prevent hanging processes
 *  - Configures proper execution environment with color support
 *  - Ensures proper cleanup of processes and timeouts
 *  - Provides structured output with exit codes and error states
 */
export class DevToolsPluginCliExtensionExecutor {
  constructor(
    private plugin: DevToolsPluginInfo,
    private projectRoot: string,
    private enableColorTTY = true,
    private spawnFunc: typeof spawn = spawn, // Used for injection when testing,
    private timeoutMs = DEFAULT_TIMEOUT_MS // Timeout for command execution
  ) {
    // Validate that this is a plugin with cli extensions
    if (!this.plugin.cliExtensions?.entryPoint) {
      throw new Error(`Plugin ${this.plugin.packageName} has no CLI extensions`);
    }
  }

  public validate({ command, args }: Omit<DevToolsPluginExecutorArguments, 'metroServerOrigin'>) {
    const commandElement = this.plugin.cliExtensions?.commands.find((c) => c.name === command);
    if (!commandElement) {
      throw new Error(`Command "${command}" not found in plugin ${this.plugin.packageName}`);
    }

    const paramLength = commandElement.parameters?.length ?? 0;
    const argsLength = Object.keys(args ?? {}).length;
    if (paramLength !== argsLength) {
      // Quick check to see if the lengths match
      throw new Error(
        `Expected ${paramLength} parameter(s), but got ${argsLength} argument(s) for the command "${command}".`
      );
    }

    const argsKeys = Object.keys(args ?? {});
    for (const param of commandElement.parameters ?? []) {
      const found = argsKeys.find((key) => key === param.name);
      if (!found) {
        throw new Error(
          `Parameter "${param.name}" not found in command "${command}" of plugin ${this.plugin.packageName}`
        );
      }
    }
  }

  /** this function is used for testing and showing the command in UI */
  public getCommandString = ({
    command,
    args,
  }: Omit<DevToolsPluginExecutorArguments, 'metroServerOrigin'>) => {
    return `node ${this.plugin.cliExtensions!.entryPoint} ${command}${Object.keys(args ?? {}).length > 0 ? ' ' + JSON.stringify(args) : ''}`;
  };

  public execute = async ({
    command,
    args,
    metroServerOrigin,
    onOutput,
  }: DevToolsPluginExecutorArguments): Promise<DevToolsPluginOutput> => {
    this.validate({ command, args });
    return new Promise<DevToolsPluginOutput>(async (resolve) => {
      // Set up the command and its arguments
      const tool = path.join(this.plugin.packageRoot, this.plugin.cliExtensions!.entryPoint);
      const child = this.spawnFunc(
        'node',
        [tool, command, `${JSON.stringify(args)}`, `${metroServerOrigin}`],
        {
          cwd: this.projectRoot,
          /**
           * This tells chalk (and other color libraries) to output ANSI color codes even when not running in a TTY.
           */
          env: { ...process.env, ...(this.enableColorTTY ? { FORCE_COLOR: '1' } : {}) },
        }
      );

      let finished = false;
      const pluginResults = new DevToolsPluginCliExtensionResults(onOutput);

      // Use readline to handle line-buffered output
      const stdoutRL = createInterface({ input: child.stdout, crlfDelay: Infinity });
      const stderrRL = createInterface({ input: child.stderr, crlfDelay: Infinity });

      stdoutRL.on('line', (line) => pluginResults.append(line));
      stderrRL.on('line', (line) => pluginResults.append(line, 'error'));

      const closeHandler = () => {
        stdoutRL.close();
        stderrRL.close();
      };

      // Setup timeout
      const timeout = setTimeout(() => {
        if (!finished) {
          finished = true;
          child.kill('SIGKILL');
          pluginResults.append('Command timed out', 'error');
          resolve(pluginResults.getOutput());
        }
      }, this.timeoutMs);

      child.on('close', (code: number) => {
        if (finished) return;
        clearTimeout(timeout);
        finished = true;
        closeHandler();
        pluginResults.exit(code);
        resolve(pluginResults.getOutput());
      });

      child.on('error', (err: Error) => {
        if (finished) return;
        clearTimeout(timeout);
        finished = true;
        closeHandler();
        pluginResults.append(err.toString(), 'error');
        resolve(pluginResults.getOutput());
      });
    });
  };
}
