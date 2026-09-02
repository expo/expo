// @ref llp/0009-smart-followups.rfc.md §Examples per command — `status` already carries "next" by
// design (llp/0004), so these follow-ups are the actions that line does *not* name. They are
// emitted as an event and embedded in `--json`; the text report keeps its single `next` line.

import { PROGRAM_PREFIX } from '../programName';
import { strongestClass } from '../status/assert';
import type { StatusReport } from '../status/types';
import { cachedBuildFollowUp } from './cachedBuild';
import { buildChangeFollowUps } from './change';
import { capFollowUps, type FollowUp } from './types';

/** The actions the status report proves are available, in the order they are worth taking. */
export function buildStatusFollowUps(report: StatusReport): FollowUp[] {
  // @ref llp/0004-smart-start-and-project-state.rfc.md §Not an Expo app
  // Before every rung below, and instead of them: this directory is not this CLI's subject, so the
  // only honest action is to go and find the one that is. The rung this replaces was
  // `npx @expo/agent-cli install expo-dev-client` — the trap, spelled as a follow-up, aimed at whatever
  // repository the caller was standing in.
  if (report.project?.isExpoApp === false) {
    return [
      {
        id: 'not-expo-app',
        command: `${PROGRAM_PREFIX} new my-app`,
        why: 'This package declares no "expo" dependency, so it is not an Expo app: change to the app\'s own directory, or create one here.',
      },
    ];
  }

  const followups: FollowUp[] = [];

  // @ref llp/0011-impact-and-freshness.rfc.md §The build-cache lookup
  // First, because it is the one rung that removes a fifteen-minute step: a platform whose recorded
  // build no longer matches would otherwise be rebuilt, and EAS already has the app that rebuild
  // would produce. Only when *this* project's freshness says so — a fresh platform has the right
  // app installed already, and downloading it again would be work for nothing.
  const downloadable = report.builds?.platforms.find(
    (platform) =>
      platform.state === 'found' && platform.buildId && isStale(report, platform.platform)
  );
  if (downloadable?.buildId) {
    followups.push(cachedBuildFollowUp(downloadable.buildId));
  }

  // @ref llp/0004-smart-start-and-project-state.rfc.md §Status
  // What the class implies, which is the ladder the removed `@expo/agent-cli impact` used to print. Only its **head**: this report has four other things to suggest and a budget
  // of three, so the class contributes its single best next command rather than a ladder of its
  // own. Skipped entirely when a download is already offered above, because that *is* the answer
  // for the class that would otherwise lead here.
  const impactClass = strongestClass(report.freshness);
  if (impactClass && !downloadable) {
    const [best] = buildChangeFollowUps({
      impactClass,
      // The OTA rungs need a verdict, and a default run has not paid for one. `--explain` fills it
      // in, and a run without it gets the class's own rung and no guess about publishing.
      otaSafe: report.freshness?.ota?.safe ?? null,
      cachedBuild: null,
      platform: null,
    });
    if (best) {
      followups.push(best);
    }
  }

  if (report.devServer?.running && report.devServer.appsConnected > 0) {
    followups.push({
      id: 'runtime-errors',
      command: `${PROGRAM_PREFIX} runtime:errors`,
      why: 'An app is connected to the dev server, so what it throws can be read from here.',
    });
  }

  if (report.skills && report.skills.discovered > report.skills.linked) {
    followups.push({
      id: 'skills-sync',
      command: `${PROGRAM_PREFIX} skills:sync`,
      why: `Only ${report.skills.linked} of ${report.skills.discovered} discovered skills are linked, so the rest are invisible to the agent.`,
    });
  }

  // The reasons Expo Go is out are in the report already (`probe.expoGo.reasons`), so the follow-up
  // is the action they imply rather than a command that would only print them again.
  if (report.expoGo?.compatible === false && report.project?.usesDevClient === false) {
    followups.push({
      id: 'install-dev-client',
      command: `${PROGRAM_PREFIX} install expo-dev-client`,
      why: 'Expo Go cannot run this project and expo-dev-client is not a dependency, so no development build can be made yet.',
    });
  }

  return capFollowUps(followups);
}

/**
 * Whether the build this machine recorded for the platform no longer matches.
 *
 * The **local** axis, deliberately, where the report's own freshness line now carries both
 * (llp/0021 §The rules): the rung this gates is the *download*, and it exists exactly
 * for "the app installed here is stale **and** EAS has the one that is not". Reading the effective
 * answer would hide the rung in the one state it is for.
 *
 * `stale` only, never `unknown`: an `unknown` freshness means no fingerprint could be computed
 * here, and a download offered on the strength of nothing would be a guess about which app is
 * installed.
 */
function isStale(report: StatusReport, platform: 'ios' | 'android'): boolean {
  return (
    report.freshness?.platforms.find(
      (entry) => entry.platform === platform && entry.backend === 'local'
    )?.state === 'stale'
  );
}
