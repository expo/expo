// @ref llp/0004-smart-start-and-project-state.rfc.md §`exagent status`
// The sections of the status report, as pure functions over facts other modules gathered. No I/O
// happens here, so every section is unit-testable without a project, a dev server, or a device.

import path from 'path';

import { decideStartPlan } from '../plan/decide';
import type { LastBuildFingerprints, NativePlatform, PlanPlatform } from '../plan/types';
import type { ProjectState } from '../project/types';
import type { DevServerProbe, DevServerSource } from '../runtime/devServer';
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

/**
 * The gate to put in front of anything that reads the app, once a dev server is up.
 *
 * One command for both the app-attached and the nothing-attached case, rather than `runtime:errors`
 * for the first: this is the only command that proves the project's own bundle *compiles*, which is
 * the fact a report full of green lines was missing. What to do once it passes is a follow-up, and
 * the `runtime-errors` follow-up already says it — `next` naming it too would be the duplication
 * that `status` keeps its follow-ups silent to avoid.
 */
const VERIFY_COMMAND = 'exagent dev:wait --require-app';

/**
 * The command to name when a dev server is up and nothing is attached to it.
 *
 * The gate above cannot be the answer there, and the reason is mechanical rather than a matter of
 * taste [observed — friction run 5, F48-8]: `--require-app` polls the dev server's debugger target
 * list, and the only thing that puts an entry in that list is an app being opened on a device.
 * Nothing was going to do that, so the suggestion was a two-minute wait with one possible ending.
 * This is the command that changes the state the wait is waiting for.
 */
const OPEN_APP_COMMAND = 'exagent navigate /';

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

/** What the dev-server section reports beyond reachability, gathered by the caller. */
export interface DevServerReadiness {
  /** Which step of discovery produced the URL. */
  source: DevServerSource;
  /** Whether the bundler has finished, or null when it could not be decided. */
  ready: boolean | null;
  /** Whether the dev server serves this project, or null when it could not be decided. */
  projectRootMatched: boolean | null;
}

/** Whether a dev server answers, how many apps are connected to it, and whether it is ready. */
export function buildDevServerStatus(
  url: string,
  probe: DevServerProbe,
  readiness: DevServerReadiness
): DevServerStatus {
  if (probe.reachable) {
    return { url, running: true, appsConnected: probe.targets.length, ...readiness };
  }
  const status: DevServerStatus = { url, running: false, appsConnected: 0, ...readiness };
  return probe.reason ? { ...status, reason: probe.reason } : status;
}

/**
 * What to do next: the decision-table row that would fire, or the verification a running dev
 * server has already made possible.
 *
 * The plan is only the next action while there is nothing to verify. A dev server that answers and
 * proved it serves this project makes `exagent dev` the wrong advice — it would start a second one,
 * three lines under a report that says the first is healthy — so the answer becomes the gate that
 * says whether the bundle and the app are actually working.
 *
 * A dev server that answered for *another* project is not this project's, so it changes nothing:
 * the plan stands, and the dev-server line is where that mismatch is reported.
 */
export function buildNextActionStatus(
  state: ProjectState,
  lastBuild: LastBuildFingerprints,
  platform: PlanPlatform,
  devServer: DevServerStatus | null
): NextActionStatus {
  const plan = decideStartPlan(state, { platform, lastBuild });
  const verify = verifyAction(devServer);
  if (verify) {
    return { ...verify, rule: plan.rule, target: plan.target, steps: [] };
  }
  return {
    command: NEXT_ACTION_COMMAND,
    rule: plan.rule,
    target: plan.target,
    steps: plan.steps,
    why: null,
  };
}

/** The command and the reason for a dev server this project can already use, or null. */
function verifyAction(devServer: DevServerStatus | null): { command: string; why: string } | null {
  if (!devServer?.running || devServer.projectRootMatched === false) {
    return null;
  }
  if (devServer.appsConnected > 0) {
    return {
      command: VERIFY_COMMAND,
      why: 'a dev server is running with an app connected, so check that its bundle builds instead of starting a second server',
    };
  }
  return {
    command: OPEN_APP_COMMAND,
    why: 'a dev server is running and no app is connected to it, so this opens one on a booted device — waiting for an app to attach would run out, because nothing else here starts one',
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
