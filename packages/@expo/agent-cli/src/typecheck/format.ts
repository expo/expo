// @ref llp/0006-agent-native-cli-surface.rfc.md §Output contract — one fact per line, `label value`
// style, with the locations in the shape an editor and an agent both open.

import chalk from 'chalk';

import { describeMissingGeneratedTypes } from './generatedTypes';
import type { TypeCheckReport, TypeError } from './types';

/** Width of the label column, matching `@expo/agent-cli status` and `inspect:config-plugins`. */
const LABEL_WIDTH = 13;

/** How many diagnostics are printed before the rest are counted instead. */
const MAX_PRINTED = 20;

/** The human report: the verdict, then one block per diagnostic. */
export function formatTypeCheckReport(report: TypeCheckReport): string {
  if (!report.checked) {
    return [
      row('Typecheck', chalk.dim('not run')),
      row('Why', report.reason ?? 'no compiler ran'),
    ].join('\n');
  }

  const lines = [
    row(
      'Typecheck',
      report.errorCount === 0
        ? chalk.green('no type errors')
        : chalk.red(`${report.errorCount} ${report.errorCount === 1 ? 'error' : 'errors'}`)
    ),
    row('Took', `${report.durationMs}ms`),
  ];

  if (report.errorCount === 0) {
    return lines.join('\n');
  }

  // Above the diagnostics, not below them: it changes what they mean, and a reader who meets it
  // after twenty errors has already started editing the wrong file (F64).
  if (report.generatedTypes) {
    lines.push(row('Generated', chalk.yellow(report.generatedTypes.file + ' is missing')));
    lines.push(chalk.dim(describeMissingGeneratedTypes(report.generatedTypes)));
  }

  lines.push('');
  for (const error of report.errors.slice(0, MAX_PRINTED)) {
    lines.push(formatTypeError(error));
  }
  if (report.errorCount > MAX_PRINTED) {
    lines.push(chalk.dim(`… and ${report.errorCount - MAX_PRINTED} more`));
  }
  return lines.join('\n');
}

/**
 * One diagnostic as `file:line:column  TS1234  message`.
 *
 * `file:line:column` rather than the compiler's own `file(line,column)`, because that is the form
 * an editor jumps to and the form every other location in this CLI is printed in — the stack
 * frames of `runtime:errors` and the `filename`/`lineNumber` of a broken bundle.
 */
export function formatTypeError(error: TypeError): string {
  const where =
    error.file == null
      ? chalk.dim('(no file)')
      : `${error.file}${error.line == null ? '' : `:${error.line}:${error.column}`}`;
  // The nested explanation of a diagnostic is indented under it, so one error reads as one block.
  const [first, ...rest] = error.message.split('\n');
  const detail = rest.map((line) => `  ${chalk.dim(line)}`);
  return [`${where} ${chalk.dim(error.code)} ${first}`, ...detail].join('\n');
}

function row(label: string, value: string): string {
  return `${chalk.dim(label.padEnd(LABEL_WIDTH))}${value}`;
}
