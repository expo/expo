// @ref llp/0009-smart-followups.rfc.md §The follow-up block — "Human output: a short `Suggested next:` section".
// @ref llp/0006-agent-native-cli-surface.rfc.md §Output contract — one fact per line, and the
// same shape for a human terminal and an agent transcript.

import { color } from '../utils/color';
import { renderForInvoker } from '../utils/invoker';
import type { FollowUp } from './types';

/**
 * Render the trailing `Suggested next:` section: one line per follow-up, commands in one column.
 *
 * The commands are rewritten for the runner in use as they go out (`src/utils/invoker.ts`), which
 * is why every builder can go on writing `npx @expo/agent-cli …` and a Bun project still gets a line it can
 * paste. The `--json` payload and the `cli:followups` event carry the written form unchanged — see
 * that file for why the machine contract does not move with the shell.
 */
export function formatFollowUps(followups: FollowUp[]): string {
  if (!followups.length) {
    return '';
  }

  const commands = followups.map((followup) => renderForInvoker(followup.command));
  const width = Math.max(...commands.map((command) => command.length));
  return [
    // A leading blank line: the section trails whatever the command printed, and every command
    // prints something, so it needs the separation to read as its own block.
    '',
    // @ref llp/0024-cli-ui.rfc.md §Colors are for humans — the same three roles the help block
    // uses, so the state-aware `Suggested next:` and the static `Typically next` of a `--help`
    // read as the same kind of thing rather than as two conventions.
    color.heading('Suggested next:'),
    ...followups.map(
      (followup, index) =>
        `  ${color.command(commands[index]!.padEnd(width))}  — ${color.muted(renderForInvoker(followup.why))}`
    ),
  ].join('\n');
}
