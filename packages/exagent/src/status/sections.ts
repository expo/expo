// @ref llp/0004-smart-start-and-project-state.rfc.md §`exagent status`
// The sections of the status report, as pure functions over facts other modules gathered. No I/O
// happens here, so every section is unit-testable without a project, a dev server, or a device.

import path from 'path';

import { decideStartPlan } from '../plan/decide';
import type { LastBuildFingerprints, NativePlatform, PlanPlatform } from '../plan/types';
import type { ProjectState } from '../project/types';
import type { DevServerProbe } from '../runtime/devServer';
import type {
  DevServerStatus,
  ExpoGoStatus,
  FreshnessStatus,
  NextActionStatus,
  PlatformFreshness,
  ProjectStatus,
} from './types';

/** Platforms the freshness section reports, in print order. */
const PLATFORMS: NativePlatform[] = ['ios', 'android'];

/** How many characters of a fingerprint hash are shown, as in the plan engine. */
const HASH_DISPLAY_LENGTH = 8;

/** The command the next action names: the one that decides a plan and runs it. */
const NEXT_ACTION_COMMAND = 'exagent dev';

/** What the project is: name, SDK, and how its native side is produced. */
export function buildProjectStatus(state: ProjectState, packageName: string | null): ProjectStatus {
  const bare = state.nativeDirs.ios || state.nativeDirs.android;
  // An unnamed `package.json` still has a directory to name the project after.
  const name = packageName ?? path.basename(state.projectRoot);
  return {
    root: state.projectRoot,
    name: name || null,
    sdkVersion: state.sdkVersion,
    native: bare ? 'bare' : 'cng',
    nativeDirs: state.nativeDirs,
    usesDevClient: state.usesDevClient,
    hasWeb: state.hasWeb,
  };
}

/** The Expo Go verdict, as a count. The reasons themselves ride along in `probe`. */
export function buildExpoGoStatus(state: ProjectState): ExpoGoStatus {
  return { compatible: state.expoGo.compatible, reasonCount: state.expoGo.reasons.length };
}

/**
 * Compare the project fingerprint against the builds `exagent` recorded, per platform.
 *
 * Unlike the plan engine, which only needs "can a match be proven", status separates the two
 * ways a match cannot be proven: `stale` (compared, and different) and `unknown` (nothing to
 * compare, because no fingerprint tool answered).
 */
export function buildFreshnessStatus(
  state: ProjectState,
  lastBuild: LastBuildFingerprints
): FreshnessStatus {
  const { hash, error } = state.fingerprint;
  const platforms = PLATFORMS.map((platform) =>
    platformFreshness(platform, hash, lastBuild[platform] ?? null)
  );
  return error ? { hash, error, platforms } : { hash, platforms };
}

function platformFreshness(
  platform: NativePlatform,
  hash: string | null,
  recordedHash: string | null
): PlatformFreshness {
  if (hash == null) {
    return { platform, state: 'unknown', detail: 'no fingerprint tool', recordedHash };
  }
  if (recordedHash == null) {
    return { platform, state: 'stale', detail: 'no recorded build', recordedHash };
  }
  if (recordedHash !== hash) {
    return {
      platform,
      state: 'stale',
      detail: `changed since ${shortHash(recordedHash)}`,
      recordedHash,
    };
  }
  return { platform, state: 'fresh', detail: `matches ${shortHash(hash)}`, recordedHash };
}

/** Whether a dev server answers, and how many apps are connected to it. */
export function buildDevServerStatus(url: string, probe: DevServerProbe): DevServerStatus {
  if (probe.reachable) {
    return { url, running: true, appsConnected: probe.targets.length };
  }
  const status: DevServerStatus = { url, running: false, appsConnected: 0 };
  return probe.reason ? { ...status, reason: probe.reason } : status;
}

/** The decision-table row that would fire, and the steps it would run. */
export function buildNextActionStatus(
  state: ProjectState,
  lastBuild: LastBuildFingerprints,
  platform: PlanPlatform
): NextActionStatus {
  const plan = decideStartPlan(state, { platform, lastBuild });
  return {
    command: NEXT_ACTION_COMMAND,
    rule: plan.rule,
    target: plan.target,
    steps: plan.steps,
  };
}

/**
 * The platform the next action targets when the command line names none.
 *
 * Mirrors the default of `exagent dev` (see `resolveDefaultPlatform` in
 * `../dev/devAsync.ts`), so status reports the plan that command would run: a single
 * checked-in native directory is the project's own answer, otherwise only macOS can build for iOS.
 */
export function resolveDefaultPlatform(state: ProjectState): PlanPlatform {
  const { ios, android } = state.nativeDirs;
  if (ios !== android) {
    return ios ? 'ios' : 'android';
  }
  return process.platform === 'darwin' ? 'ios' : 'android';
}

function shortHash(hash: string): string {
  return hash.slice(0, HASH_DISPLAY_LENGTH);
}
