// @ref llp/0009-smart-followups.rfc.md §Examples per command — `status` already carries "next" by
// design (llp/0004), so these follow-ups are the actions that line does *not* name. They are
// emitted as an event and embedded in `--json`; the text report keeps its single `next` line.

import type { StatusReport } from '../status/types';
import { capFollowUps, type FollowUp } from './types';

/** The actions the status report proves are available, in the order they are worth taking. */
export function buildStatusFollowUps(report: StatusReport): FollowUp[] {
  const followups: FollowUp[] = [];

  if (report.devServer?.running && report.devServer.appsConnected > 0) {
    followups.push({
      id: 'runtime-errors',
      command: 'npx exagent runtime:errors',
      why: 'An app is connected to the dev server, so what it throws can be read from here.',
    });
  }

  if (report.skills && report.skills.discovered > report.skills.linked) {
    followups.push({
      id: 'skills-sync',
      command: 'npx exagent skills:sync',
      why: `Only ${report.skills.linked} of ${report.skills.discovered} discovered skills are linked, so the rest are invisible to the agent.`,
    });
  }

  // The reasons Expo Go is out are in the report already (`probe.expoGo.reasons`), so the follow-up
  // is the action they imply rather than a command that would only print them again.
  if (report.expoGo?.compatible === false && report.project?.usesDevClient === false) {
    followups.push({
      id: 'install-dev-client',
      command: 'npx exagent install expo-dev-client',
      why: 'Expo Go cannot run this project and expo-dev-client is not a dependency, so no development build can be made yet.',
    });
  }

  return capFollowUps(followups);
}
