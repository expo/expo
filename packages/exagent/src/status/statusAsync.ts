// @ref llp/0004-smart-start-and-project-state.rfc.md §`exagent status`
// "Where is this project right now, and what would happen next" — one read-only pass over the
// project state, the recorded builds, the dev server, and the linked skills.
//
// Every section is gathered independently and may fail on its own: status is information, so a
// broken probe costs one line of the report instead of the whole command. Nothing here decides
// an exit code; the command always exits 0.

import fs from 'fs';
import path from 'path';

import { event } from '../events';
import { buildStatusFollowUps, followUpsEnabled, reportFollowUps } from '../followups';
import * as Log from '../log';
import { readAuthPreflightAsync } from '../needsHuman/preflight';
import { readLastBuildFingerprints } from '../plan/lastBuild';
import type { NativePlatform, PlanPlatform } from '../plan/types';
import { readProjectPackageJsonAsync } from '../project/nodeModules';
import { probeProjectStateAsync } from '../project/probe';
import type { ProjectState } from '../project/types';
import {
  discoverDevServerAsync,
  type DevServerDiscovery,
  type DevServerProbe,
} from '../runtime/devServer';
import { waitForBundlerReadyAsync } from '../runtime/waitReady';
import { getAllAgents, getPersistedAgentIdsAsync } from '../skills/agents';
import { discoverSkillsAsync } from '../skills/discovery';
import type { DiscoveredSkill } from '../skills/types';
import { formatStatusReport } from './format';
import {
  buildDevServerStatus,
  buildExpoGoStatus,
  buildFreshnessStatus,
  buildNextActionStatus,
  buildProjectStatus,
  resolveDefaultPlatform,
  type DevServerReadiness,
} from './sections';
import type {
  AuthStatus,
  DevServerStatus,
  FreshnessState,
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
  /** Attach the state-aware next actions to the report, cleared by `--no-followups`. */
  followups?: boolean;
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
    freshness: { ios: freshnessOf(report, 'ios'), android: freshnessOf(report, 'android') },
    skillsDiscovered: report.skills?.discovered ?? 0,
    skillsLinked: report.skills?.linked ?? 0,
    sectionErrors: Object.keys(report.errors),
  });

  Log.log(
    options.json ? JSON.stringify({ ...report, followups }, null, 2) : formatStatusReport(report)
  );
  // Silent on purpose: repeating the plan the `next` line already names would be noise, so the
  // follow-ups reach a driving agent through the event and the JSON report only.
  reportFollowUps('status', followups, { silent: true });
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
  const [project, devServer, skills, auth] = await Promise.all([
    attemptAsync(() => readProjectAsync(projectRoot)),
    attemptAsync(() => probeDevServerStatusAsync(projectRoot, options)),
    attemptAsync(() => readSkillsStatusAsync(projectRoot)),
    attemptAsync<AuthStatus>(() => readAuthPreflightAsync(projectRoot)),
  ]);

  const errors: Partial<Record<StatusSectionName, string>> = {};
  const report: StatusReport = {
    project: null,
    expoGo: null,
    freshness: null,
    devServer: null,
    skills: null,
    auth: null,
    next: null,
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

  if ('value' in project) {
    const { state, packageName } = project.value;
    // Advisory by contract, and read after the probe, so the fingerprint it is compared against
    // and the record it is compared to describe the same moment.
    const lastBuild = readLastBuildFingerprints(projectRoot);
    // The probe rides along whole, so `--json` is also the project brief: the sections round its
    // facts off for a terminal, and a caller that wants them exactly reads `probe`.
    //
    // Whole except the fingerprint's `sources`, which are dropped here and nowhere else. They are
    // the list the hash was computed from — tens of thousands of bytes for a real project
    // [observed — ~25 KB for iOS on an SDK 57 Expo Router app, 2026-08-24] — and this report
    // answers a freshness question, for which the hash is the entire answer. `exagent impact` is
    // the command that reads them, and it fingerprints for itself. Dropping them keeps `status`
    // the instant, small report its contract promises (llp/0004 §`exagent status`).
    report.probe = { ...state, fingerprint: { ...state.fingerprint, sources: undefined } };
    report.project = buildProjectStatus(state, packageName);
    report.expoGo = buildExpoGoStatus(state);
    report.freshness = buildFreshnessStatus(state, lastBuild);
    report.next = buildNextActionStatus(
      state,
      lastBuild,
      options.platform ?? resolveDefaultPlatform(state),
      report.devServer
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

  return report;
}

/** The probed project state, plus the name only the project's own `package.json` knows. */
async function readProjectAsync(
  projectRoot: string
): Promise<{ state: ProjectState; packageName: string | null }> {
  const [state, packageJson] = await Promise.all([
    probeProjectStateAsync(projectRoot),
    readProjectPackageJsonAsync(projectRoot),
  ]);
  return { state, packageName: packageJson?.name ?? null };
}

/**
 * Probe the dev server, giving up after {@link DEV_SERVER_PROBE_TIMEOUT_MS}.
 *
 * The probe itself never throws, so the timeout is the only way this reports "unknown". The
 * request that timed out is abandoned rather than cancelled: the probe takes no abort signal, and
 * status has already printed by the time a black-holed request gives up.
 */
async function probeDevServerStatusAsync(
  projectRoot: string,
  options: StatusOptions
): Promise<DevServerStatus> {
  const timeoutMs = options.devServerTimeoutMs ?? DEV_SERVER_PROBE_TIMEOUT_MS;
  // No explicit URL: 8081 first, then the ports `expo start` walks to (see devServer.ts).
  const discovery = await raceWithTimeoutAsync(
    discoverDevServerAsync(options.devServerUrl ?? undefined, { timeoutMs, projectRoot }),
    timeoutMs * 2
  );
  if (discovery == null) {
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
  return buildDevServerStatus(
    discovery.devServerUrl,
    discovery,
    await readDevServerReadinessAsync(projectRoot, discovery, options)
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
 * changed since the last `exagent skills` run reads as out of sync instead of as done.
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

function freshnessOf(report: StatusReport, platform: NativePlatform): FreshnessState | null {
  return report.freshness?.platforms.find((entry) => entry.platform === platform)?.state ?? null;
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
