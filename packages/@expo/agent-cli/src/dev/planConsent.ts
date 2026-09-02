// @ref llp/0008-guardrails.rfc.md §Plan-with-cost dry run
// @ref llp/0008-guardrails.rfc.md §Consent is a re-run, never a prompt
//
// The guardrail on the plan-first contract: since `@expo/agent-cli dev` runs the plan it printed, a
// prebuild or a native build should not start in front of somebody who only wanted a dev server.
//
// It used to be a question — `? Run this plan? › (Y/n)`. It is a **stop** now [confirmed,
// 2026-08-29: "because the tool is for agent … if you need prompt, exit and share the next hint to
// call the command again with `--yes`"]. The plan is on screen either way; what changed is that the
// command ends there and hands back the line that runs it, instead of holding a cursor open for an
// answer that an agent driving a pty has no way to give.
//
// The terminal is still what triggers it, and only the trigger. A run with no terminal is an agent
// or a CI job that asked for the work and is waiting for it, and stopping *that* would break the
// path this CLI exists for; a terminal is the one piece of evidence that somebody is watching the
// plan go by. `--json` is machine use for the same reason, and `--yes` is the consent itself.

import chalk from 'chalk';

import { Log } from '../log';
import { event } from '../plan/events';
import type { PlanStep, StartPlan } from '../project/types';
import { consentRerunCommand } from '../utils/consent';
import { isInteractive } from '../utils/interactive';
import type { DevOptions } from './resolveOptions';

/**
 * Whether one step costs enough to be worth stopping for.
 *
 * Anything longer than seconds is a prebuild, an install or a native build: it writes into the
 * project, takes minutes, and is the reason the guardrail exists. A plan that only starts a dev
 * server is exactly what the command was asked for, so it runs unannounced.
 */
function isExpensiveStep(step: PlanStep): boolean {
  return step.timeClass !== 'seconds';
}

/**
 * Whether this run stops short of the plan and asks to be run again with `--yes`.
 *
 * `--json` counts as machine use, like a non-interactive stream does: its caller parses stdout and
 * has already said, by asking for a machine-readable answer, that it wants the work done.
 */
export function planNeedsConsent(plan: StartPlan, options: DevOptions): boolean {
  if (options.yes || options.json || !isInteractive()) {
    return false;
  }
  return plan.steps.some(isExpensiveStep);
}

/**
 * Decide whether the plan may run, and print the way to run it when it may not.
 *
 * The plan itself was printed by the caller before this is reached, so the block below adds only
 * the two things the reader does not have yet: that nothing ran, and the exact command that
 * changes that.
 *
 * @param processArgv this process' `process.argv`. Injectable for tests, which have none.
 * @returns whether the plan may run. `true` whenever no consent is needed.
 */
export function hasPlanConsent(
  plan: StartPlan,
  options: DevOptions,
  processArgv: readonly string[] = process.argv
): boolean {
  if (!planNeedsConsent(plan, options)) {
    return true;
  }

  const rerun = consentRerunCommand(['dev'], processArgv);
  event('start_plan_needs_consent', { rule: plan.rule, steps: plan.steps.length, rerun });
  Log.log(
    chalk`Nothing ran: this plan has a step that takes minutes and writes into the project, so it runs only when the command says so.\nRun it: {bold ${rerun}}\nThe plan above is what would run; {bold --plan} prints it again without running anything.`
  );
  return false;
}
