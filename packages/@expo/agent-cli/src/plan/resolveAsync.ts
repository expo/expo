// @ref llp/0015-backend-selection-and-config.rfc.md §The selection
// The one place a plan is made from everything outside the project: the developer's config, the
// flags they typed, this host, and what the toolchain probe found. Everything it calls is pure
// except the probe and two file reads, and it is the only module that knows the order they go in.

import { easJsonExistsSync } from '../followups/projectFiles';
import type { ProjectState, StartPlan } from '../project/types';
import { readAgentCliSettings, settingsBuildBackend } from '../settings';
import type { BuildBackend, RunTarget } from '../settings/types';
import { applyToolchainProbe, detectToolchainAsync } from '../toolchain';
import { selectBuildBackend } from '../toolchain/selectBackend';
import type { ToolchainProbe } from '../toolchain/types';
import { decideStartPlan } from './decide';
import { selectRunTarget } from './runTarget';
import type { DecideStartPlanOptions } from './types';

export interface ResolveStartPlanOptions extends DecideStartPlanOptions {
  /** Where a flag on this command line asked the build to run, or null when none did. */
  requestedBackend?: BuildBackend | null;
  /** Which app a flag on this command line asked for, or null when none did. */
  requestedTarget?: RunTarget | null;
  /** `process.platform`. Injected so the selection can be exercised for other hosts. */
  hostPlatform?: NodeJS.Platform;
}

/**
 * Decide the plan, backend and all.
 *
 * The table is run **twice**, and deliberately: the first pass is what tells us whether this
 * project needs a native build at all and for which platform, and only a plan with a build in it
 * has a backend question to answer. Both passes are pure functions with no I/O, so the second one
 * costs nothing measurable — and paying for it keeps `decideStartPlan` a function of *project*
 * state, with the host and the config staying the caller's business (llp/0004 §Where a build runs).
 *
 * The probe is skipped entirely when the answer cannot change anything: a caller who asked for the
 * cloud is not made to wait on two subprocesses that ask about this machine's Xcode.
 */
export async function resolveStartPlanAsync(
  projectRoot: string,
  state: ProjectState,
  options: ResolveStartPlanOptions = {}
): Promise<StartPlan> {
  const { requestedBackend = null, requestedTarget = null, hostPlatform, ...planOptions } = options;

  const { settings } = readAgentCliSettings(projectRoot);
  const runTarget = selectRunTarget({
    requested: requestedTarget,
    configured: settings.target,
  });

  const draft = decideStartPlan(state, { ...planOptions, runTarget });
  if (!draft.buildLocation) {
    // Nothing to build, so nothing to choose and nothing to probe. Most plans end here.
    return draft;
  }

  const { platform } = draft.buildLocation;
  const configured = settingsBuildBackend(settings, platform);
  const explicit = requestedBackend ?? configured;
  const probe: ToolchainProbe | null =
    explicit === 'eas' ? null : await detectToolchainAsync(platform);

  const buildBackend = selectBuildBackend({
    platform,
    hostPlatform: hostPlatform ?? process.platform,
    requested: requestedBackend,
    configured,
    probe,
  });

  const plan = decideStartPlan(state, {
    ...planOptions,
    runTarget,
    buildBackend,
    easJson: buildBackend.runsOn === 'eas' ? easJsonExistsSync(projectRoot) : undefined,
  });

  // The probe's caveats — an SDK the tooling finds and a tool of it the shell does not — belong to
  // a plan that still builds here. A plan that moved to the cloud has no use for them.
  return plan.buildLocation?.runsOn === 'local' && probe ? applyToolchainProbe(plan, probe) : plan;
}
