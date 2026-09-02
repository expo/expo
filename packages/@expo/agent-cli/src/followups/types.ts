// @ref llp/0009-smart-followups.rfc.md §The follow-up block
// The follow-up block: what a command attaches to its own output so a driving agent never has
// to guess the next command. Pure data — the builders in this directory are the only producers.

/** One next action, computed from state the command already probed. */
export interface FollowUp {
  /**
   * Stable kebab-case id, e.g. `eas-build`. Ids are the assertable half of the contract: an eval
   * checks that "after start, follow-ups include `eas-build`", so they outlive wording changes.
   */
  id: string;
  /**
   * The exact thing to run or open next, ready to paste. Usually a command; for the real-device
   * hint it is the URL a phone opens, because that is what the next step actually is.
   */
  command: string;
  /** Why this is worth doing now, in one sentence, from the state that produced it. */
  why: string;
}

/**
 * How many follow-ups one command may print.
 *
 * Follow-ups are context an agent did not ask for, so the budget is small on purpose: three lines
 * are read, ten are skipped.
 */
export const MAX_FOLLOWUPS = 3;

/** Keep the most relevant follow-ups, which every builder puts first. */
export function capFollowUps(followups: FollowUp[]): FollowUp[] {
  return followups.slice(0, MAX_FOLLOWUPS);
}
