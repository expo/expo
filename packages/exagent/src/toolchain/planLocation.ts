// @ref llp/0004-smart-start-and-project-state.rfc.md §Where a build runs
// Two pure functions between the decision table and the probe: one that says what a local build of
// this plan would need, and one that folds in what the machine answered. Kept out of `decide.ts`
// because that module is a pure function of *project* state and this is a fact about the host.

import type { NativePlatform } from '../plan/types';
import type { StartPlan } from '../project/types';
import {
  easBuildCommand,
  localRequirement,
  localTool,
  EAS_REQUIREMENT,
  EAS_WHERE,
  LOCAL_WHERE,
} from './runsOn';
import type { BuildBackendChoice } from './selectBackend';
import type { PlanBuildLocation, ToolchainProbe } from './types';

/**
 * What a local build of `platform` needs, before anything has looked at the machine.
 *
 * `status: null` is "nobody asked", which reads differently from the probe's own `unknown`
 * ("asked, and could not tell").
 */
export function localBuildLocation(
  platform: NativePlatform,
  selection: BuildBackendChoice | null = null
): PlanBuildLocation {
  return {
    runsOn: 'local',
    platform,
    requirement: localRequirement(platform),
    status: null,
    detail: null,
    caveats: [],
    alternativeCommand: easBuildCommand(platform),
    selection,
  };
}

/**
 * What the cloud build of `platform` needs, and what chose it.
 *
 * The mirror of {@link localBuildLocation}, and `status` stays `null` on purpose: it is the answer
 * to "does *this machine* have the toolchain", and a build that runs in a data centre does not ask
 * that question. Why the plan is here at all is in {@link BuildBackendChoice.why}, which every
 * surface prints. The alternative is the local build, spelled the way `dev` spells it.
 */
export function easBuildLocation(
  platform: NativePlatform,
  selection: BuildBackendChoice | null = null
): PlanBuildLocation {
  return {
    runsOn: 'eas',
    platform,
    requirement: EAS_REQUIREMENT,
    status: null,
    detail: null,
    caveats: [],
    alternativeCommand: `npx expo run:${platform}`,
    selection,
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

  // A plan that already chose its backend has said all of this once, in the selection's own
  // sentence, which `decideStartPlan` put in the reasons — repeating it here would print the same
  // fact twice in the same list. The one exception is a toolchain the probe found **missing**:
  // with a selection in hand that state is only reachable because a flag or the config asked to
  // build here anyway, and "this machine does not have it, and here is what does work" is the
  // sentence that caller most needs. The caveats are always worth adding: they are the findings
  // that did *not* decide anything and do change what happens next.
  const reasons =
    !buildLocation.selection || applied.status === 'missing' ? toolchainReasons(applied) : [];

  return {
    ...plan,
    buildLocation: applied,
    reasons: [...plan.reasons, ...reasons, ...probe.caveats],
  };
}

/** The one or two sentences a plan gains from the probe, per status. */
function toolchainReasons(location: PlanBuildLocation): string[] {
  const { platform, detail, alternativeCommand } = location;
  // The bare tool name, because the sentence already says where: "needs Xcode on this machine on
  // this machine" is what the requirement string produces when it is dropped in here.
  const tool = localTool(platform);
  const where = `The build in this plan runs ${LOCAL_WHERE} (local) and needs ${tool}.`;
  const instead = `Build for ${platform} ${EAS_WHERE} instead — "${alternativeCommand}" — which needs ${EAS_REQUIREMENT} rather than ${tool}.`;

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
