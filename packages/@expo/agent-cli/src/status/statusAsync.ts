// @ref llp/0004-smart-start-and-project-state.rfc.md §Status
// "Where is this project right now, and what would happen next" — one read-only pass over the
// project state, the recorded builds, the dev server, and the linked skills.
//
// Every section is gathered independently and may fail on its own: status is information, so a
// broken probe costs one line of the report instead of the whole command. Nothing here decides
// an exit code; the command always exits 0.

import fs from 'fs';
import path from 'path';

import { resolveDevServerReachAsync } from '../dev/advertisedUrl';
import { readCloudSessionIdSync } from '../device/cloudSimulator';
import { probeLocalDeviceAsync } from '../device/localDevice';
import { event } from '../events';
import { exitWithCodeAsync } from '../exitCodes';
import { buildStatusFollowUps, followUpsEnabled, reportFollowUps } from '../followups';
import { refineWithChangedFilesAsync } from '../impact/fromRecord';
import type { ImpactClass, OtaSafety } from '../impact/types';
import * as Log from '../log';
import { readProjectSchemeConfig } from '../navigate/deepLink';
import { readAuthPreflightAsync } from '../needsHuman/preflight';
import { readLastBuildRecord, type LastBuildRecord } from '../plan/lastBuild';
import type { LastBuildFingerprints, NativePlatform, PlanPlatform } from '../plan/types';
import { readProjectPackageJsonAsync } from '../project/nodeModules';
import { probeProjectStateAsync } from '../project/probe';
import type { ProjectState, StartPlan } from '../project/types';
import {
  discoverDevServerAsync,
  type DevServerDiscovery,
  type DevServerProbe,
} from '../runtime/devServer';
import { probeTargetLivenessAsync } from '../runtime/targetLiveness';
import { waitForBundlerReadyAsync } from '../runtime/waitReady';
import { getAllAgents, getPersistedAgentIdsAsync } from '../skills/agents';
import { discoverSkillsAsync } from '../skills/discovery';
import type { DiscoveredSkill } from '../skills/types';
import { buildAssertStatus } from './assert';
import { readEasBuildsStatusAsync } from './easBuilds';
import { formatStatusReport } from './format';
import {
  applyEasFreshness,
  applyOpenUrls,
  buildDevServerStatus,
  buildExpoGoStatus,
  buildFreshnessStatus,
  buildLocalDeviceStatus,
  buildNextActionStatus,
  buildProjectStatus,
  effectivePlatformFreshness,
  resolveDefaultPlatform,
  type DevServerReadiness,
} from './sections';
import type {
  AuthStatus,
  BuildLookupState,
  DevServerStatus,
  FreshnessImpact,
  FreshnessState,
  FreshnessStatus,
  LocalDeviceStatus,
  SkillsStatus,
  StatusReport,
  StatusSectionName,
} from './types';

/**
 * How long the dev-server probe may take. Status is meant to be instant, and the common answer
 * (nothing listening on the port) arrives in a millisecond, so a short ceiling only ever cuts off
 * a host that never answers.
 */
export const DEV_SERVER_PROBE_TIMEOUT_MS = 1500;

/**
 * How long the readiness probe of the dev-server section may take.
 *
 * Much shorter than the reachability budget above, because this request is answered by a dev
 * server that has finished bundling and left open by one that has not. Status must not wait for a
 * bundle, so the budget is only long enough for a ready server on localhost to answer.
 */
export const DEV_SERVER_READY_PROBE_TIMEOUT_MS = 400;

/**
 * How long the local-device probe may take.
 *
 * Two subprocesses, both of which answer in tens of milliseconds on a warm machine. The budget is
 * for the cold one — a first `xcrun simctl` after an Xcode update — and expiring costs the report
 * an answer rather than the command its promptness.
 */
export const DEVICE_PROBE_TIMEOUT_MS = 2500;

export interface StatusOptions {
  /** Explicit --dev-server-url; null lets the probe scan the ports `expo start` uses. */
  devServerUrl: string | null;
  /** Print the report as JSON instead of one line per section. */
  json?: boolean;
  /** Platform the next action targets. Resolved from the project when omitted. */
  platform?: PlanPlatform;
  /** Overrides {@link DEV_SERVER_PROBE_TIMEOUT_MS}, for tests. */
  devServerTimeoutMs?: number;
  /** Overrides {@link DEV_SERVER_READY_PROBE_TIMEOUT_MS}, for tests. */
  devServerReadyTimeoutMs?: number;
  /** Overrides {@link DEVICE_PROBE_TIMEOUT_MS}, for tests. */
  deviceProbeTimeoutMs?: number;
  /**
   * The deep dive: `--explain`.
   *
   * Three things join the report, and only two of them cost anything — which is the whole design.
   * The per-source change list is free (the headline diffs locally, so the list is a by-product)
   * and is left out by default because a headline with fifty rows attached is not a headline. The
   * OTA verdict spawns `expo config --json --type public`, and the EAS build lookup makes a
   * network call; both are what a reader who typed `--explain` asked to pay for.
   *
   * @see llp/0004-smart-start-and-project-state.rfc.md §Status
   */
  explain?: boolean;
  /**
   * Turn the report into a gate: exit `20` when the change costs more than this class (`--assert`).
   *
   * @see llp/0004-smart-start-and-project-state.rfc.md §Status
   */
  assert?: ImpactClass | null;
  /**
   * Compare against a specific EAS build instead of the project's own record (`--build <id>`).
   *
   * Requires `--explain`, because it fetches a fingerprint from the service. Server ground truth:
   * it needs no local record, which is what makes it the answer for a build made in the cloud.
   */
  buildId?: string | null;
  /** Overrides {@link EAS_BUILD_LOOKUP_TIMEOUT_MS}, for tests. */
  buildLookupTimeoutMs?: number;
  /** Overrides {@link CHANGED_FILES_TIMEOUT_MS}, for tests. */
  changedFilesTimeoutMs?: number;
  /** Attach the state-aware next actions to the report, cleared by `--no-followups`. */
  followups?: boolean;
  /**
   * Whether a fingerprint may be answered out of the project's own record (`--no-fingerprint-cache`
   * clears it).
   *
   * @ref llp/0023-fingerprint-caching.rfc.md
   * This is the flag that pays for the report's promptness: a default `status` computes one
   * fingerprint and `--explain` computes three, at about a second each, and all three are the same
   * three the previous run computed unless one of the pinned files moved. Undefined leaves the
   * decision to `AGENT_CLI_NO_FINGERPRINT_CACHE`.
   */
  fingerprintCache?: boolean;
}

/** Gather the report, emit it for agents, and print it for humans. */
export async function printStatusAsync(projectRoot: string, options: StatusOptions): Promise<void> {
  const report = await collectStatusReportAsync(projectRoot, options);
  // @ref llp/0009-smart-followups.rfc.md §Examples per command — status already carries "next" by
  // design, so these are the actions that line does not name, and only the machine channels
  // (`--json` and the event) carry them.
  const followups = followUpsEnabled(options.followups) ? buildStatusFollowUps(report) : [];

  event('status', {
    rule: report.next?.rule ?? null,
    sdkVersion: report.project?.sdkVersion ?? null,
    expoGoCompatible: report.expoGo?.compatible ?? null,
    devServerRunning: report.devServer?.running ?? false,
    appsConnected: report.devServer?.appsConnected ?? 0,
    appsListed: report.devServer?.appsListed ?? 0,
    appsStale: report.devServer?.appsStale ?? 0,
    devServerHostType: report.devServer?.hostType ?? null,
    tunnelUrl: report.devServer?.tunnelUrl ?? null,
    openUrl: report.devServer?.openUrls[0]?.url ?? null,
    localDevice: report.device?.state ?? 'unknown',
    freshness: { ios: freshnessOf(report, 'ios'), android: freshnessOf(report, 'android') },
    easBuilds: { ios: easBuildOf(report, 'ios'), android: easBuildOf(report, 'android') },
    easBuildsAsked: report.builds?.askedEas ?? false,
    // @ref llp/0023-fingerprint-caching.rfc.md §The report says where the answer came from
    // On the machine channel too, so a driving agent can tell a measured hash from a revalidated
    // one without parsing the printed line.
    fingerprintSource: report.freshness?.hashSource.source ?? null,
    fingerprintRevalidatedAgainst: report.freshness?.hashSource.revalidatedAgainst ?? null,
    skillsDiscovered: report.skills?.discovered ?? 0,
    skillsLinked: report.skills?.linked ?? 0,
    impact: {
      ios: impactClassOf(report, 'ios'),
      android: impactClassOf(report, 'android'),
    },
    assertion: report.assertion,
    sectionErrors: Object.keys(report.errors),
  });

  Log.log(
    options.json ? JSON.stringify({ ...report, followups }, null, 2) : formatStatusReport(report)
  );
  // Silent on purpose: repeating the plan the `next` line already names would be noise, so the
  // follow-ups reach a driving agent through the event and the JSON report only.
  reportFollowUps('status', followups, { silent: true });

  // @ref llp/0004-smart-start-and-project-state.rfc.md §Status
  // The one path out of this command that is not 0, and it exists only because the caller asked
  // for a verdict. The report is printed first either way: a gate that failed is still a report,
  // and an agent reading the exit code needs the reasons above it.
  if (report.assertion && !report.assertion.ok) {
    await exitWithCodeAsync(report.assertion.exitCode);
  }
}

/**
 * Read every section of the report.
 *
 * The four independent reads (project, dev server, skills, auth) run in parallel, and each is
 * wrapped on its own: an unreadable project still reports a running dev server, and a dependency
 * graph the skill discovery cannot walk still reports the project.
 */
export async function collectStatusReportAsync(
  projectRoot: string,
  options: StatusOptions
): Promise<StatusReport> {
  const [project, devServer, device, skills, auth] = await Promise.all([
    attemptAsync(() => readProjectAsync(projectRoot, options)),
    attemptAsync(() => probeDevServerStatusAsync(projectRoot, options)),
    attemptAsync(() => readLocalDeviceStatusAsync(options)),
    attemptAsync(() => readSkillsStatusAsync(projectRoot)),
    attemptAsync<AuthStatus>(() => readAuthPreflightAsync(projectRoot)),
  ]);

  const errors: Partial<Record<StatusSectionName, string>> = {};
  const report: StatusReport = {
    project: null,
    expoGo: null,
    freshness: null,
    builds: null,
    devServer: null,
    device: null,
    skills: null,
    auth: null,
    next: null,
    assertion: null,
    probe: null,
    errors,
  };

  // Read before the project section, because `next` depends on it: a dev server that is already
  // serving this project changes what the useful next command is (see `buildNextActionStatus`).
  if ('value' in devServer) {
    report.devServer = devServer.value;
  } else {
    errors.devServer = devServer.error;
  }

  // Read before `next` too, and for the same reason: a machine with no device to open the app on
  // makes `@expo/agent-cli navigate /` the wrong advice however healthy the dev server is
  // (`buildNextActionStatus`).
  if ('value' in device) {
    report.device = device.value;
  } else {
    errors.device = device.error;
  }

  if ('value' in project) {
    const { state, packageName } = project.value;
    // Advisory by contract, and read after the probe, so the fingerprint it is compared against
    // and the record it is compared to describe the same moment.
    //
    // The whole record, not only the hashes: its `sources` are the base of the impact headline
    // (llp/0004 §Status), and `readLastBuildRecord`
    // is one file read whichever of the two shapes the caller wants out of it.
    const record = readLastBuildRecord(projectRoot);
    const lastBuild = fingerprintsOf(record);
    // The probe rides along whole, so `--json` is also the project brief: the sections round its
    // facts off for a terminal, and a caller that wants them exactly reads `probe`.
    //
    // Whole except the fingerprint's `sources`, which are dropped from the *payload* and nowhere
    // else. They are the list the hash was computed from — tens of thousands of bytes for a real
    // project [observed — ~25 KB for iOS on an SDK 57 Expo Router app, 2026-08-24] — and a caller
    // reading this report wants the answer, not the evidence. Dropping them keeps `status` the
    // small report its contract promises (llp/0004 §Status).
    //
    // They are still *read*: the impact headline diffs them against the recorded build's, in
    // process and for free (llp/0004 §Status). What
    // reaches `--json` from that is the class, the count, and — only under `--explain` — the
    // sources that actually moved, which is a handful rather than the whole surface.
    report.probe = { ...state, fingerprint: { ...state.fingerprint, sources: undefined } };
    report.project = buildProjectStatus(state, packageName);
    report.expoGo = buildExpoGoStatus(state);
    report.freshness = buildFreshnessStatus(state, lastBuild, record, {
      explain: !!options.explain,
    });
    // @ref llp/0004-smart-start-and-project-state.rfc.md §Status
    // The file-level refinement, and then — only when the caller named one — the comparison
    // against an EAS build, which replaces the headline's base. Both fold into the section that
    // is already built rather than being threaded through the pure builder, because both are I/O
    // and `buildFreshnessStatus` is the part that has to stay testable without a project.
    await refineFreshnessAsync(projectRoot, report.freshness, options);
    if (options.buildId) {
      const compared = await attemptAsync(() =>
        compareAgainstEasBuildAsync(projectRoot, report.freshness!, options)
      );
      if ('error' in compared) {
        errors.freshness = compared.error;
      }
    }
    // @ref llp/0021-honest-reports.rfc.md §The rules
    // The URL a device opens, next to the address the dev server listens on. Here, because the
    // scheme and the app target are the *project's* facts and the dev-server probe ran before them
    // (K7(c)).
    const devBuildScheme = devBuildSchemeSync(projectRoot);
    applyOpenUrls(report.devServer, state, devBuildScheme);
    report.next = buildNextActionStatus(
      state,
      lastBuild,
      options.platform ?? resolveDefaultPlatform(state),
      report.devServer,
      report.device,
      // The scheme a development build of this project registers, read the same way the deep link
      // reads it: `exp://` is the Expo Go form only, and a development build's connect URL takes
      // the app's own scheme (`src/navigate/connectUrl.ts`).
      devBuildScheme,
      // A file read, not a service call: `status` promises to be instant (`src/device/
      // cloudSimulator.ts` §readCloudSessionIdSync).
      readCloudSessionIdSync(projectRoot) != null,
      // @ref llp/0015-backend-selection-and-config.rfc.md §What `status` reports
      // The plan `@expo/agent-cli dev` would make *here* — the developer's config, this host and the
      // toolchain probe folded in — rather than the one the project's state alone implies. The two
      // differ on exactly the machines where it matters, and a `status` that reported
      // "expo run:ios" on a Linux box would be the report disagreeing with the command.
      await attemptPlanAsync(projectRoot, state, lastBuild, options)
    );
  } else {
    // One cause, one note. The other three sections are left null, and the project line says why.
    errors.project = project.error;
  }

  if ('value' in skills) {
    report.skills = skills.value;
  } else {
    errors.skills = skills.error;
  }

  // The preflight never throws, so this only fires if it ever learns how to. Status is
  // information: a probe that broke costs one line, not the command.
  if ('value' in auth) {
    report.auth = auth.value;
  } else {
    errors.auth = auth.error;
  }

  // @ref llp/0011-impact-and-freshness.rfc.md §The build-cache lookup
  // Last, and after the parallel block rather than in it, because it consumes two of its answers:
  // the project's fingerprint is the cache key, and the auth answer is what keeps a signed-out
  // machine from being asked the same question twice. On a run without `--explain` this is one
  // `readFileSync`, so the report is as instant as it was before the section existed.
  //
  // These two are independent of each other and both are the expensive half of `--explain`, so
  // they run together rather than one after the other.
  const [builds, ota] = await Promise.all([
    attemptAsync(() =>
      readEasBuildsStatusAsync(projectRoot, {
        lookUp: !!options.explain,
        auth: report.auth,
        projectHash: report.freshness?.hash ?? null,
        timeoutMs: options.buildLookupTimeoutMs,
        fingerprintCache: options.fingerprintCache,
      })
    ),
    options.explain && report.freshness
      ? attemptAsync(() => resolveOtaSafetyAsync(projectRoot, report.freshness!))
      : Promise.resolve(null),
  ]);

  if ('value' in builds) {
    report.builds = builds.value;
  } else {
    errors.builds = builds.error;
  }

  // @ref llp/0021-honest-reports.rfc.md §The rules — K7(b)
  // The same lookup, read as a verdict rather than as an inventory: a finished EAS build made from
  // this exact fingerprint means this platform needs no native build, and the freshness section used
  // to report `stale (no recorded build)` beside it because it only ever looked at this machine.
  if (report.freshness) {
    applyEasFreshness(report.freshness, report.builds);
  }

  // Its own section note under `freshness`, because that is the section it belongs to: a failed
  // OTA read costs the verdict and leaves every freshness fact beside it standing.
  if (ota && 'value' in ota && report.freshness) {
    report.freshness.ota = ota.value;
  } else if (ota && 'error' in ota && !errors.freshness) {
    // Never over one already written: a `--build` comparison that failed is the more specific
    // cause, and the section has one line to say it on.
    errors.freshness = ota.error;
  }

  // @ref llp/0004-smart-start-and-project-state.rfc.md §Status
  // Last, because it judges what every section above it found, and only when a class was asserted.
  if (options.assert) {
    report.assertion = buildAssertStatus(options.assert, report.freshness);
  }

  return report;
}

/**
 * Split "Fast Refresh picks it up" from "restart Metro", for platforms the fingerprint cleared.
 *
 * @ref llp/0011-impact-and-freshness.rfc.md §When the fingerprint did not move
 * Runs at most once, and only when *every* decided platform reported the native surface unchanged
 * — the same rule `impact` follows, and for the same reason: git has no per-platform answer, and a
 * platform whose fingerprint moved already has the stronger class. A `js-only` that this leaves
 * alone is a `js-only` the file list agreed with.
 */
async function refineFreshnessAsync(
  projectRoot: string,
  freshness: FreshnessStatus,
  options: StatusOptions
): Promise<void> {
  const decided = freshness.platforms.filter((platform) => platform.impact?.class != null);
  if (
    !decided.length ||
    !decided.every((platform) => platform.impact!.fingerprintChanged === false)
  ) {
    return;
  }

  const refinement = await refineWithChangedFilesAsync(projectRoot, {
    timeoutMs: options.changedFilesTimeoutMs,
  });
  if (!refinement) {
    return;
  }

  freshness.changedFiles = refinement.counts;
  for (const platform of decided) {
    if (platform.impact!.class === 'js-only') {
      platform.impact!.class = refinement.class;
      platform.impact!.reason = refinement.reason;
    }
  }
}

/**
 * Compare the working tree against one EAS build, and make that the headline's base.
 *
 * @ref llp/0011-impact-and-freshness.rfc.md §The three comparisons
 * @ref llp/0021-honest-reports.rfc.md §The rules
 * `eas fingerprint:compare --build-id` takes **no platform**, because a build was made for exactly
 * one and which one is a fact about the build rather than a question to ask. That used to mean the
 * one answer was copied onto *every* platform, which reported an iOS simulator build as able to run
 * android code [observed — live staging, 2026-08-26, S1]. So the build's own platform is asked for,
 * and only that platform's headline is replaced; the others say they were not compared. The
 * `fresh`/`stale` states are left alone on all of them, because they are about the project's own
 * record and that question did not change.
 */
async function compareAgainstEasBuildAsync(
  projectRoot: string,
  freshness: FreshnessStatus,
  options: StatusOptions
): Promise<void> {
  const { resolveEasCliOrThrow } = require('../utils/easCli') as typeof import('../utils/easCli');
  const { compareWithEasBuildAsync } =
    require('../impact/compare') as typeof import('../impact/compare');
  const { classifyFingerprintDiff } =
    require('../impact/classify') as typeof import('../impact/classify');
  const { lookUpBuildPlatformAsync } =
    require('../impact/buildCache') as typeof import('../impact/buildCache');

  const buildId = options.buildId!;
  // Before the call, so a comparison that fails still echoes the target the caller named. It used
  // to be written afterwards, so a failed `--build abc123` left `buildId: null` behind and the id
  // appeared nowhere in the report [observed — friction run 7, F66].
  freshness.comparison = {
    kind: 'eas-build',
    label: `EAS build ${buildId}`,
    buildId,
    platform: null,
  };

  const easCli = resolveEasCliOrThrow(projectRoot);
  // The caller's own `--platform` wins: they said which platform they mean, and no lookup overrules
  // a fact somebody stated. Otherwise EAS is asked, and a lookup that answers nothing leaves the
  // comparison attributed to no platform rather than to both.
  // `--platform web` is not one of the two an EAS build can be for, so it says nothing here.
  const named =
    options.platform === 'ios' || options.platform === 'android' ? options.platform : null;
  const [comparison, buildPlatform] = await Promise.all([
    compareWithEasBuildAsync(easCli, projectRoot, buildId),
    named ?? lookUpBuildPlatformAsync(easCli, projectRoot, buildId),
  ]);
  if (comparison.error) {
    throw new Error(comparison.error);
  }

  freshness.comparison.platform = buildPlatform;

  const classified = comparison.items ? classifyFingerprintDiff(comparison.items) : null;
  const impact: FreshnessImpact = {
    // The same rule as everywhere else in this report: a comparison that established nothing gets
    // `null`, not the conservative guess a gate would have to make (llp/0011 §The classifier reads reasons).
    class: classified?.class ?? (comparison.fingerprintChanged === false ? 'js-only' : null),
    fingerprintChanged: comparison.fingerprintChanged,
    reason:
      classified?.reasons[0] ??
      (comparison.fingerprintChanged === false
        ? `the native surface matches EAS build ${buildId}, so that build can run this code`
        : comparison.fingerprintChanged
          ? `the native surface differs from EAS build ${buildId}, and what differs could not be listed`
          : `whether the native surface differs from EAS build ${buildId} could not be established`),
    changedCount: classified?.changedSources.length ?? null,
    changedSources: classified ? classified.changedSources : null,
  };

  // The **eas** axis, and only it: "does this differ from that cloud build" is a question about
  // EAS, and the local axis answers "does it differ from what I built here" — which `--build` did
  // not ask and did not change (llp/0021 §The rules).
  for (const entry of freshness.platforms) {
    if (entry.backend !== 'eas') {
      continue;
    }
    const compared = entry.platform === buildPlatform;
    entry.impact = compared ? impact : notComparedImpact(buildId, buildPlatform, entry.platform);
    entry.buildId = compared ? buildId : null;
    entry.state = compared ? easBuildFreshness(comparison.fingerprintChanged) : 'unknown';
    entry.detail = compared
      ? comparison.fingerprintChanged === false
        ? `matches EAS build ${buildId}`
        : comparison.fingerprintChanged
          ? `differs from EAS build ${buildId}`
          : `EAS build ${buildId} could not be compared`
      : `not compared — ${buildId} is ${buildPlatform ?? 'a build of an unestablished platform'}`;
  }
}

/** The freshness state of an `eas` axis a named build was compared against. */
function easBuildFreshness(fingerprintChanged: boolean | null): FreshnessState {
  return fingerprintChanged === false ? 'fresh' : fingerprintChanged ? 'stale' : 'unknown';
}

/**
 * The headline of a platform the `--build` comparison was not about.
 *
 * A stated non-answer rather than a copied one. `class: null` is what the rest of this report uses
 * for "nothing was established", and `--assert` already exits 22 on it instead of gating on a guess
 * (llp/0011 §The classifier reads reasons).
 */
function notComparedImpact(
  buildId: string,
  buildPlatform: 'ios' | 'android' | null,
  platform: NativePlatform
): FreshnessImpact {
  return {
    class: null,
    fingerprintChanged: null,
    reason:
      buildPlatform == null
        ? `not compared — the comparison was against EAS build ${buildId}, and which platform that build was made for could not be established, so nothing here is an answer about ${platform}`
        : `not compared — EAS build ${buildId} is an ${buildPlatform} build, and one build is one platform`,
    changedCount: null,
    changedSources: null,
  };
}

/**
 * Whether an update published now would reach installed builds that can run it.
 *
 * @ref llp/0011-impact-and-freshness.rfc.md §A fingerprint change is not "OTA-unsafe"
 * Deliberately not derived from the impact class: a fingerprint change answers "does the native
 * binary differ", and OTA safety is a `runtimeVersion` question. The two coincide only under
 * `policy: "fingerprint"`. Resolving the policy spawns `expo config --json --type public`, which
 * is why this is on the `--explain` side of the line.
 */
async function resolveOtaSafetyAsync(
  projectRoot: string,
  freshness: FreshnessStatus
): Promise<OtaSafety> {
  const { resolveRuntimeVersionAsync, resolveOtaSafety } =
    require('../impact/runtimeVersion') as typeof import('../impact/runtimeVersion');
  const runtimeVersion = await resolveRuntimeVersionAsync(projectRoot);
  // The strongest answer across the platforms, the way `impact` folds them: one platform whose
  // native surface moved is enough to decide the question for an update published now.
  const changed = freshness.platforms.reduce<boolean | null>(
    (strongest, platform) =>
      platform.impact?.fingerprintChanged === true
        ? true
        : strongest === null && platform.impact?.fingerprintChanged === false
          ? false
          : strongest,
    null
  );
  return resolveOtaSafety(runtimeVersion, changed);
}

/** The hashes alone, out of a record that was read once for both of its shapes. */
function fingerprintsOf(record: LastBuildRecord): LastBuildFingerprints {
  const fingerprints: LastBuildFingerprints = {};
  for (const platform of ['ios', 'android'] as NativePlatform[]) {
    const entry = record[platform];
    if (entry) {
      fingerprints[platform] = entry.hash;
    }
  }
  return fingerprints;
}

/**
 * The URL scheme a development build of this project registers, or null.
 *
 * The precedence of the deep link itself: the `scheme` field of the static app config, then the
 * `exp+<slug>` default a managed development build registers. One file read, statically — a dynamic
 * `app.config.js` is never evaluated (llp/0001 §Constraints item 5), so such a project reports null
 * and the report names the command that can be given `--scheme` instead.
 */
function devBuildSchemeSync(projectRoot: string): string | null {
  const config = readProjectSchemeConfig(projectRoot);
  return config.scheme ?? (config.slug ? `exp+${config.slug}` : null);
}

/** The probed project state, plus the name only the project's own `package.json` knows. */
/**
 * The plan `@expo/agent-cli dev` would make, or null when it could not be made.
 *
 * Null rather than a throw: `status` exits 0 by contract and reports what it could not read, and a
 * project whose `@expo/agent-cli` config is invalid should still get every other line of the report. The
 * fallback is the plan the project's own state implies, which is what `buildNextActionStatus`
 * makes of a null.
 */
async function attemptPlanAsync(
  projectRoot: string,
  state: ProjectState,
  lastBuild: LastBuildFingerprints,
  options: StatusOptions
): Promise<StartPlan | null> {
  const { resolveStartPlanAsync } =
    require('../plan/resolveAsync') as typeof import('../plan/resolveAsync');
  try {
    return await resolveStartPlanAsync(projectRoot, state, {
      platform: options.platform ?? resolveDefaultPlatform(state),
      lastBuild,
    });
  } catch {
    return null;
  }
}

async function readProjectAsync(
  projectRoot: string,
  options: StatusOptions
): Promise<{ state: ProjectState; packageName: string | null }> {
  const [state, packageJson] = await Promise.all([
    probeProjectStateAsync(projectRoot, { fingerprintCache: options.fingerprintCache }),
    readProjectPackageJsonAsync(projectRoot),
  ]);
  return { state, packageName: packageJson?.name ?? null };
}

/**
 * Probe the dev server, giving up after {@link DEV_SERVER_PROBE_TIMEOUT_MS}.
 *
 * The probe itself never throws, so the timeout is the only way this reports "unknown", and giving
 * up **cancels** the request rather than walking away from it. Not cancelling changed nothing a
 * reader could see and everything about when they got the shell prompt back: a Node process exits
 * when its event loop empties, so against a dev server that accepted the connection and then never
 * answered, the report was complete at 3.07 s and `status` was still running at 45 s — undici's
 * header timeout is 300 s. It now exits at 3.12 s [observed — 2026-08-27]. Nothing reportable is
 * lost by cancelling here, because this branch has already decided the answer will not be used.
 *
 * The signal is threaded rather than left to the ladder's own per-probe budget because an explicit
 * `--dev-server-url` deliberately has no budget (see {@link discoverDevServerAsync}), so this
 * deadline is the only one that reaches that probe.
 */
async function probeDevServerStatusAsync(
  projectRoot: string,
  options: StatusOptions
): Promise<DevServerStatus> {
  const timeoutMs = options.devServerTimeoutMs ?? DEV_SERVER_PROBE_TIMEOUT_MS;
  const giveUp = new AbortController();
  // No explicit URL: 8081 first, then the ports `expo start` walks to (see devServer.ts).
  const discovery = await raceWithTimeoutAsync(
    discoverDevServerAsync(options.devServerUrl ?? undefined, {
      timeoutMs,
      projectRoot,
      signal: giveUp.signal,
    }),
    timeoutMs * 2
  );
  if (discovery == null) {
    giveUp.abort();
    const timedOut: DevServerProbe = {
      reachable: false,
      targets: [],
      reason: `the dev server did not answer within ${timeoutMs}ms`,
    };
    return buildDevServerStatus(options.devServerUrl ?? 'http://127.0.0.1:8081', timedOut, {
      source: options.devServerUrl != null ? 'flag' : 'default',
      ready: null,
      projectRootMatched: null,
    });
  }
  // The listing is not the count (F56): a page an app left behind stays in `/json/list`, and every
  // runtime command a reader runs next would refuse it. One handshake per target, in parallel.
  const [readiness, liveness, reach] = await Promise.all([
    readDevServerReadinessAsync(projectRoot, discovery, options),
    probeTargetLivenessAsync(discovery.targets),
    // What the dev server printed about where a *device* reaches it (`src/dev/advertisedUrl.ts`).
    // One file read and one lock probe, and the answer the `url` above cannot give: a tunnelled run
    // listens on `127.0.0.1` and is reached at its tunnel host.
    resolveDevServerReachAsync(projectRoot),
  ]);
  return buildDevServerStatus(
    discovery.devServerUrl,
    discovery,
    readiness,
    { live: liveness.live, stale: liveness.stale.length },
    reach
  );
}

/**
 * Whether this machine has a device to open the app on, within a budget status can afford.
 *
 * The probe spawns `xcrun simctl` and `adb`, and status promises to be instant, so it is raced
 * against a short deadline. The deadline expiring reports `unknown` rather than `absent` — the same
 * rule the probe itself follows, because a suggestion turned off on the strength of a slow
 * subprocess would be the mistake this exists to fix, backwards.
 */
async function readLocalDeviceStatusAsync(options: StatusOptions): Promise<LocalDeviceStatus> {
  const timeoutMs = options.deviceProbeTimeoutMs ?? DEVICE_PROBE_TIMEOUT_MS;
  const probe = await raceWithTimeoutAsync(probeLocalDeviceAsync(), timeoutMs);
  return buildLocalDeviceStatus(
    probe ?? {
      state: 'unknown',
      device: null,
      devices: [],
      reason: `no platform tool answered within ${timeoutMs}ms`,
    }
  );
}

/**
 * Ask a dev server that answered whether its bundler is done, and whether it is this project's.
 *
 * Deliberately a short probe, not a wait: `GET /status` only answers once the bundle finishes, so
 * a status command that awaited it would hang for the length of a cold bundle. The budget expiring
 * is reported as `ready: null` — "still working", which is a different fact from "not ready" and
 * the reason `dev:wait` exists. The project-root header is flushed before the bundler is awaited,
 * so `projectRootMatched` is answered even by the probe that expires.
 */
async function readDevServerReadinessAsync(
  projectRoot: string,
  discovery: DevServerDiscovery,
  options: StatusOptions
): Promise<DevServerReadiness> {
  if (!discovery.reachable) {
    return { source: discovery.source, ready: null, projectRootMatched: null };
  }
  const readiness = await waitForBundlerReadyAsync(discovery.devServerUrl, {
    timeoutMs: options.devServerReadyTimeoutMs ?? DEV_SERVER_READY_PROBE_TIMEOUT_MS,
    projectRoot,
  });
  return {
    source: discovery.source,
    ready: readiness.timedOut ? null : readiness.ready,
    projectRootMatched: readiness.projectRootMatched,
  };
}

/** Which agents are configured, how many skills the project ships, and how many are linked. */
async function readSkillsStatusAsync(projectRoot: string): Promise<SkillsStatus> {
  const [agentIds, skills] = await Promise.all([
    getPersistedAgentIdsAsync(projectRoot),
    discoverSkillsAsync(projectRoot),
  ]);

  const skillsDirs = [
    ...new Set(
      getAllAgents()
        .filter((agent) => agentIds?.includes(agent.id))
        .map((agent) => agent.skillsDir)
    ),
  ];

  return {
    agentIds,
    discovered: skills.length,
    linked: skillsDirs.length ? countLinkedSkills(projectRoot, skills, skillsDirs) : 0,
  };
}

/**
 * Count the skills that are linked for every selected agent.
 *
 * A skill linked for one agent but not another is counted as not linked, so a selection that
 * changed since the last `@expo/agent-cli skills` run reads as out of sync instead of as done.
 */
function countLinkedSkills(
  projectRoot: string,
  skills: DiscoveredSkill[],
  skillsDirs: string[]
): number {
  return skills.filter((skill) =>
    skillsDirs.every((dir) => fs.existsSync(path.join(projectRoot, dir, skill.linkName)))
  ).length;
}

/**
 * The freshness one platform is in, across both axes.
 *
 * The **effective** answer, which is what a consumer of this stream branches on: a platform whose
 * fingerprint matches a finished EAS build needs no native build, whatever this machine has built
 * (llp/0021 §The rules). The split itself is in `--json`.
 */
function freshnessOf(report: StatusReport, platform: NativePlatform): FreshnessState | null {
  return effectivePlatformFreshness(report.freshness, platform)?.state ?? null;
}

function easBuildOf(report: StatusReport, platform: NativePlatform): BuildLookupState | null {
  return report.builds?.platforms.find((entry) => entry.platform === platform)?.state ?? null;
}

function impactClassOf(report: StatusReport, platform: NativePlatform): ImpactClass | null {
  return (
    report.freshness?.platforms.find((entry) => entry.platform === platform && entry.impact?.class)
      ?.impact?.class ?? null
  );
}

type Attempt<T> = { value: T } | { error: string };

/** Run one section's gathering, turning a failure into the note that section prints. */
async function attemptAsync<T>(work: () => Promise<T>): Promise<Attempt<T>> {
  try {
    return { value: await work() };
  } catch (error: unknown) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

/** Await a promise, resolving to null when it takes longer than `timeoutMs`. */
async function raceWithTimeoutAsync<T>(work: Promise<T>, timeoutMs: number): Promise<T | null> {
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<null>((resolve) => {
    timer = setTimeout(() => resolve(null), timeoutMs);
    // An unreferenced timer never keeps the process alive on its own.
    timer.unref?.();
  });

  try {
    return await Promise.race([work, timeout]);
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
}
