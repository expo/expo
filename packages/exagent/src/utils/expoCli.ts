import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

import { debugEvent } from '../events';
import { CommandError } from './errors';
import { resolveSpawnTarget } from './windowsShim';

/** The `expo` CLI invocation to spawn. */
export interface ExpoCliCommand {
  /** Executable to spawn. */
  command: string;
  /** Arguments for the executable, including the `expo` argument of an `npx` fallback. */
  args: string[];
}

/**
 * Resolve the `expo` CLI to run for a project.
 *
 * `exagent` never imports `@expo/cli`; it drives the `expo` bin as a subprocess, so the
 * project keeps controlling which SDK version runs.
 *
 * @see llp/0001-agentic-cli-on-expo-cli.rfc.md §Constraints, item 5
 */
export function resolveExpoCli(projectRoot: string, args: string[]): ExpoCliCommand {
  const binName = process.platform === 'win32' ? 'expo.cmd' : 'expo';
  const localBin = path.join(projectRoot, 'node_modules', '.bin', binName);
  if (fs.existsSync(localBin)) {
    return { command: localBin, args };
  }
  // Projects that have not installed their dependencies yet still get a working command. On
  // Windows npm ships `npx` as a batch file, and a bare `npx` would be looked up as an image that
  // does not exist, so the shim is named here and started through a shell by `resolveSpawnTarget`.
  const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  return { command: npx, args: ['expo', ...args] };
}

/** Signals the terminal delivers to the whole process group, so the child gets them too. */
const TERMINAL_SIGNALS: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];

/**
 * Run the project's `expo` CLI and resolve with the exit code it reported.
 *
 * The child inherits stdio, so the `expo` output the user (or their agent) expects is
 * unchanged.
 *
 * While the child runs, terminal signals are forwarded to it instead of ending this
 * process. The default action would kill the wrapper first, cutting off the child's
 * shutdown output and losing its exit code. Forwarding also makes `kill <exagent pid>`
 * stop the dev server, which matters for agents that drive the CLI programmatically.
 * An interrupt then resolves as a clean exit, because the stop was asked for.
 */
export function runExpoAsync(projectRoot: string, args: string[]): Promise<number> {
  const { command, args: commandArgs } = resolveExpoCli(projectRoot, args);
  debugEvent('expo_resolved', { command, args: commandArgs });

  return new Promise<number>((resolve, reject) => {
    // On Windows the resolved bin is a batch shim, which only `cmd.exe` can run.
    const target = resolveSpawnTarget(command, commandArgs);
    const child = spawn(target.command, target.args, {
      cwd: projectRoot,
      stdio: 'inherit',
      shell: target.shell,
    });

    const listeners = TERMINAL_SIGNALS.map((signal) => {
      const forward = () => {
        child.kill(signal);
      };
      process.on(signal, forward);
      return { signal, forward } as const;
    });
    const stopForwardingSignals = () => {
      for (const { signal, forward } of listeners) {
        process.off(signal, forward);
      }
    };

    child.on('error', (error: NodeJS.ErrnoException) => {
      stopForwardingSignals();
      debugEvent('expo_spawn_failed', { command, error: debugEvent.error(error) });
      if (error.code === 'ENOENT') {
        reject(
          new CommandError(
            'EXPO_CLI_NOT_FOUND',
            `Could not run the Expo CLI (${command}). The project has no expo dependency and "npx expo" is not available, so there is no CLI to drive. Install Expo in the project with "npm install expo", then run this command again.`
          )
        );
        return;
      }
      reject(error);
    });

    child.on('close', (code, signal) => {
      stopForwardingSignals();
      const exitCode = code ?? (signal === 'SIGINT' || signal === 'SIGTERM' ? 0 : 1);
      debugEvent('expo_exit', { code: exitCode, signal: signal ?? undefined });
      resolve(exitCode);
    });
  });
}
