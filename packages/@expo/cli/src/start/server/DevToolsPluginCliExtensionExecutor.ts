import { spawn, type ChildProcessWithoutNullStreams } from 'child_process';
import path from 'path';

import { isPathInside } from '../../utils/dir';
import type {
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
  private readonly resolvedEntryPoint: string;

  constructor(
    private plugin: DevToolsPluginInfo,
    private projectRoot: string,
    private spawnFunc: typeof spawn = spawn, // Used for injection when testing,
    private timeoutMs = DEFAULT_TIMEOUT_MS // Timeout for command execution
  ) {
    // Validate that this is a plugin with cli extensions
    if (!this.plugin.cliExtensions?.entryPoint) {
      throw new Error(`Plugin ${this.plugin.packageName} has no CLI extensions`);
    }
    // Reject entryPoints that escape packageRoot (e.g. "../../other-pkg/dist/cli.js").
    const resolved = path.resolve(this.plugin.packageRoot, this.plugin.cliExtensions.entryPoint);
    if (!isPathInside(resolved, this.plugin.packageRoot)) {
      throw new Error(
        `Plugin ${this.plugin.packageName} entryPoint "${this.plugin.cliExtensions.entryPoint}" ` +
          `escapes packageRoot (${this.plugin.packageRoot}); must be a relative path inside the package.`
      );
    }
    this.resolvedEntryPoint = resolved;
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

    const argsObj = (args ?? {}) as Record<string, unknown>;
    for (const param of commandElement.parameters ?? []) {
      if (!Object.prototype.hasOwnProperty.call(argsObj, param.name)) {
        throw new Error(
          `Parameter "${param.name}" not found in command "${command}" of plugin ${this.plugin.packageName}`
        );
      }
      // Enforce declared parameter type; don't rely on upstream Zod validation alone.
      const expected =
        param.type === 'confirm' ? 'boolean' : param.type === 'number' ? 'number' : 'string';
      const actual = typeof argsObj[param.name];
      if (actual !== expected) {
        throw new Error(
          `Parameter "${param.name}" of "${command}" expected ${expected} (declared "${param.type}"), got ${actual}.`
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
    return new Promise<DevToolsPluginOutput>((resolve) => {
      let finished = false;
      let timeout: ReturnType<typeof setTimeout> | undefined;
      const pluginResults = new DevToolsPluginCliExtensionResults(onOutput);

      // process.execPath instead of 'node' so the child can't be redirected by a PATH shim.
      let child: ChildProcessWithoutNullStreams;
      try {
        child = this.spawnFunc(
          process.execPath,
          [this.resolvedEntryPoint, command, `${JSON.stringify(args)}`, `${metroServerOrigin}`],
          {
            cwd: this.projectRoot,
            env: { ...process.env },
          }
        );
      } catch (err: any) {
        // spawn can throw synchronously; resolve with an error result instead of hanging.
        pluginResults.append(err?.toString?.() ?? String(err), 'error');
        resolve(pluginResults.getOutput());
        return;
      }

      const finishOnTruncation = () => {
        if (pluginResults.isTruncated() && !finished) {
          finished = true;
          if (timeout) clearTimeout(timeout);
          child.kill('SIGKILL');
          resolve(pluginResults.getOutput());
        }
      };

      // Collect output/error data
      child.stdout.on('data', (data) => {
        pluginResults.append(data.toString());
        finishOnTruncation();
      });
      child.stderr.on('data', (data) => {
        pluginResults.append(data.toString(), 'error');
        finishOnTruncation();
      });

      // Setup timeout
      timeout = setTimeout(() => {
        if (!finished) {
          finished = true;
          child.kill('SIGKILL');
          pluginResults.append('Command timed out', 'error');
          resolve(pluginResults.getOutput());
        }
      }, this.timeoutMs);

      child.on('close', (code: number) => {
        if (finished) return;
        if (timeout) clearTimeout(timeout);
        finished = true;
        pluginResults.exit(code);
        resolve(pluginResults.getOutput());
      });

      child.on('error', (err: Error) => {
        if (finished) return;
        if (timeout) clearTimeout(timeout);
        finished = true;
        pluginResults.append(err.toString(), 'error');
        resolve(pluginResults.getOutput());
      });
    });
  };
}
