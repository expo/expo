// @ref llp/0004-smart-start-and-project-state.rfc.md §Plan contract
// @ref llp/0008-guardrails.rfc.md §Plan-with-cost dry run
// The human-readable half of the plan-first contract. Agents read the `cli:start_plan` event;
// this is what a person sees in the terminal before anything runs.

import chalk from 'chalk';

import type { StartPlan, TimeClass } from '../project/types';
import { EAS_REQUIREMENT, EAS_WHERE, LOCAL_WHERE, RUNS_ON_LABELS } from '../toolchain/runsOn';
import type { PlanBuildLocation } from '../toolchain/types';

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

  // The time class is padded so the `local` / `eas` column lines up: where a step runs is the
  // fact a reader scans this table for, and a ragged column is one nobody reads.
  const timeWidth = Math.max(...plan.steps.map((step) => formatTimeClass(step.timeClass).length));

  for (const [index, step] of plan.steps.entries()) {
    const command = commands[index]!.padEnd(commandWidth);
    const time = formatTimeClass(step.timeClass).padEnd(timeWidth);
    // A step that builds nothing gets no label rather than a third word: `expo start` does not
    // run "somewhere", it runs here and builds nothing, and saying `local` would blur the one
    // distinction this column exists to draw.
    const where = step.runsOn ? chalk`  {yellow ${RUNS_ON_LABELS[step.runsOn]}}` : '';
    lines.push(
      chalk`  ${index + 1}. {cyan ${command}}  {dim ${time}}${where}`,
      chalk`     {dim ${step.reason}}`
    );
  }

  if (plan.buildLocation) {
    lines.push('', `  ${formatBuildLocation(plan.buildLocation)}`);
  }

  lines.push('', chalk`  {bold Why}`);
  for (const reason of plan.reasons) {
    lines.push(`    - ${reason}`);
  }

  return lines.join('\n');
}

/**
 * One line saying where this plan's build happens and whether this machine can do it.
 *
 * Above the `Why` list rather than inside it: a machine that cannot build is the thing that
 * decides whether the plan below is worth starting at all, and a reader who stops after the table
 * has to have met it. The EAS alternative is on the same line for the same reason — the answer to
 * "I cannot build here" has to arrive with the problem, not a screen later.
 */
export function formatBuildLocation(location: PlanBuildLocation): string {
  const where = location.runsOn === 'local' ? LOCAL_WHERE : EAS_WHERE;
  const needs = location.runsOn === 'local' ? location.requirement : EAS_REQUIREMENT;
  const head = chalk`{bold Build:} {yellow ${RUNS_ON_LABELS[location.runsOn]}} — runs ${where}, needs ${needs}.`;

  // @ref llp/0015-backend-selection-and-config.rfc.md §The selection
  // When something *chose* this backend, why it chose it is the line: the probe's own `Found` /
  // `Not found` answers below describe this machine's toolchain, which is not the question a cloud
  // build raises and is already inside the selection's sentence for a local one. A choice that
  // cannot work here is red, because it is the one line that decides whether to run the plan.
  if (location.selection) {
    // `because` rather than `why`: the head has already said where the build runs, and the full
    // sentence would print "runs in the cloud on EAS … Building in the cloud on EAS: …".
    const chosen = `Chosen because ${location.selection.because}`;
    const line = location.selection.doomed
      ? chalk`${head} {red ${chosen}}`
      : chalk`${head} {dim ${chosen}}`;
    // A chosen *local* build on a machine the probe found without the toolchain: somebody asked
    // for this by name, and the thing they have to know is that it stops at the compiler.
    return location.status === 'missing'
      ? chalk`${line} {red Not found}: ${location.detail} {bold Instead:} ${location.alternativeCommand}`
      : line;
  }

  switch (location.status) {
    case 'present':
      return chalk`${head} {green Found}: ${location.detail}`;
    case 'missing':
      return chalk`${head} {red Not found}: ${location.detail} {bold Instead:} ${location.alternativeCommand}`;
    case 'unknown':
      return chalk`${head} {yellow Not established}: ${location.detail} If it is missing: ${location.alternativeCommand}`;
    default:
      return head;
  }
}
