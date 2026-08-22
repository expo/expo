// @ref llp/0004-smart-start-and-project-state.rfc.md §Contract
// @ref llp/0008-guardrails.rfc.md §Plan-with-cost dry run
// The human-readable half of the plan-first contract. Agents read the `cli:start_plan` event;
// this is what a person sees in the terminal before anything runs.

import chalk from 'chalk';

import type { StartPlan, TimeClass } from '../project/types';

const TIME_CLASS_LABELS: Record<TimeClass, string> = {
  seconds: '~seconds',
  'a-minute': '~a minute',
  minutes: '~a few minutes',
  'many-minutes': '~many minutes',
};

/** Label one time class for display. Never a precise estimate, by contract. */
export function formatTimeClass(timeClass: TimeClass): string {
  return TIME_CLASS_LABELS[timeClass];
}

/** Render a plan as a table: what runs, in what order, at what cost, and why. */
export function formatStartPlan(plan: StartPlan): string {
  const commands = plan.steps.map((step) => step.argv.join(' '));
  const commandWidth = Math.max(...commands.map((command) => command.length));

  const lines = [
    chalk`{bold Smart start plan} {dim (rule: ${plan.rule}, target: ${plan.target})}`,
    '',
  ];

  for (const [index, step] of plan.steps.entries()) {
    const command = commands[index]!.padEnd(commandWidth);
    lines.push(
      chalk`  ${index + 1}. {cyan ${command}}  {dim ${formatTimeClass(step.timeClass)}}`,
      chalk`     {dim ${step.reason}}`
    );
  }

  lines.push('', chalk`  {bold Why}`);
  for (const reason of plan.reasons) {
    lines.push(`    - ${reason}`);
  }

  return lines.join('\n');
}
