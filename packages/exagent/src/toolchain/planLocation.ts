// @ref llp/0004-smart-start-and-project-state.rfc.md §Where a build runs
// Two pure functions between the decision table and the probe: one that says what a local build of
// this plan would need, and one that folds in what the machine answered. Kept out of `decide.ts`
// because that module is a pure function of *project* state and this is a fact about the host.

import type { NativePlatform } from '../plan/types';
import type { StartPlan } from '../project/types';
import { easBuildCommand, EAS_REQUIREMENT, localRequirement, LOCAL_WHERE } from './runsOn';
import type { PlanBuildLocation, ToolchainProbe } from './types';

/**
 * What a local build of `platform` needs, before anything has looked at the machine.
 *
 * `status: null` is "nobody asked", which reads differently from the probe's own `unknown`
 * ("asked, and could not tell").
 */
export function localBuildLocation(platform: NativePlatform): PlanBuildLocation {
  return {
    runsOn: 'local',
    platform,
    requirement: localRequirement(platform),
    status: null,
    detail: null,
    caveats: [],
    alternativeCommand: easBuildCommand(platform),
  };
}

/**
 * Fold what the machine answered into the plan, as the plan's own reasons.
 *
 * The steps are never rewritten. A caller may have an answer this CLI cannot see — a toolchain on
 * a path nothing probed, a build that is going to run somewhere else — and a plan that quietly
 * swapped its steps for the cloud would stop being the plan that was approved. What changes is
 * what the plan *says*: on a machine that cannot build, the EAS route is named before anything
 * runs rather than after a build has failed halfway through.
 *
 * @returns the same plan when it builds nothing, so a caller can apply this unconditionally.
 */
export function applyToolchainProbe(plan: StartPlan, probe: ToolchainProbe): StartPlan {
  const { buildLocation } = plan;
  if (!buildLocation || buildLocation.runsOn !== 'local') {
    return plan;
  }

  const applied: PlanBuildLocation = {
    ...buildLocation,
    status: probe.status,
    detail: probe.detail,
    caveats: probe.caveats,
  };

  return {
    ...plan,
    buildLocation: applied,
    reasons: [...plan.reasons, ...toolchainReasons(applied), ...probe.caveats],
  };
}

/** The one or two sentences a plan gains from the probe, per status. */
function toolchainReasons(location: PlanBuildLocation): string[] {
  const { platform, requirement, detail, alternativeCommand } = location;
  const where = `The build in this plan runs ${LOCAL_WHERE} (local) and needs ${requirement}.`;
  const instead = `Build for ${platform} on EAS instead — "${alternativeCommand}" — which needs ${EAS_REQUIREMENT} rather than ${requirement}.`;

  switch (location.status) {
    case 'present':
      return [`${where} This machine has it: ${detail}`];
    case 'missing':
      return [`${where} This machine cannot run it: ${detail}`, instead];
    case 'unknown':
      return [
        `${where} Whether this machine has it could not be established: ${detail}`,
        `If it does not, ${lowerFirst(instead)}`,
      ];
    default:
      return [where];
  }
}

function lowerFirst(sentence: string): string {
  return sentence.charAt(0).toLowerCase() + sentence.slice(1);
}
