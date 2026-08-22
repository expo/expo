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
import { readLastBuildFingerprints } from '../plan/lastBuild';
import type { NativePlatform, PlanPlatform } from '../plan/types';
import { readProjectPackageJsonAsync } from '../project/nodeModules';
import { probeProjectStateAsync } from '../project/probe';
import type { ProjectState } from '../project/types';
import { probeDevServerAsync, type DevServerProbe } from '../runtime/devServer';
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
} from './sections';
import type {
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

export interface StatusOptions {
  /** The dev server to probe, from `--dev-server-url` or the default. */
  devServerUrl: string;
  /** Print the report as JSON instead of one line per section. */
  json?: boolean;
  /** Platform the next action targets. Resolved from the project when omitted. */
  platform?: PlanPlatform;
  /** Overrides {@link DEV_SERVER_PROBE_TIMEOUT_MS}, for tests. */
  devServerTimeoutMs?: number;
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
 * The three independent reads (project, dev server, skills) run in parallel, and each is wrapped
 * on its own: an unreadable project still reports a running dev server, and a dependency graph
 * the skill discovery cannot walk still reports the project.
 */
export async function collectStatusReportAsync(
  projectRoot: string,
  options: StatusOptions
): Promise<StatusReport> {
  const [project, devServer, skills] = await Promise.all([
    attemptAsync(() => readProjectAsync(projectRoot)),
    attemptAsync(() => probeDevServerStatusAsync(options)),
    attemptAsync(() => readSkillsStatusAsync(projectRoot)),
  ]);

  const errors: Partial<Record<StatusSectionName, string>> = {};
  const report: StatusReport = {
    project: null,
    expoGo: null,
    freshness: null,
    devServer: null,
    skills: null,
    next: null,
    errors,
  };

  if ('value' in project) {
    const { state, packageName } = project.value;
    // Advisory by contract, and read after the probe, so the fingerprint it is compared against
    // and the record it is compared to describe the same moment.
    const lastBuild = readLastBuildFingerprints(projectRoot);
    report.project = buildProjectStatus(state, packageName);
    report.expoGo = buildExpoGoStatus(state);
    report.freshness = buildFreshnessStatus(state, lastBuild);
    report.next = buildNextActionStatus(
      state,
      lastBuild,
      options.platform ?? resolveDefaultPlatform(state)
    );
  } else {
    // One cause, one note. The other three sections are left null, and the project line says why.
    errors.project = project.error;
  }

  if ('value' in devServer) {
    report.devServer = devServer.value;
  } else {
    errors.devServer = devServer.error;
  }

  if ('value' in skills) {
    report.skills = skills.value;
  } else {
    errors.skills = skills.error;
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
async function probeDevServerStatusAsync(options: StatusOptions): Promise<DevServerStatus> {
  const timeoutMs = options.devServerTimeoutMs ?? DEV_SERVER_PROBE_TIMEOUT_MS;
  const probe = await raceWithTimeoutAsync(probeDevServerAsync(options.devServerUrl), timeoutMs);
  const timedOut: DevServerProbe = {
    reachable: false,
    targets: [],
    reason: `the dev server did not answer within ${timeoutMs}ms`,
  };
  return buildDevServerStatus(options.devServerUrl, probe ?? timedOut);
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
