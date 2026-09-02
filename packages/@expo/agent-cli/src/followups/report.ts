// @ref llp/0009-smart-followups.rfc.md §The follow-up block
// The one place follow-ups reach the outside world: the `cli:followups` event for a driving
// agent, and the `Suggested next:` section for a human terminal. Nothing here can change an exit code.

import { event } from '../events';
import * as Log from '../log';
import { env } from '../utils/env';
import { formatFollowUps } from './format';
import { capFollowUps, type FollowUp } from './types';

export interface ReportFollowUpsOptions {
  /** The command prints one JSON object on stdout, so the `Suggested next:` section is left out. */
  json?: boolean;
  /**
   * Never print the section, even in text mode. `@expo/agent-cli status` uses this: its own `next` line
   * already names the command a follow-up would repeat (llp/0004 §Status).
   */
  silent?: boolean;
}

/**
 * Whether follow-ups should be computed at all.
 *
 * Callers check this before building, so a suppressed run does no work and embeds an empty list
 * in its `--json` payload — the key set of every command stays the same either way.
 *
 * @param flag `false` when `--no-followups` was passed, `undefined` when the command has no flag.
 */
export function followUpsEnabled(flag: boolean | undefined): boolean {
  return flag !== false && !env.AGENT_CLI_NO_FOLLOWUPS;
}

/**
 * Emit the follow-ups of one command: always the event, and the `Suggested next:` section unless the
 * caller owns stdout.
 *
 * @param command The CLI command name the follow-ups belong to, e.g. `start` or `runtime:errors`.
 * @returns the capped list, for the caller to embed in its `--json` payload.
 */
export function reportFollowUps(
  command: string,
  followups: FollowUp[],
  options: ReportFollowUpsOptions = {}
): FollowUp[] {
  if (!followups.length) {
    return [];
  }

  const capped = capFollowUps(followups);
  event('followups', { command, followups: capped });

  if (!options.json && !options.silent) {
    Log.log(formatFollowUps(capped));
  }
  return capped;
}
