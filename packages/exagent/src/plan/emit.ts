// @ref llp/0004-smart-start-and-project-state.rfc.md §Contract
// "Emit the plan first": one structured event for the driving agent, one table for the human.
// Both are written before any step is spawned, so `--plan` and `--smart` print the same thing.

import { Log } from '../log';
import type { StartPlan } from '../project/types';
import { event } from './events';
import { formatStartPlan } from './format';

/** Whether the emitted plan is about to be executed. */
export type StartPlanMode = 'plan' | 'smart';

export interface EmitStartPlanOptions {
  mode: StartPlanMode;
  /** Print the plan as JSON instead of a table, for callers that parse stdout. */
  json?: boolean;
}

export function emitStartPlan(plan: StartPlan, { mode, json }: EmitStartPlanOptions): void {
  event('start_plan', {
    mode,
    target: plan.target,
    rule: plan.rule,
    steps: plan.steps,
    reasons: plan.reasons,
  });
  // In JSON mode the plan is the only thing on stdout, so `exagent start --plan --json` can be
  // piped into a parser. Agents that read the JSONL events get the same plan either way.
  Log.log(json ? JSON.stringify(plan, null, 2) : formatStartPlan(plan));
}
