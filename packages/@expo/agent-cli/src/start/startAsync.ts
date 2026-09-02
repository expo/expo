import { holdDevServerLockAsync } from '../devLock';
import type { ResolvedDevServerPort } from '../devLock/port';
import { dependsOnDevClientSync, reportFollowUps } from '../followups';
import { autoSyncSkillsAsync } from '../skills/skillsAsync';
import { CommandError } from '../utils/errors';
import { runExpoAsync, spawnExpoAsync } from '../utils/expoCli';
import type { SubprocessOutput } from '../utils/subprocess';
import { resolveStartFollowUpsAsync } from './followUps';
import type { StartOptions } from './resolveOptions';

/** How long to wait after spawning `expo start` before syncing skills. */
export const SKILLS_SYNC_IDLE_DELAY_MS = 3000;

/** What one dev-server run amounts to, for a caller that has to report on it. */
export interface DevServerRun {
  /** The exit code of the subprocess. */
  exitCode: number;
  /** What it printed, empty in `inherit` mode where this process never saw it. */
  stdout: string;
  stderr: string;
  /**
   * The port the dev server ended up on, as the lock resolved it, or null when the lock could not
   * run at all. `source: 'default'` means nothing reported one — there is no port to point at.
   */
  port: ResolvedDevServerPort | null;
}

/**
 * Run `expo start` as a subprocess and sync skills a few seconds later.
 *
 * @returns the exit code of the `expo start` subprocess.
 */
export async function startAsync(projectRoot: string, options: StartOptions): Promise<number> {
  // @ref llp/0009-smart-followups.rfc.md §Examples per command
  // The follow-ups go out before the subprocess does: once Metro streams into this terminal,
  // anything printed after it scrolls away with the bundler output.
  //
  // This command runs no probe, by design, so which app the URL is for is decided the way
  // `expo start` decides it: `--dev-client`, or the `expo-dev-client` dependency, means a
  // development build; anything else means Expo Go.
  reportFollowUps(
    'start',
    await resolveStartFollowUpsAsync(projectRoot, options, {
      expoGo: !options.expoArgs.includes('--dev-client') && !dependsOnDevClientSync(projectRoot),
      web: options.platform === 'web',
    })
  );

  // `@expo/agent-cli start` hands the terminal over untouched, whatever this process' streams are: it is
  // the "forward everything to `expo start`" command, and capturing its output would take the
  // bundler's interactive keypresses away from a person who has one.
  const run = await runDevServerAsync(projectRoot, ['start', ...options.expoArgs], {
    agentSkills: options.agentSkills,
  });
  return run.exitCode;
}

/**
 * Run an `expo` command that starts a dev server (`start`, `run:ios`, `run:android`), publish
 * where that dev server listens, and sync skills a few seconds later.
 *
 * The delay keeps the dependency scan away from the first bundle, and the timer is
 * cancelled when the dev server exits first, so a failed start syncs nothing.
 *
 * @ref llp/0004-smart-start-and-project-state.rfc.md §Status — the dev-server lock of
 * `src/devLock/` is taken here, because this is the one place that knows a dev server is starting
 * and can wait for the port it ends up on. It is held for exactly as long as the subprocess runs.
 *
 * @param args Arguments for the `expo` CLI, starting with the command name.
 * @returns the exit code of the subprocess.
 */
export async function runDevServerAsync(
  projectRoot: string,
  args: string[],
  { agentSkills, output = 'inherit' }: { agentSkills: boolean; output?: SubprocessOutput }
): Promise<DevServerRun> {
  let timer: NodeJS.Timeout | undefined;
  if (agentSkills) {
    timer = setTimeout(() => {
      autoSyncSkillsAsync(projectRoot, { silent: output === 'capture' }).catch(() => {});
    }, SKILLS_SYNC_IDLE_DELAY_MS);
    // Don't let a pending sync hold the CLI open.
    timer.unref?.();
  }

  // The port is only knowable after the spawn — `expo start` walks past a taken one, and
  // `expo run:*` was given none — so the lock is taken alongside the subprocess and not before
  // it. `holdDevServerLockAsync` swallows every failure: a lock is a convenience, and the dev
  // server is the command.
  const startedAt = Date.now();
  let running = true;
  let port: ResolvedDevServerPort | null = null;
  const run = spawnDevServerAsync(projectRoot, args, output).finally(() => {
    running = false;
  });
  const lock = holdDevServerLockAsync(projectRoot, args, {
    since: startedAt,
    isRunning: () => running,
    // Wakes the port watch the moment the dev server is gone, so a start that fails immediately
    // is not held up waiting for a port that will never be reported.
    stopped: run.then(
      () => undefined,
      () => undefined
    ),
    // What the dev server itself said, which is the only thing a caller may claim about it.
    onResolved: (resolved) => {
      port = resolved;
    },
  });

  try {
    const result = await run;
    // Awaited here, not only in the `finally`: the lock is what resolves the port, and a caller
    // that has to report where the dev server was needs that answer to be part of the result
    // rather than to arrive after it. `holdDevServerLockAsync` never rejects.
    await lock;
    return { ...result, port };
  } finally {
    clearTimeout(timer);
    (await lock)?.release();
  }
}

/**
 * Spawn the dev server, either handing the terminal over or keeping what it printed.
 *
 * `inherit` is what a person watching gets: the bundler's own output, its keypress menu, and its
 * signals. Everything else is a run nobody is watching — an agent, a log file, CI — where the
 * output has to be *kept* instead, because a dev server that stops on a question the Expo CLI
 * asked says so on a stream that would otherwise go nowhere (llp/0010 §Needs-human protocol).
 *
 * **`ci: false` is load-bearing here, and only here.** A dev server told `CI=1` turns Metro's file
 * watcher off and serves its start-up snapshot forever, so an agent that edits a file and then asks
 * `dev:wait` whether the project compiles is answered about code that no longer exists [observed —
 * live on an SDK 57 app, 2026-08-23: a syntax error appended to a route left `dev:wait` at exit 0].
 * The prompts still fail fast without it — that half is the pipe, not the variable. See
 * {@link spawnExpoAsync}.
 */
async function spawnDevServerAsync(
  projectRoot: string,
  args: string[],
  output: SubprocessOutput
): Promise<{ exitCode: number; stdout: string; stderr: string }> {
  if (output === 'inherit') {
    return { exitCode: await runExpoAsync(projectRoot, args), stdout: '', stderr: '' };
  }

  const { result } = await spawnExpoAsync(projectRoot, args, { output, ci: false });
  if (result.spawnError) {
    throw new CommandError(
      'EXPO_CLI_NOT_FOUND',
      `Could not run the Expo CLI (${result.spawnError.code ?? result.spawnError.message}), so no dev server was started. Install Expo in the project with "npm install expo", then run this command again.`
    );
  }
  return { exitCode: result.exitCode ?? 1, stdout: result.stdout, stderr: result.stderr };
}
