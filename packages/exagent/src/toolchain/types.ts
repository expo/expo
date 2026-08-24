// @ref llp/0004-smart-start-and-project-state.rfc.md §Where a build runs
// What a probe of this machine's build toolchain amounts to. Pure data: `detect.ts` is the only
// module that looks at the disk, and everything downstream reads this.

import type { NativePlatform } from '../plan/types';
import type { RunsOn } from './runsOn';

/**
 * What the probe established about one platform's local toolchain.
 *
 * `unknown` is a value of its own and never collapses into `missing`. A probe that could not run —
 * a spawn the sandbox refused, a directory that could not be read — has shown nothing about the
 * machine, and a plan that treated that as "you have no Xcode" would route a caller to the cloud
 * over a tool sitting on the disk.
 */
export type ToolchainStatus = 'present' | 'missing' | 'unknown';

export interface ToolchainProbe {
  platform: NativePlatform;
  status: ToolchainStatus;
  /** What this machine has, or what it does not, in one sentence. */
  detail: string;
  /**
   * What a local build of this platform needs, spelled the way every other surface spells it.
   *
   * @see ./runsOn.ts `localRequirement`
   */
  requirement: string;
  /**
   * Findings that do not change the status and do change what happens next — an SDK the tooling
   * will find and a tool of it that the shell will not, for instance.
   */
  caveats: string[];
}

/**
 * What a plan says about the build it contains: where it runs, what that place needs, and — for a
 * local build — whether this machine can do it.
 *
 * Attached to the plan rather than derived by each reader, because the plan is what a driving agent
 * approves and the whole point is that it says this before anything runs.
 */
export interface PlanBuildLocation {
  runsOn: RunsOn;
  platform: NativePlatform;
  requirement: string;
  /** `null` when nothing probed the machine, which is not the same as `unknown`. */
  status: ToolchainStatus | null;
  /** What the probe found, or null when none ran. */
  detail: string | null;
  caveats: string[];
  /** The build that runs somewhere else, ready to paste. Null when this build already runs there. */
  alternativeCommand: string | null;
}
