// @ref llp/0004-smart-start-and-project-state.rfc.md §Plan contract
// "Emit the plan first": one structured event for the driving agent, one table for the human.
// Both are written before any step is spawned, so `dev --plan` and `dev` print the same thing.

import type { FollowUp } from '../followups/types';
import { Log } from '../log';
import type { StartPlan } from '../project/types';
import { event } from './events';
import { formatStartPlan } from './format';

/** Whether the emitted plan is about to be executed. */
export type StartPlanMode = 'plan' | 'smart';

/** Where the emitted plan goes on stdout. The `cli:start_plan` event is written either way. */
export type StartPlanPrint =
  /** The table, for a person. */
  | 'text'
  /** One JSON object, for a caller that parses stdout. */
  | 'json'
  /**
   * Nowhere.
   *
   * For a `--json` run of the plan: stdout carries exactly one object, printed when the run ends,
   * and the plan printed up front would be a second one (llp/0010 §The `--json` error envelope).
   * The plan still reaches a driving agent first, on the event stream.
   */
  | 'none';

export interface EmitStartPlanOptions {
  mode: StartPlanMode;
  /** Print the plan as JSON instead of a table, for callers that parse stdout. */
  json?: boolean;
  /** Where the plan goes. Defaults to what {@link EmitStartPlanOptions.json} asks for. */
  print?: StartPlanPrint;
  /**
   * Next actions to embed in the `--json` payload, empty when they are suppressed. The `Suggested next:`
   * section of the text output and the `cli:followups` event are the caller's own, so the plan
   * stays the only thing this module prints.
   *
   * @see llp/0009-smart-followups.rfc.md §The follow-up block
   */
  followups?: FollowUp[];
}

export function emitStartPlan(
  plan: StartPlan,
  { mode, json, print = json ? 'json' : 'text', followups = [] }: EmitStartPlanOptions
): void {
  event('start_plan', {
    mode,
    target: plan.target,
    rule: plan.rule,
    steps: plan.steps,
    reasons: plan.reasons,
    // @ref llp/0004-smart-start-and-project-state.rfc.md §Where a build runs — the event stream is
    // the channel a driving agent reads the plan on, and "does this machine have Xcode" is exactly
    // the sort of thing it would otherwise go and shell out to find.
    buildLocation: plan.buildLocation,
  });
  if (print === 'none') {
    return;
  }
  // In JSON mode the plan is the only thing on stdout, so `@expo/agent-cli dev --plan --json` can be
  // piped into a parser. Agents that read the JSONL events get the same plan either way.
  Log.log(
    print === 'json' ? JSON.stringify({ ...plan, followups }, null, 2) : formatStartPlan(plan)
  );
}
