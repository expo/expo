// @ref llp/0004-smart-start-and-project-state.rfc.md §`exagent status`
// The sections of the status report, as pure functions over facts other modules gathered. No I/O
// happens here, so every section is unit-testable without a project, a dev server, or a device.

import path from 'path';

import { isTunnelCurrent, type DevServerReach } from '../dev/advertisedUrl';
import type { LocalDeviceProbe } from '../device/localDevice';
import { resolveLanHost } from '../followups/network';
import { buildConnectUrls, openInPhrase } from '../navigate/connectUrl';
import { decideExpoGoTarget } from '../navigate/target';
import { decideStartPlan } from '../plan/decide';
import type { LastBuildFingerprints, NativePlatform, PlanPlatform } from '../plan/types';
import type { ProjectState } from '../project/types';
import type { DevServerProbe, DevServerSource } from '../runtime/devServer';
import type {
  DevServerStatus,
  ExpoGoStatus,
  FreshnessStatus,
  LocalDeviceStatus,
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

/**
 * The command to name when there is no local device to open the app on and no URL to hand over.
 *
 * It resolves the URL the way `navigate` would — the scheme of a development build, the Expo Go
 * host, the tunnel — and opens nothing, which is the only part of `navigate` that needs a device.
 */
const PRINT_URL_COMMAND = 'exagent navigate / --print-url';

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

/**
 * Whether a dev server answers, how many apps are connected to it, whether it is ready, and where
 * a device off this machine can reach it.
 *
 * The last of those is read from what the dev server printed rather than from the URL it listens
 * on, and the two can differ by the whole point: a tunnelled run listens on `127.0.0.1` and is
 * reachable at `<session>.boltexpo.dev`, and only the second is an address a phone or a cloud
 * simulator can use.
 */
export function buildDevServerStatus(
  url: string,
  probe: DevServerProbe,
  readiness: DevServerReadiness,
  reach: DevServerReach | null = null
): DevServerStatus {
  const running = probe.reachable;
  // A tunnel URL is reported only while every part of it holds — see `isTunnelCurrent`. A dev
  // server that is down cannot be reached at its tunnel either, whatever the log still says.
  const tunnelUrl =
    reach && running && isTunnelCurrent({ ...reach, running: true })
      ? (reach.advertised?.url ?? null)
      : null;

  const status: DevServerStatus = {
    url,
    running,
    appsConnected: running ? probe.targets.length : 0,
    ...readiness,
    hostType: reach?.advertised?.hostType ?? null,
    tunnelUrl,
  };
  return running || !probe.reason ? status : { ...status, reason: probe.reason };
}

/** The device section: what this machine has to open an app on. */
export function buildLocalDeviceStatus(probe: LocalDeviceProbe): LocalDeviceStatus {
  return {
    state: probe.state,
    platform: probe.device?.platform ?? null,
    deviceId: probe.device?.deviceId ?? null,
    name: probe.device?.name ?? null,
    reason: probe.reason,
  };
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
  devServer: DevServerStatus | null,
  device: LocalDeviceStatus | null = null,
  scheme: string | null = null
): NextActionStatus {
  const plan = decideStartPlan(state, { platform, lastBuild });
  const verify = verifyAction(devServer, device, state, scheme);
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
function verifyAction(
  devServer: DevServerStatus | null,
  device: LocalDeviceStatus | null,
  state: ProjectState,
  scheme: string | null
): { command: string; why: string } | null {
  if (!devServer?.running || devServer.projectRootMatched === false) {
    return null;
  }
  if (devServer.appsConnected > 0) {
    return {
      command: VERIFY_COMMAND,
      why: 'a dev server is running with an app connected, so check that its bundle builds instead of starting a second server',
    };
  }

  // @ref llp/0009-smart-followups.rfc.md §Device-aware ladders
  // `navigate` drives a **local** simulator or an attached device, and a machine with neither has
  // been told to run it for as long as this line has existed. On the run that found this, the
  // device was a *cloud* simulator reached over a tunnel, so the useful answer is not a command at
  // all: it is the URL something else opens [observed — 2026-08-24].
  //
  // `absent` only, never `unknown`: a probe that could not run establishes nothing, and turning a
  // working suggestion off on the strength of a missing `adb` would be the same mistake backwards.
  if (device?.state === 'absent') {
    return noLocalDeviceAction(devServer, state, scheme);
  }

  return {
    command: OPEN_APP_COMMAND,
    why: 'a dev server is running and no app is connected to it, so this opens one on a booted device — waiting for an app to attach would run out, because nothing else here starts one',
  };
}

/**
 * What to do when a dev server is up, nothing is attached, and this machine has no device.
 *
 * The answer is an **address** rather than a command whenever one can be named, because the thing
 * that has to happen next happens somewhere else. Which address depends on the application, and
 * they are not interchangeable: `exp://<host>` is the Expo Go form, and a development build takes
 * its own scheme (`<scheme>://expo-development-client/?url=…`). When nothing established which of
 * the two is running, this line names neither — one line cannot carry a labelled pair, so it names
 * the command that prints both [decided — Kudo, 2026-08-26].
 */
function noLocalDeviceAction(
  devServer: DevServerStatus,
  state: ProjectState,
  scheme: string | null
): { command: string; why: string } {
  const noDevice =
    'no dev server client is attached and this machine has no booted simulator or attached device, so nothing here can open the app';

  const target = decideExpoGoTarget({
    // Zero apps are connected — that is the branch this is in — so the dev server has nothing to
    // say about which app it would be.
    targetAppIds: [],
    hasNativeDirs: state.nativeDirs.ios || state.nativeDirs.android,
    usesDevClient: state.usesDevClient,
  });

  const tunnelHost = devServer.tunnelUrl ? hostOf(devServer.tunnelUrl) : null;
  const connect = buildConnectUrls({
    host: tunnelHost ?? lanHostForPort(portOf(devServer.url)),
    hostType: tunnelHost ? 'tunnel' : 'lan',
    scheme,
    isExpoGo: target.isExpoGo,
    certain: target.certain,
  });

  if (connect.length === 1) {
    const [only] = connect;
    return {
      command: only!.url,
      why: `${noDevice} — open this URL in ${openInPhrase(only!.target)} on your device or cloud simulator instead${
        tunnelHost
          ? ' (it is the tunnel host, which is reachable from any network)'
          : ' (it is this host on the local network, so the device has to be on it; restart with --tunnel for one that is not)'
      }`,
    };
  }

  return {
    command: PRINT_URL_COMMAND,
    why: `${noDevice} — this prints the URL to open elsewhere, without looking for a device${
      connect.length > 1
        ? ', and it prints one per app because nothing established whether Expo Go or a development build is running'
        : ', because this host reports no address a device could use'
    }`,
  };
}

function hostOf(url: string): string | null {
  try {
    return new URL(url).host || null;
  } catch {
    return null;
  }
}

function portOf(url: string): number | null {
  try {
    const port = Number(new URL(url).port);
    return Number.isInteger(port) && port > 0 ? port : null;
  } catch {
    return null;
  }
}

/** `<lan ip>:<port>`, or null when this host has no LAN address or the port is unknown. */
function lanHostForPort(port: number | null): string | null {
  if (port == null) {
    return null;
  }
  const host = resolveLanHost();
  return host ? `${host}:${port}` : null;
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
