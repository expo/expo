// @ref llp/0004-smart-start-and-project-state.rfc.md §Where a build runs
// Where a build runs — `local` on this machine, `eas` in the cloud — and whether this machine can
// do the local one. One vocabulary (`runsOn.ts`), one probe (`detect.ts`), one pure fold into a
// plan (`planLocation.ts`).

import type { StartPlan } from '../project/types';
import { detectToolchainAsync } from './detect';
import { applyToolchainProbe } from './planLocation';

export { detectToolchainAsync, resetToolchainCache } from './detect';
export { applyToolchainProbe, localBuildLocation } from './planLocation';
export {
  describeRunsOn,
  easBuildCommand,
  localRequirement,
  EAS_DEVELOPMENT_PROFILE,
  EAS_REQUIREMENT,
  EAS_WHERE,
  LOCAL_WHERE,
  RUNS_ON_LABELS,
  type RunsOn,
} from './runsOn';
export type { PlanBuildLocation, ToolchainProbe, ToolchainStatus } from './types';

/**
 * Say whether this machine can run the build the plan contains.
 *
 * Nothing is probed for a plan that builds nothing, which is most plans: the cost of the answer is
 * only paid where there is a question. A probe never throws, so this can be applied unconditionally
 * and the plan it returns is always a plan.
 */
export async function probePlanBuildLocationAsync(plan: StartPlan): Promise<StartPlan> {
  const location = plan.buildLocation;
  if (!location || location.runsOn !== 'local') {
    return plan;
  }
  return applyToolchainProbe(plan, await detectToolchainAsync(location.platform));
}
