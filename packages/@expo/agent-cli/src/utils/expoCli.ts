import { debugEvent } from '../events';
import { CommandError } from './errors';
import { runInheritedAsync } from './inheritedRun';
import { resolvePackageRunner } from './packageRunner';
import { resolveProjectBin } from './projectBin';
import { spawnSubprocessAsync, type CapturedOutput, type SubprocessResult } from './subprocess';

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
 * `@expo/agent-cli` never imports `@expo/cli`; it drives the `expo` bin as a subprocess, so the
 * project keeps controlling which SDK version runs.
 *
 * The bin is looked for the way the package manager installed it — this `node_modules/.bin` and
 * every ancestor's (`./projectBin.ts`) — because an npm workspace has exactly one, at its root. The
 * runner fallback below is what a hoisted project used to get instead: a download of an SDK the
 * repository had already installed, at whatever version the registry serves (F113, wave 28).
 *
 * @see llp/0001-agentic-cli-on-expo-cli.rfc.md §Constraints
 */
export function resolveExpoCli(projectRoot: string, args: string[]): ExpoCliCommand {
  const localBin = resolveProjectBin(projectRoot, 'expo');
  if (localBin) {
    return { command: localBin, args };
  }
  // Projects that have not installed their dependencies yet still get a working command, through
  // the runner the caller reached this CLI through (`./packageRunner`). On Windows npm ships `npx`
  // as a batch file, and a bare `npx` would be looked up as an image that does not exist, so the
  // shim is named there and started through a shell by `resolveSpawnTarget`.
  const { command } = resolvePackageRunner();
  return { command, args: ['expo', ...args] };
}

export interface SpawnExpoOptions {
  /** Defaults to `capture`. `inherit` is {@link runExpoAsync}'s mode, and only its. */
  output?: CapturedOutput;
  /** Kill the run when it goes silent on a question. See `SubprocessOptions.promptGuard`. */
  promptGuard?: boolean;
  /**
   * Whether the child is told `CI=1`. Defaults to true; the dev-server step is the one caller
   * that turns it off. See {@link spawnExpoAsync} for why.
   */
  ci?: boolean;
}

/**
 * Run the project's `expo` CLI and capture what it printed.
 *
 * The difference from {@link runExpoAsync} is who is watching. Nothing is attached to this child's
 * stdin and nobody is reading its output as it arrives, so a prompt here is a hang. Two separate
 * things stop that from becoming one:
 *
 *  - **stdout is a pipe.** `isInteractive()` is `!shouldReduceLogs() && !env.CI &&
 *    process.stdout.isTTY` [observed — `packages/@expo/cli/src/utils/interactive.ts`], and every
 *    captured mode wires the child's stdout to a pipe [observed — `subprocess.ts` `stdioFor`], so
 *    the CLI already knows nobody can answer it. Its prompt helper then fails fast with a sentence
 *    this CLI can classify [observed — `packages/@expo/cli/src/utils/prompts.ts`], and the keypress
 *    menu of `expo start` is never installed [observed — `start/startAsync.ts:140`].
 *  - **`CI=1`**, which says the same thing a second way, because the CLI rejects
 *    `--non-interactive` and names the variable instead [observed —
 *    `packages/@expo/cli/src/index.ts`].
 *
 * `ci: false` keeps the first and drops the second, and it exists because `CI` does a *second* job
 * in the Expo CLI that the dev server cannot survive: it turns Metro's file watcher off [observed —
 * `instantiateMetro.ts` `isWatchEnabled`, `withMetroMultiPlatform.ts:496`], so the dev server serves
 * the snapshot it read at start-up forever. See llp/0010 §Needs-human protocol, layer 2.
 *
 * The inherited runs deliberately get neither: there a person has the terminal, and answering a
 * prompt is the point.
 *
 * @ref llp/0010-agent-conventions.rfc.md §Needs-human protocol
 */
export async function spawnExpoAsync(
  projectRoot: string,
  args: string[],
  { output = 'capture', promptGuard, ci = true }: SpawnExpoOptions = {}
): Promise<{ cli: ExpoCliCommand; result: SubprocessResult }> {
  const cli = resolveExpoCli(projectRoot, args);
  debugEvent('expo_resolved', { command: cli.command, args: cli.args });

  const result = await spawnSubprocessAsync(cli.command, cli.args, {
    cwd: projectRoot,
    output,
    promptGuard,
    // Nothing rather than `CI=0`: a machine whose own environment says `CI` is a machine where the
    // frozen bundler is the right behaviour, and overriding it here would be this wrapper deciding
    // something about the caller's environment that it was never told.
    ...(ci ? { env: { CI: '1' } } : null),
  });
  return { cli, result };
}

/**
 * Run the project's `expo` CLI and resolve with the exit code it reported.
 *
 * The child inherits stdio, so the `expo` output the user (or their agent) expects is
 * unchanged.
 *
 * While the child runs, terminal signals are forwarded to it instead of ending this
 * process. The default action would kill the wrapper first, cutting off the child's
 * shutdown output and losing its exit code. Forwarding also makes `kill <@expo/agent-cli pid>`
 * stop the dev server, which matters for agents that drive the CLI programmatically.
 * An interrupt then resolves as a clean exit, because the stop was asked for.
 */
export function runExpoAsync(projectRoot: string, args: string[]): Promise<number> {
  const { command, args: commandArgs } = resolveExpoCli(projectRoot, args);
  debugEvent('expo_resolved', { command, args: commandArgs });

  return runInheritedAsync(command, commandArgs, {
    cwd: projectRoot,
    onExit: (code, signal) => debugEvent('expo_exit', { code, signal: signal ?? undefined }),
    onSpawnError: (error) =>
      debugEvent('expo_spawn_failed', { command, error: debugEvent.error(error) }),
  }).catch((error: NodeJS.ErrnoException) => {
    if (error.code === 'ENOENT') {
      throw new CommandError(
        'EXPO_CLI_NOT_FOUND',
        `Could not run the Expo CLI (${command}). The project has no expo dependency and "npx expo" is not available, so there is no CLI to drive. Install Expo in the project with "npm install expo", then run this command again.`
      );
    }
    throw error;
  });
}
