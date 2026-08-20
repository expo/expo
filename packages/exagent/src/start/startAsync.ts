import { autoSyncSkillsAsync } from '../skills/skillsAsync';
import { runExpoAsync } from '../utils/expoCli';
import type { StartPlan } from './resolveOptions';

/** How long to wait after spawning `expo start` before syncing skills. */
export const SKILLS_SYNC_IDLE_DELAY_MS = 3000;

/**
 * Run `expo start` as a subprocess and sync skills a few seconds later.
 *
 * The delay keeps the dependency scan away from the first bundle, and the timer is
 * cancelled when the dev server exits first, so a failed start syncs nothing.
 *
 * @returns the exit code of the `expo start` subprocess.
 */
export async function startAsync(projectRoot: string, plan: StartPlan): Promise<number> {
  let timer: NodeJS.Timeout | undefined;
  if (plan.agentSkills) {
    timer = setTimeout(() => {
      autoSyncSkillsAsync(projectRoot).catch(() => {});
    }, SKILLS_SYNC_IDLE_DELAY_MS);
    // Don't let a pending sync hold the CLI open.
    timer.unref?.();
  }

  try {
    return await runExpoAsync(projectRoot, ['start', ...plan.expoArgs]);
  } finally {
    clearTimeout(timer);
  }
}
