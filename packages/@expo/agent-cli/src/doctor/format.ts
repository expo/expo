// @ref llp/0006-agent-native-cli-surface.rfc.md §Output contract — `label value` lines, then the
// checks that failed. A passing check has nothing to say, so it is counted and not listed: the
// whole point of a diagnostic is the part that is wrong.

import chalk from 'chalk';

import type { DoctorReport } from './types';

/** Width of the label column, matching `@expo/agent-cli status`. */
const LABEL_WIDTH = 13;

/** The report: the counts, how well the output was understood, and every failure with its advice. */
export function formatDoctorReport(report: DoctorReport): string {
  const total = report.passed + report.failed;
  // A parse that found nothing counted nothing, and a green `0` there would read as "no check
  // failed" when the truth is "no check was read". Both count lines say so.
  const unread = report.parse === 'failed';
  const blocks: string[] = [
    [
      row('Checks', unread ? chalk.yellow('not reported') : `${report.passed}/${total} passed`),
      row(
        'Failed',
        unread
          ? chalk.yellow('not reported')
          : report.failed
            ? chalk.red(String(report.failed))
            : chalk.green('0')
      ),
      row('Parse', parseLine(report)),
    ].join('\n'),
  ];

  for (const check of report.checks) {
    if (check.status !== 'failed') {
      continue;
    }
    const lines = [chalk.red(`✖ ${check.name}`)];
    for (const issue of check.issues) {
      lines.push(`  ${issue}`);
    }
    for (const advice of check.advice) {
      lines.push(chalk.green(`  → ${advice}`));
    }
    blocks.push(lines.join('\n'));
  }

  // A parse that found nothing must not print an empty, confident-looking report: what expo-doctor
  // said is the only answer there is, so it is handed over verbatim.
  if (report.parse === 'failed') {
    blocks.push(chalk.dim('expo-doctor said:'), report.raw.trim());
  }

  return blocks.join('\n\n');
}

/** What `parse` means, in the one clause a reader needs to know whether to read `raw`. */
function parseLine(report: DoctorReport): string {
  switch (report.parse) {
    case 'full':
      return 'full';
    case 'best-effort':
      return chalk.yellow('best-effort (--json carries the full text under "raw")');
    case 'failed':
      return chalk.yellow('failed — expo-doctor printed nothing this command recognizes');
  }
}

function row(label: string, value: string): string {
  return `${chalk.dim(label.padEnd(LABEL_WIDTH))}${value}`;
}
