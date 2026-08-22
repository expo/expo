import { autoSyncSkillsAsync } from '../skills/skillsAsync';
import { runExpoAsync } from '../utils/expoCli';
import type { StartOptions } from './resolveOptions';

/** How long to wait after spawning `expo start` before syncing skills. */
export const SKILLS_SYNC_IDLE_DELAY_MS = 3000;

/**
 * Run `expo start` as a subprocess and sync skills a few seconds later.
 *
 * @returns the exit code of the `expo start` subprocess.
 */
export async function startAsync(projectRoot: string, options: StartOptions): Promise<number> {
  return runDevServerAsync(projectRoot, ['start', ...options.expoArgs], {
    agentSkills: options.agentSkills,
  });
}

/**
 * Run an `expo` command that starts a dev server (`start`, `run:ios`, `run:android`) and sync
 * skills a few seconds later.
 *
 * The delay keeps the dependency scan away from the first bundle, and the timer is
 * cancelled when the dev server exits first, so a failed start syncs nothing.
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

  try {
    return await runExpoAsync(projectRoot, args);
  } finally {
    clearTimeout(timer);
  }
}
