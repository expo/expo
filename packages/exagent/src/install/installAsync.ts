import { checkpointBeforeAsync } from '../checkpoint/integration';
import { buildInstallFollowUps, followUpsEnabled, reportFollowUps } from '../followups';
import type { InstallImpactReport } from '../project/types';
import {
  autoSyncSkillsAsync,
  listSkillPackagesAsync,
  printSkillsForAgentAsync,
} from '../skills/skillsAsync';
import { runExpoAsync } from '../utils/expoCli';
import { reportInstallImpactAsync } from './impactReport';
import type { InstallPlan } from './resolveOptions';

/**
 * Run `expo install` as a subprocess, then report what it changed and link the skills of what it
 * installed.
 *
 * Both post-install steps run after the subprocess, never inside `@expo/cli`. They are
 * best-effort and never throw, so neither a skill problem nor an unclassifiable package can fail
 * a good install.
 *
 * @returns the exit code of the `expo install` subprocess.
 */
export async function installAsync(projectRoot: string, plan: InstallPlan): Promise<number> {
  // @ref llp/0008-guardrails.rfc.md §Summary — Checkpoints: taken before the mutating phase, so
  // `exagent undo` puts back the manifest and lockfile `expo install` is about to rewrite.
  await checkpointBeforeAsync(projectRoot, {
    label: 'exagent install',
    enabled: plan.checkpoint,
  });

  const exitCode = await runExpoAsync(projectRoot, ['install', ...plan.expoArgs]);
  if (exitCode !== 0) {
    return exitCode;
  }

  // @ref llp/0004-smart-start-and-project-state.rfc.md §Sub-features — post-install impact
  const reports = plan.impact ? await reportInstallImpactAsync(projectRoot, plan.packages) : [];

  if (plan.syncScope === 'none') {
    await reportInstallFollowUpsAsync(projectRoot, plan, reports);
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

  await reportInstallFollowUpsAsync(projectRoot, plan, reports);
  return exitCode;
}

/**
 * Say what the install left to do: rebuild or reload, and which skill to read.
 *
 * @ref llp/0009-smart-followups.rfc.md §Examples per command — `install`. The classification the
 * impact report already made is the whole input, so no probe runs twice.
 */
async function reportInstallFollowUpsAsync(
  projectRoot: string,
  plan: InstallPlan,
  reports: InstallImpactReport[]
): Promise<void> {
  if (!followUpsEnabled(plan.followups) || !reports.length) {
    return;
  }

  let packagesWithSkills: string[] = [];
  if (plan.agentSkills) {
    packagesWithSkills = await listSkillPackagesAsync(projectRoot, plan.packages);
  }

  reportFollowUps('install', buildInstallFollowUps({ reports, packagesWithSkills }));
}
