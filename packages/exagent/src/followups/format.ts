// @ref llp/0009-smart-followups.rfc.md §Design — "Human output: a short `Next (optional):` section".
// @ref llp/0006-agent-native-cli-surface.rfc.md §Output contract — one fact per line, and the
// same shape for a human terminal and an agent transcript.

import chalk from 'chalk';

import type { FollowUp } from './types';

/** Render the trailing `Next (optional):` section: one line per follow-up, commands in one column. */
export function formatFollowUps(followups: FollowUp[]): string {
  if (!followups.length) {
    return '';
  }

  const width = Math.max(...followups.map((followup) => followup.command.length));
  return [
    // A leading blank line: the section trails whatever the command printed, and every command
    // prints something, so it needs the separation to read as its own block.
    '',
    chalk.bold('Next (optional):'),
    ...followups.map(
      (followup) => `  ${chalk.cyan(followup.command.padEnd(width))}  — ${chalk.dim(followup.why)}`
    ),
  ].join('\n');
}
