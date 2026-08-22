// @ref llp/0008-guardrails.rfc.md §Plan-with-cost dry run
// The human guardrail on the plan-first contract: since `exagent start` runs the plan it printed,
// a person watching a terminal gets one chance to say no before a prebuild or a native build
// starts. Agents and CI never see this prompt — they are non-interactive, and `--plan` is the
// approval hop built for them.

import chalk from 'chalk';

import { Log } from '../log';
import { event } from '../plan/events';
import type { PlanStep, StartPlan } from '../project/types';
import { isInteractive } from '../utils/interactive';
import { confirmAsync } from '../utils/prompts';
import type { StartOptions } from './resolveOptions';

/**
 * Whether one step costs enough to be worth asking about.
 *
 * Anything longer than seconds is a prebuild, an install or a native build: it writes into the
 * project, takes minutes, and is the reason the guardrail exists. A plan that only starts a dev
 * server is exactly what the command was asked for, so it runs unannounced.
 */
function isExpensiveStep(step: PlanStep): boolean {
  return step.timeClass !== 'seconds';
}

/**
 * Whether this run asks the person in front of the terminal to confirm the plan.
 *
 * `--json` counts as machine use, like a non-interactive stream does: the prompt would land in
 * the middle of the payload the caller is parsing.
 */
export function planNeedsConfirmation(plan: StartPlan, options: StartOptions): boolean {
  if (options.yes || options.json || !isInteractive()) {
    return false;
  }
  return plan.steps.some(isExpensiveStep);
}

/**
 * Ask about a plan that builds, once, before its first step runs.
 *
 * @returns whether the plan may run. `true` whenever no confirmation is needed.
 */
export async function confirmPlanAsync(plan: StartPlan, options: StartOptions): Promise<boolean> {
  if (!planNeedsConfirmation(plan, options)) {
    return true;
  }

  const approved = (await confirmAsync({ message: 'Run this plan?' })) === true;
  if (!approved) {
    event('start_plan_declined', { rule: plan.rule, steps: plan.steps.length });
    Log.log(
      chalk`Nothing ran: the plan was not confirmed.\nTry: {bold npx exagent start --plan} to print it again, or {bold npx exagent start --passthrough} to start the dev server without planning.`
    );
  }
  return approved;
}
