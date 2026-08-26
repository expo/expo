// @ref llp/0006-agent-native-cli-surface.rfc.md §Output contract — "one fact per line, label value
// style". The same facts as `--json`, in the shape a terminal and a model reading a terminal both
// get through in one pass.

import chalk from 'chalk';

import type { ExplainReport, Failure, Phase } from './types';

/** Width of the label column, matching `status` and `deploy`. */
const LABEL_WIDTH = 12;

/** How many lines of context the human report prints. `--json` carries all of them. */
const PRINTED_CONTEXT_BEFORE = 3;
const PRINTED_CONTEXT_AFTER = 8;

/** How many lines of `logTail` are printed when nothing was located. */
const PRINTED_TAIL = 20;

/** One line per fact the report holds, then the quoted evidence for the one that matters. */
export function formatExplainReport(report: ExplainReport): string {
  const lines: string[] = [];
  const row = (label: string, value: string) =>
    lines.push(`${chalk.dim(label.padEnd(LABEL_WIDTH))}${value}`);

  row('log', report.source.kind === 'file' ? report.source.path! : 'stdin');
  row('read', readLine(report));
  if (report.phases.length) {
    row('phases', phasesLine(report.phases));
  }

  if (!report.failure) {
    row('failure', chalk.yellow('none located — no rule matched this log'));
    lines.push('');
    lines.push(chalk.dim('  The last lines of the log:'));
    lines.push('');
    lines.push(indent(lastLines(report.logTail, PRINTED_TAIL)));
    return lines.join('\n');
  }

  const { failure } = report;
  row('phase', failure.phase);
  row('signature', chalk.bold(failure.signature));
  row('confidence', confidenceValue(failure.confidence));
  row('line', String(failure.line));
  row('what', failure.message);
  if (failure.suggestedCommand) {
    row('run next', chalk.cyan(failure.suggestedCommand));
  }
  if (failure.docsUrl) {
    row('docs', failure.docsUrl);
  }

  lines.push('');
  lines.push(indent(contextBlock(failure)));

  if (report.otherFailures.length) {
    lines.push('');
    lines.push(chalk.dim(`  ${report.otherFailures.length} other match(es):`));
    for (const other of report.otherFailures) {
      lines.push(`  ${chalk.dim(String(other.line).padStart(6))}  ${other.signature}`);
    }
  }

  return lines.join('\n');
}

/** What was read, and what was dropped to read it. */
function readLine(report: ExplainReport): string {
  const { lines, bytes, truncated, droppedLines } = report.source;
  const size = `${lines} lines · ${formatBytes(bytes)}`;
  return truncated
    ? `${size} ${chalk.yellow(`(first ${droppedLines} lines dropped; the tail is what is reported)`)}`
    : size;
}

/** The phases in order, with the failing one marked. */
function phasesLine(phases: Phase[]): string {
  return phases
    .map((phase) => {
      if (phase.status === 'failed') {
        return chalk.red(`${phase.name} ✗`);
      }
      return phase.status === 'succeeded' ? chalk.dim(phase.name) : phase.name;
    })
    .join(chalk.dim(' → '));
}

/**
 * The confidence, with the sentence that says what to do about it.
 *
 * `low` is the one that has to say something: it means only a summary anchor matched, so the
 * signature names the tool that stopped and not the reason it did.
 */
function confidenceValue(confidence: Failure['confidence']): string {
  switch (confidence) {
    case 'high':
      return chalk.green('high — a rule matched the failing line inside a phase this log named');
    case 'medium':
      return chalk.yellow('medium — a rule matched, but no phase claimed the lines around it');
    case 'low':
      return chalk.yellow(
        'low — only the tool\'s own "I failed" line matched, so the cause is in the context below'
      );
  }
}

/** The quoted log around the match, with the matched line marked. */
function contextBlock(failure: Failure): string {
  const before = failure.context.before.slice(-PRINTED_CONTEXT_BEFORE);
  const after = failure.context.after.slice(0, PRINTED_CONTEXT_AFTER);
  const firstLine = failure.line - before.length;

  const rendered: string[] = [];
  before.forEach((line, index) => rendered.push(gutter(firstLine + index, line, false)));
  rendered.push(gutter(failure.line, failure.context.match, true));
  after.forEach((line, index) => rendered.push(gutter(failure.line + 1 + index, line, false)));
  return rendered.join('\n');
}

/** One quoted line, with its number and a marker on the match. */
function gutter(lineNumber: number, text: string, isMatch: boolean): string {
  const number = chalk.dim(String(lineNumber).padStart(6));
  return isMatch ? `${chalk.red('>')} ${number}  ${chalk.red(text)}` : `  ${number}  ${text}`;
}

/** The last lines of a tail, for a report with nothing located. */
function lastLines(tail: string, maxLines: number): string {
  const all = tail.split('\n');
  return all.slice(-maxLines).join('\n');
}

function indent(block: string): string {
  return block
    .split('\n')
    .map((line) => `  ${line}`)
    .join('\n');
}

/** A byte count as a person reads one. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} kB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
