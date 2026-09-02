// @ref llp/0015-backend-selection-and-config.rfc.md §The run target
// Which app the project is planned into, when the developer has an opinion. Pure, and tiny: the
// only question is which of two things said it, and what sentence the plan prints for that.

import { PROGRAM_NAME } from '../programName';
import type { RunTarget } from '../settings/types';

/** What asked for a run target. */
export type RunTargetSource = 'flag' | 'config';

/** A run target somebody asked for, and the sentence that says who. */
export interface RunTargetChoice {
  target: RunTarget;
  source: RunTargetSource;
  /** Named here so `--plan`, `status` and the follow-ups all say it the same way. */
  why: string;
}

export interface SelectRunTargetInput {
  /** What a flag on this command line asked for, or null when none did. */
  requested: RunTarget | null;
  /** What the project's config asked for, or null when it says nothing. */
  configured: RunTarget | null;
}

/**
 * Pick the run target somebody asked for, or `null` when nobody did.
 *
 * `null` is the common case and the important one: with nobody asking, the decision table decides
 * on the project's own facts, exactly as it always has. Only an explicit preference reaches here,
 * and a flag beats the config for the same reason it does everywhere else — it is the most recent
 * thing anyone said.
 */
export function selectRunTarget({
  requested,
  configured,
}: SelectRunTargetInput): RunTargetChoice | null {
  if (requested) {
    return { target: requested, source: 'flag', why: whyOf(requested, 'flag') };
  }
  if (configured) {
    return { target: configured, source: 'config', why: whyOf(configured, 'config') };
  }
  return null;
}

function whyOf(target: RunTarget, source: RunTargetSource): string {
  const app = target === 'dev-build' ? 'a development build' : 'Expo Go';
  const flag = target === 'dev-build' ? '--dev-client' : '--go';
  return source === 'flag'
    ? `${flag} asked for ${app}.`
    : `The ${PROGRAM_NAME} config asks for ${app}.`;
}
