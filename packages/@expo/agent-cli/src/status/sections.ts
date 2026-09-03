// @ref llp/0004-smart-start-and-project-state.rfc.md §Status
// The sections of the status report, as pure functions over facts other modules gathered. No I/O
// happens here, so every section is unit-testable without a project, a dev server, or a device.

import path from 'path';

import { isTunnelCurrent, type DevServerReach } from '../dev/advertisedUrl';
import type { LocalDeviceProbe } from '../device/localDevice';
import { resolveLanHost } from '../followups/network';
import { classifyAgainstRecordedBuild, type RecordedImpact } from '../impact/fromRecord';
import { buildConnectUrls, openInPhrase, type ConnectUrl } from '../navigate/connectUrl';
import { decideExpoGoTarget } from '../navigate/target';
import { decideStartPlan } from '../plan/decide';
import type { LastBuildRecord } from '../plan/lastBuild';
import type { LastBuildFingerprints, NativePlatform, PlanPlatform } from '../plan/types';
import { PROGRAM_NAME, PROGRAM_PREFIX } from '../programName';
import { decidesAgainstExpoGo } from '../project/expoGo';
import type { FingerprintResult } from '../project/fingerprint';
import type { ProjectState, StartPlan } from '../project/types';
import type { DevServerProbe, DevServerSource } from '../runtime/devServer';
import type {
  BuildsStatus,
  DevServerStatus,
  ExpoGoStatus,
  FingerprintHashSource,
  FreshnessComparison,
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

/**
 * The command the next action names: the one that decides a plan and runs it.
 *
 * @ref llp/0024-cli-ui.rfc.md §The template
 * Written `npx @expo/agent-cli …`, like every other command this CLI hands a caller — a `Try:` line, a
 * follow-up, an example in a `--help`. It used to be the bare `@expo/agent-cli dev`, which is the one
 * spelling that is not runnable: nothing puts `@expo/agent-cli` on the PATH of a project that installed it
 * [found by the wave-34 naive-agent walk]. `src/status/format.ts` rewrites it for the runner in use
 * as it prints, so a Bun project reads `bunx @expo/agent-cli dev`; the `--json` value stays as written,
 * exactly as a follow-up's does.
 */
const NEXT_ACTION_COMMAND = `${PROGRAM_PREFIX} dev`;

/**
 * The command the next action names when this directory is not an Expo app.
 *
 * The safe one of the three recoveries `NOT_EXPO_APP` spells out: creating an app changes nothing
 * that is already here, where adding Expo to this package would write into a repository the caller
 * most likely only walked past (llp/0004-smart-start-and-project-state.rfc.md §Not an Expo app).
 */
const NOT_AN_APP_COMMAND = `${PROGRAM_PREFIX} new my-app`;

/**
 * The gate to put in front of anything that reads the app, once a dev server is up.
 *
 * One command for both the app-attached and the nothing-attached case, rather than `runtime:errors`
 * for the first: this is the only command that proves the project's own bundle *compiles*, which is
 * the fact a report full of green lines was missing. What to do once it passes is a follow-up, and
 * the `runtime-errors` follow-up already says it — `next` naming it too would be the duplication
 * that `status` keeps its follow-ups silent to avoid.
 */
const VERIFY_COMMAND = `${PROGRAM_PREFIX} smoke`;

/**
 * The command to name when a dev server is up and nothing is attached to it.
 *
 * The gate above cannot be the answer there, and the reason is mechanical rather than a matter of
 * taste [observed — friction run 5, F48-8]: `--require-app` polls the dev server's debugger target
 * list, and the only thing that puts an entry in that list is an app being opened on a device.
 * Nothing was going to do that, so the suggestion was a two-minute wait with one possible ending.
 * This is the command that changes the state the wait is waiting for.
 */
const OPEN_APP_COMMAND = `${PROGRAM_PREFIX} navigate /`;

/**
 * The command to name when there is no local device to open the app on and no URL to hand over.
 *
 * It resolves the URL the way `navigate` would — the scheme of a development build, the Expo Go
 * host, the tunnel — and opens nothing, which is the only part of `navigate` that needs a device.
 */
const PRINT_URL_COMMAND = `${PROGRAM_PREFIX} navigate / --print-url`;

/** What the project is: name, SDK, and how its native side is produced. */
export function buildProjectStatus(state: ProjectState, packageName: string | null): ProjectStatus {
  const bare = state.nativeDirs.ios || state.nativeDirs.android;
  // An unnamed `package.json` still has a directory to name the project after.
  const name = packageName ?? path.basename(state.projectRoot);
  return {
    root: state.projectRoot,
    name: name || null,
    isExpoApp: state.isExpoApp,
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
 * Compare the project fingerprint against the builds `@expo/agent-cli` recorded, per platform.
 *
 * Unlike the plan engine, which only needs "can a match be proven", status separates the two
 * ways a match cannot be proven: `stale` (compared, and different) and `unknown` (nothing to
 * compare, because no fingerprint tool answered).
 */
export function buildFreshnessStatus(
  state: ProjectState,
  lastBuild: LastBuildFingerprints,
  /**
   * The whole record, which carries the sources a hash alone cannot.
   *
   * @ref llp/0004-smart-start-and-project-state.rfc.md §Status
   * This is what turns `stale` from a fact into an answer: the probe already computed the working
   * tree's sources to get its hash, the record already holds the ones the last build was made
   * from, and the diff between two lists in memory costs nothing. Optional so the section stays
   * testable from hashes alone; a caller that passes nothing gets freshness with no headline.
   */
  record: LastBuildRecord = {},
  /** Whether the caller asked for the per-source list (`--explain`). */
  { explain = false }: { explain?: boolean } = {}
): FreshnessStatus {
  const { hash, error } = state.fingerprint;
  // Backend × platform, in print order: this project's own record first, because it is the axis
  // that costs nothing, then the EAS axis, which starts as "not asked" and is filled in by
  // {@link applyEasFreshness} once the build lookup has run (K7).
  const platforms = PLATFORMS.flatMap((platform) => [
    platformFreshness(
      platform,
      hash,
      lastBuild[platform] ?? null,
      hash == null
        ? null
        : classifyAgainstRecordedBuild(platform, record[platform] ?? null, state.fingerprint),
      explain
    ),
    unaskedEasFreshness(platform),
  ]);
  // The base every headline above was measured against. `--build <id>` replaces it in the caller,
  // which is also where the network call that would need lives.
  const comparison: FreshnessComparison = {
    kind: 'last-build',
    label: `last build recorded by ${PROGRAM_NAME}`,
    buildId: null,
    // No `--build` was passed, so there is no build whose platform this could be about.
    platform: null,
  };
  // `ota` and `changedFiles` are filled in by the caller: one costs a subprocess, and the other is
  // only read when the fingerprint said the native surface did not move.
  const rest = {
    platforms,
    comparison,
    changedFiles: null,
    ota: null,
    hashSource: fingerprintHashSource(state.fingerprint),
  };
  return error ? { hash, error, ...rest } : { hash, ...rest };
}

/**
 * Where the probe's hash came from, in the shape the report carries.
 *
 * @ref llp/0023-fingerprint-caching.rfc.md §The report says where the answer came from
 * Read off the fingerprint result rather than inferred from the flags: whether a cache answered is
 * something only the call that asked knows, and a report that guessed would sometimes claim a
 * measurement it did not take (llp/0021).
 */
export function fingerprintHashSource(
  fingerprint: Pick<
    FingerprintResult,
    'source' | 'revalidatedAgainst' | 'keyKind' | 'computedAt' | 'ageMs' | 'cacheCaveats'
  >
): FingerprintHashSource {
  return {
    source: fingerprint.source ?? null,
    revalidatedAgainst: fingerprint.revalidatedAgainst ?? null,
    keyKind: fingerprint.keyKind ?? null,
    computedAt: fingerprint.computedAt ?? null,
    ageMs: fingerprint.ageMs ?? null,
    caveats: fingerprint.source === 'cache' ? (fingerprint.cacheCaveats ?? []) : [],
  };
}

function platformFreshness(
  platform: NativePlatform,
  hash: string | null,
  recordedHash: string | null,
  impact: RecordedImpact | null,
  explain: boolean
): PlatformFreshness {
  const headline = impact
    ? {
        class: impact.class,
        fingerprintChanged: impact.fingerprintChanged,
        reason: impact.reason,
        changedCount: impact.changedCount,
        changedSources: explain ? impact.changedSources : null,
      }
    : null;
  const base = {
    platform,
    backend: 'local' as const,
    recordedHash,
    buildId: null,
    buildProfile: null,
    impact: headline,
  };

  if (hash == null) {
    return { ...base, state: 'unknown', detail: 'no fingerprint tool' };
  }
  if (recordedHash == null) {
    return { ...base, state: 'stale', detail: 'no recorded build' };
  }
  if (recordedHash !== hash) {
    return { ...base, state: 'stale', detail: `changed since ${shortHash(recordedHash)}` };
  }
  return { ...base, state: 'fresh', detail: `matches ${shortHash(hash)}` };
}

/**
 * The EAS axis of a platform before anything has asked EAS.
 *
 * `unknown`, never `stale`: the whole finding is that "this machine has no record of a build" was
 * being reported as the answer to a question about EAS (K7). A default run does not pay for the
 * lookup, and saying so is cheaper and truer than either verdict.
 */
function unaskedEasFreshness(platform: NativePlatform): PlatformFreshness {
  return {
    platform,
    backend: 'eas',
    state: 'unknown',
    detail: 'EAS was not asked — pass --explain',
    recordedHash: null,
    buildId: null,
    buildProfile: null,
    impact: null,
  };
}

/**
 * Fold the EAS build lookup into the freshness section's `eas` axis.
 *
 * One source of truth and no second network call: `readEasBuildsStatusAsync` already asked EAS
 * whether it has a finished build for **this exact fingerprint** (that hash is the lookup key), so a
 * `found` is the definition of fresh on this axis — including the development-simulator build that
 * the old report called `stale (no recorded build)` [K7(b)].
 *
 * Mutates in place, like the other two folds in `statusAsync`, and never touches an entry a
 * `--build <id>` comparison has already claimed: an answer the caller asked for by name outranks
 * one this CLI went looking for.
 *
 * @ref llp/0021-honest-reports.rfc.md §The rules
 */
export function applyEasFreshness(freshness: FreshnessStatus, builds: BuildsStatus | null): void {
  if (!builds) {
    return;
  }
  for (const entry of freshness.platforms) {
    if (entry.backend !== 'eas' || entry.impact != null || entry.buildId != null) {
      continue;
    }
    const lookup = builds.platforms.find((one) => one.platform === entry.platform);
    if (!lookup) {
      continue;
    }
    if (lookup.state === 'found') {
      entry.state = 'fresh';
      entry.buildId = lookup.buildId;
      entry.buildProfile = lookup.buildProfile;
      entry.detail = [
        lookup.buildProfile ? `${lookup.buildProfile} build` : 'a finished build',
        lookup.buildId ? shortHash(lookup.buildId) : null,
        'matches this fingerprint',
      ]
        .filter(Boolean)
        .join(' ');
      continue;
    }
    if (lookup.state === 'none') {
      entry.state = 'stale';
      entry.detail = 'EAS has no finished build for this fingerprint';
      continue;
    }
    entry.state = 'unknown';
    entry.detail = lookup.reason ?? 'EAS could not be asked';
  }
}

/**
 * The freshness of a platform across both axes: the **freshest** answer wins.
 *
 * The question every caller of this actually has is "does this platform need a native build", and a
 * finished build that matches answers it whichever place the build is [K7(b)]. `fresh` beats
 * `stale` beats `unknown`, and the entry is returned rather than the state so a caller can say
 * *which* axis answered — a report that said `fresh` without naming the backend would have traded
 * one confusion for another.
 */
export function effectivePlatformFreshness(
  freshness: FreshnessStatus | null,
  platform: NativePlatform
): PlatformFreshness | null {
  const entries = (freshness?.platforms ?? []).filter((entry) => entry.platform === platform);
  if (!entries.length) {
    return null;
  }
  const rank = (state: PlatformFreshness['state']) =>
    state === 'fresh' ? 2 : state === 'stale' ? 1 : 0;
  return entries.reduce((best, entry) => (rank(entry.state) > rank(best.state) ? entry : best));
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
  /**
   * What a liveness probe of the listed targets found, when one was run.
   *
   * Optional so the pure section stays testable without a socket; a caller that skips it gets the
   * old behaviour — the listing counted as connected — and says so by having nothing to report.
   */
  liveness?: { live: number; stale: number },
  reach: DevServerReach | null = null
): DevServerStatus {
  const running = probe.reachable;
  // A tunnel URL is reported only while both parts hold — see `isTunnelCurrent`. A dev server that
  // is down cannot be reached at its tunnel either, whatever the log still says.
  const tunnelUrl =
    reach && running && isTunnelCurrent({ ...reach, running: true })
      ? (reach.advertised?.url ?? null)
      : null;
  const reachFields = {
    hostType: reach?.advertised?.hostType ?? null,
    tunnelUrl,
    // Filled in by {@link applyOpenUrls} once the project's own state and scheme are known: this
    // section is built from a probe that runs before them (K7(c)).
    openUrls: [],
  };

  if (running) {
    return {
      url,
      running: true,
      appsConnected: liveness?.live ?? probe.targets.length,
      appsListed: probe.targets.length,
      appsStale: liveness?.stale ?? 0,
      ...readiness,
      ...reachFields,
    };
  }
  const status: DevServerStatus = {
    url,
    running: false,
    appsConnected: 0,
    appsListed: 0,
    appsStale: 0,
    ...readiness,
    ...reachFields,
  };
  return probe.reason ? { ...status, reason: probe.reason } : status;
}

/**
 * Every URL that points an app at this dev server, as a device would use it.
 *
 * One resolver for the two places that need it — the `openUrls` of the dev-server section and the
 * address the next action hands over — so a reader can never be given two different strings for the
 * same thing. The tunnel host wins over the LAN address, because a tunnel is the one that works
 * from anywhere.
 */
function resolveConnectUrls(
  devServer: Pick<DevServerStatus, 'url' | 'tunnelUrl'>,
  state: ProjectState,
  scheme: string | null,
  { targetAppIds = [] }: { targetAppIds?: string[] } = {}
): ConnectUrl[] {
  const target = decideExpoGoTarget({
    targetAppIds,
    hasNativeDirs: state.nativeDirs.ios || state.nativeDirs.android,
    usesDevClient: state.usesDevClient,
    // Free here: the probe already answered it, and this is the same fact the `expo go` row of this
    // very report prints. A connect URL for Expo Go printed under "expo go not compatible" is this
    // report arguing with itself (llp/0021 §The rules).
    expoGoCompatible: decidesAgainstExpoGo(state.expoGo),
  });
  const tunnelHost = devServer.tunnelUrl ? hostOf(devServer.tunnelUrl) : null;
  return buildConnectUrls({
    host: tunnelHost ?? lanHostForPort(portOf(devServer.url)),
    hostType: tunnelHost ? 'tunnel' : 'lan',
    scheme,
    isExpoGo: target.isExpoGo,
    certain: target.certain,
  });
}

/**
 * Fill in the URLs that open this project's app on a device, once the project is known.
 *
 * @ref llp/0021-honest-reports.rfc.md §The rules
 * The **encoded** launcher URL, which is what a development build needs and what the line a
 * tunnelled `expo start` prints for itself is not [K7(c), K8]. Mutates in place, like the other
 * folds in `statusAsync`: the dev-server probe runs before the project probe, and threading the
 * project through it would make the probe wait for something it does not use.
 */
export function applyOpenUrls(
  devServer: DevServerStatus | null,
  state: ProjectState,
  scheme: string | null
): void {
  if (!devServer?.running) {
    return;
  }
  devServer.openUrls = resolveConnectUrls(devServer, state, scheme);
}

/** The device section: what this machine has to open an app on. */
export function buildLocalDeviceStatus(probe: LocalDeviceProbe): LocalDeviceStatus {
  return {
    state: probe.state,
    platform: probe.device?.platform ?? null,
    deviceId: probe.device?.deviceId ?? null,
    name: probe.device?.name ?? null,
    // Every one of them (F106). The singular fields above stay the first, because the ladders in
    // this report branch on them and a device is a device; what was missing was the *report*.
    devices: probe.devices.map((device) => ({
      platform: device.platform,
      deviceId: device.deviceId,
      name: device.name ?? null,
    })),
    reason: probe.reason,
  };
}

/**
 * What to do next: the decision-table row that would fire, or the verification a running dev
 * server has already made possible.
 *
 * The plan is only the next action while there is nothing to verify. A dev server that answers and
 * proved it serves this project makes `@expo/agent-cli dev` the wrong advice — it would start a second one,
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
  scheme: string | null = null,
  /**
   * Whether this project has an EAS Simulator session on record.
   *
   * One `stat` of `.env.eas-simulator`, taken by the caller: `status` promises to be instant, so
   * whether the session is still *running* — which costs an `eas` start-up — is not asked here. A
   * file that names a dead session costs one `navigate --cloud` that says so, which is a far
   * cheaper wrong answer than a slow report.
   *
   * @see llp/0005-runtime-loop-tools.rfc.md §Cloud simulator
   */
  cloudSession: boolean = false,
  /**
   * The plan `@expo/agent-cli dev` would make here, backend and all.
   *
   * Passed in by `statusAsync`, which resolves it the way `dev` does — the developer's config,
   * this host, the toolchain probe — so the two commands never disagree about what would happen
   * next (llp/0015 §What `status` reports). `null` falls back to the plan this project's state
   * alone implies, which is what a caller with nothing to probe means.
   */
  resolvedPlan: StartPlan | null = null
): NextActionStatus {
  const plan = resolvedPlan ?? decideStartPlan(state, { platform, lastBuild });
  // @ref llp/0004-smart-start-and-project-state.rfc.md §Not an Expo app
  // Above the verify branch, because it outranks every reason to name a command at all: a
  // directory that is not an Expo app has nothing to put on a device and nothing to verify, and
  // `@expo/agent-cli dev` here is the very trap this report would otherwise send the reader into.
  if (!state.isExpoApp) {
    return {
      command: NOT_AN_APP_COMMAND,
      rule: plan.rule,
      target: plan.target,
      steps: [],
      why: "this directory is not an Expo app, so there is nothing here to get onto a device — change to the app's own directory, or create one here",
      buildLocation: null,
    };
  }
  const verify = verifyAction(devServer, device, state, scheme, cloudSession);
  if (verify) {
    return {
      ...verify,
      rule: plan.rule,
      target: plan.target,
      steps: [],
      buildLocation: plan.buildLocation,
    };
  }
  return {
    command: NEXT_ACTION_COMMAND,
    rule: plan.rule,
    target: plan.target,
    steps: plan.steps,
    why: null,
    buildLocation: plan.buildLocation,
  };
}

/** The command and the reason for a dev server this project can already use, or null. */
function verifyAction(
  devServer: DevServerStatus | null,
  device: LocalDeviceStatus | null,
  state: ProjectState,
  scheme: string | null,
  /** Whether this project has an EAS Simulator session on record. See the caller's parameter. */
  cloudSession: boolean
): { command: string; why: string } | null {
  if (!devServer?.running || devServer.projectRootMatched === false) {
    return null;
  }

  // @ref llp/0021-honest-reports.rfc.md §The rules
  // A cloud loop is not a local loop with a longer wire. Every rung below drives a **local**
  // simulator or an attached device, and on a run whose app was on an EAS Simulator over a tunnel
  // this section answered `smoke` and `navigate /` — commands that reach for a device this machine
  // does not have [observed — cloud loop, 2026-08-27, K7(a)].
  //
  // `!== 'present'` rather than `=== 'absent'`: with a session on record, a probe that could not
  // run is not a reason to name the local path — the caller has told this project where its device
  // is, and that is stronger evidence than a missing `simctl`.
  const cloudLoop = cloudSession && device?.state !== 'present';

  if (devServer.appsConnected > 0) {
    return cloudLoop
      ? {
          command: `${VERIFY_COMMAND} --cloud`,
          why: 'a dev server is running with an app connected and this project has an EAS Simulator session, so the gate runs against that session — a plain "smoke" would look for a simulator on this machine',
        }
      : {
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
  // A session on record beats every address below it, because it is the one rung that is a
  // **command this CLI can run**: the URLs are things a person has to open somewhere else.
  if (cloudLoop) {
    return {
      command: `${OPEN_APP_COMMAND} --cloud`,
      why: `no app is connected and ${
        device?.state === 'absent'
          ? 'this machine has no booted simulator or attached device'
          : "this machine's device tools could not answer"
      }, so this opens the app on this project's EAS Simulator session instead — it needs a tunnelled dev server, and the session bills until "npx eas simulator:stop"`,
    };
  }

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
 * the command that prints both [decided, 2026-08-26].
 */
function noLocalDeviceAction(
  devServer: DevServerStatus,
  state: ProjectState,
  scheme: string | null
): { command: string; why: string } {
  const noDevice =
    'no dev server client is attached and this machine has no booted simulator or attached device, so nothing here can open the app';

  // Zero apps are connected — that is the branch this is in — so the dev server has nothing to say
  // about which app it would be, and `targetAppIds` stays empty.
  const connect = resolveConnectUrls(devServer, state, scheme);
  const tunnelHost = devServer.tunnelUrl ? hostOf(devServer.tunnelUrl) : null;

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
 * Mirrors the default of `@expo/agent-cli dev` (see `resolveDefaultPlatform` in
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
