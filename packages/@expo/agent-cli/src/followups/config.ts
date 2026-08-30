// @ref llp/0009-smart-followups.rfc.md §Examples per command — the next actions of
// `inspect:config-plugins`. The summary answers "how much did the plugins produce"; these are the two
// ways to get at *what* they produced, and they are only offered when the run did not already ask
// for it.

import type { EffectiveConfigReport } from '../config/types';
import { PROGRAM_PREFIX } from '../programName';
import { capFollowUps, type FollowUp } from './types';

export interface ConfigEffectiveFollowUpInput {
  report: EffectiveConfigReport;
  /** The run printed its whole payload already, so pointing at `--json` would repeat it. */
  json: boolean;
  /** The `--file` the run printed, or null when it printed the summary. */
  file: string | null;
}

/** What to run next after a summary that only counted things. */
export function buildConfigEffectiveFollowUps({
  report,
  json,
  file,
}: ConfigEffectiveFollowUpInput): FollowUp[] {
  if (file != null) {
    return [];
  }

  const followups: FollowUp[] = [];

  // The `Info.plist` is where the permission strings and the URL schemes live, so it is the mod an
  // agent asks about first — and only worth suggesting when this project actually produced one.
  if (report.platforms.ios?.infoPlist != null) {
    followups.push({
      id: 'config-effective-file',
      command: `${PROGRAM_PREFIX} inspect:config-plugins --file infoPlist`,
      why: 'The summary counts the Info.plist keys; --file prints them with their values.',
    });
  }

  if (!json) {
    followups.push({
      id: 'config-effective-json',
      command: `${PROGRAM_PREFIX} inspect:config-plugins --json`,
      why: 'The JSON report carries every introspected value, not just how many of them there are.',
    });
  }

  return capFollowUps(followups);
}
