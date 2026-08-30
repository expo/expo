// Deferred from v1 (2026-08-26) — kept as reference, imported by nothing; see llp/0017 §doctor:fix
//
// @ref llp/0006-agent-native-cli-surface.rfc.md §Output contract — `label value` lines first, then
// one block per step. A plan is read to decide whether to run it, so every step says what it costs
// (size, time class) and what puts it back on the same screen as what it deletes.

import chalk from 'chalk';

import { PROGRAM_PREFIX } from '../../programName';
import type { FixPlanPayload, FixStep, FixStepResult } from './fixTypes';

/** Width of the label column, matching `@expo/agent-cli status` and `doctor:check`. */
const LABEL_WIDTH = 13;

/** The whole report: the header, the steps, what was skipped, and what to do about it. */
export function formatFixPlan(payload: FixPlanPayload): string {
  const blocks: string[] = [header(payload)];

  if (payload.steps.length) {
    blocks.push(
      [
        chalk.bold(payload.applied ? 'Ran' : 'Would run'),
        ...payload.steps.map((step) => formatStep(step, resultFor(payload, step.id))),
      ].join('\n')
    );
  }

  if (payload.skipped.length) {
    blocks.push(
      [
        chalk.bold('Skipped'),
        ...payload.skipped.map(
          (skipped) => `  ${chalk.dim(skipped.id.padEnd(22))}${skipped.reason}`
        ),
      ].join('\n')
    );
  }

  if (payload.checkpoint) {
    blocks.push(chalk.dim(payload.checkpoint.note));
  }

  blocks.push(closing(payload));
  return blocks.join('\n\n');
}

/**
 * What the steps did, without repeating what they were.
 *
 * For the one path where the plan was already printed: an interactive terminal that was asked to
 * confirm has read the whole plan a moment ago, and printing it again would bury the outcome.
 */
export function formatFixResults(payload: FixPlanPayload): string {
  const lines = (payload.results ?? []).map(
    (result) =>
      `${statusMark(result.status)} ${chalk.bold(result.id.padEnd(22))}${
        result.status === 'done' ? chalk.dim(`${result.durationMs} ms  `) : ''
      }${statusColor(result.status)(result.detail)}`
  );
  return [...lines, '', closing(payload)].join('\n');
}

function header(payload: FixPlanPayload): string {
  const total = payload.steps.reduce((sum, step) => sum + (step.bytes ?? 0), 0);
  const unmeasured = payload.steps.some((step) => step.bytes == null);
  return [
    row('Project', payload.projectRoot),
    row('Tier', payload.tier),
    row(
      'Mode',
      payload.applied
        ? chalk.yellow('applied')
        : chalk.green('dry run — nothing was touched, pass --apply to run it')
    ),
    row('Platforms', payload.platforms.join(', ') || 'none'),
    row(
      'Installs',
      `${payload.packageManager.name}${
        payload.packageManager.lockfile
          ? chalk.dim(`  (${payload.packageManager.lockfile})`)
          : chalk.dim('  (no lockfile found — this is the fallback)')
      }`
    ),
    row(
      'Frees',
      payload.steps.length
        ? `${formatBytes(total)}${unmeasured ? ' or more — one target was too large to measure' : ''} in ${payload.steps.length} ${payload.steps.length === 1 ? 'step' : 'steps'}`
        : 'nothing — this project has none of this tier’s state'
    ),
  ].join('\n');
}

/** One step: what it is, what it costs, what it deletes, and what brings it back. */
function formatStep(step: FixStep, result: FixStepResult | null): string {
  const mark = result ? statusMark(result.status) : chalk.dim('·');
  const lines = [
    `${mark} ${chalk.bold(step.id)}${chalk.dim(
      `  ${step.kind}  ${formatBytes(step.bytes)}  ${step.timeClass}${
        step.scope === 'machine' ? '  machine-wide' : ''
      }`
    )}`,
    `    ${step.reason}`,
  ];
  for (const target of step.targets) {
    lines.push(chalk.dim(`    ${target}`));
  }
  if (step.argv) {
    lines.push(chalk.dim(`    $ ${step.argv.join(' ')}${step.cwd ? `  (in ${step.cwd})` : ''}`));
  }
  lines.push(chalk.dim(`    back: ${step.recoverable}`));
  if (result && result.status !== 'done') {
    lines.push(`    ${statusColor(result.status)(result.detail)}`);
  }
  return lines.join('\n');
}

/** The last line, which is the one an agent acts on. */
function closing(payload: FixPlanPayload): string {
  if (!payload.applied) {
    return payload.steps.length
      ? chalk`Nothing was deleted. Run {bold ${PROGRAM_PREFIX} doctor:fix --tier ${payload.tier} --apply} to do it.`
      : `Nothing was deleted, and there was nothing to delete.`;
  }
  const failed = payload.results?.find((result) => result.status === 'failed');
  return failed
    ? chalk.red(`The "${failed.id}" step failed, and the steps after it did not run.`)
    : `Done. ${payload.results?.filter((result) => result.status === 'done').length ?? 0} steps ran.`;
}

function resultFor(payload: FixPlanPayload, id: string): FixStepResult | null {
  return payload.results?.find((result) => result.id === id) ?? null;
}

function statusMark(status: FixStepResult['status']): string {
  return statusColor(status)(status === 'done' ? '✔' : status === 'failed' ? '✖' : '·');
}

function statusColor(status: FixStepResult['status']): (text: string) => string {
  return status === 'done' ? chalk.green : status === 'failed' ? chalk.red : chalk.dim;
}

/**
 * A size a person can weigh, or the honest absence of one.
 *
 * `null` means the walk stopped rather than that the target is empty, and printing `0 B` for a
 * directory that is 400 MB would be the one number a reader must not be given.
 */
export function formatBytes(bytes: number | null): string {
  if (bytes == null) {
    return 'size not measured';
  }
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  return `${unit === 0 ? value : value.toFixed(1)} ${units[unit]}`;
}

function row(label: string, value: string): string {
  return `${chalk.dim(label.padEnd(LABEL_WIDTH))}${value}`;
}
