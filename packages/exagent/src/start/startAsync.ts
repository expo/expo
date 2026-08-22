import { holdDevServerLockAsync } from '../devLock';
import { dependsOnDevClientSync, reportFollowUps } from '../followups';
import { autoSyncSkillsAsync } from '../skills/skillsAsync';
import { runExpoAsync } from '../utils/expoCli';
import { resolveStartFollowUps } from './followUps';
import type { StartOptions } from './resolveOptions';

/** How long to wait after spawning `expo start` before syncing skills. */
export const SKILLS_SYNC_IDLE_DELAY_MS = 3000;

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
    resolveStartFollowUps(projectRoot, options, {
      expoGo: !options.expoArgs.includes('--dev-client') && !dependsOnDevClientSync(projectRoot),
      web: options.platform === 'web',
    })
  );

  return runDevServerAsync(projectRoot, ['start', ...options.expoArgs], {
    agentSkills: options.agentSkills,
  });
}

/**
 * Run an `expo` command that starts a dev server (`start`, `run:ios`, `run:android`), publish
 * where that dev server listens, and sync skills a few seconds later.
 *
 * The delay keeps the dependency scan away from the first bundle, and the timer is
 * cancelled when the dev server exits first, so a failed start syncs nothing.
 *
 * @ref llp/0004-smart-start-and-project-state.rfc.md §`exagent status` — the dev-server lock of
 * `src/devLock/` is taken here, because this is the one place that knows a dev server is starting
 * and can wait for the port it ends up on. It is held for exactly as long as the subprocess runs.
 *
 * @param args Arguments for the `expo` CLI, starting with the command name.
 * @returns the exit code of the subprocess.
 */
export async function runDevServerAsync(
  projectRoot: string,
  args: string[],
  { agentSkills }: { agentSkills: boolean }
): Promise<number> {
  let timer: NodeJS.Timeout | undefined;
  if (agentSkills) {
    timer = setTimeout(() => {
      autoSyncSkillsAsync(projectRoot).catch(() => {});
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
  const run = runExpoAsync(projectRoot, args).finally(() => {
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
  });

  try {
    return await run;
  } finally {
    clearTimeout(timer);
    (await lock)?.release();
  }
}
