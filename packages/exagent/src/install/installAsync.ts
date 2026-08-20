import { autoSyncSkillsAsync, printSkillsForAgentAsync } from '../skills/skillsAsync';
import { runExpoAsync } from '../utils/expoCli';
import type { InstallPlan } from './resolveOptions';

/**
 * Run `expo install` as a subprocess, then link the skills of what it installed.
 *
 * The sync runs after the subprocess, never inside `@expo/cli`. Both sync steps are
 * best-effort and never throw, so a skill problem cannot fail a good install.
 *
 * @returns the exit code of the `expo install` subprocess.
 */
export async function installAsync(projectRoot: string, plan: InstallPlan): Promise<number> {
  const exitCode = await runExpoAsync(projectRoot, ['install', ...plan.expoArgs]);
  if (exitCode !== 0 || plan.syncScope === 'none') {
    return exitCode;
  }

  await autoSyncSkillsAsync(
    projectRoot,
    plan.syncScope === 'packages' ? { packages: plan.packages } : {}
  );

  // Dumping skills only makes sense for a known set of new packages, so a full sync
  // (`expo install --fix`, a bare `expo install`) prints nothing.
  if (plan.skillContext && plan.syncScope === 'packages') {
    await printSkillsForAgentAsync(projectRoot, { packages: plan.packages });
  }

  return exitCode;
}
