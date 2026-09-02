// @ref llp/0024-cli-ui.rfc.md §The template
// The one shape every `npx @expo/agent-cli <command> --help` comes out in.
//
// One function, so there is one answer to "what does a help block look like". Before this, each
// command formatted its own: the sections were whatever that command's author reached for, the
// examples were sometimes there, and the rationale was a wall of prose in the middle of the option
// list. An agent that has read one help block should have read them all — which is only true if
// there is exactly one place that decides the order of the sections, and it is this file.
//
// The order is the order a caller needs the answers in: what is this for, how do I invoke it, what
// can I pass, what does a real invocation look like, what do I run after it, and what comes back
// under `--json`. `Notes` is last because it is the part that varies.

import { commandSummary } from '../commandRegistry';
import * as Log from '../log';
import { color } from '../utils/color';
import { ON_RAMP_FOOTER } from './onRamp';
import type { CommandHelp } from './types';

/**
 * The most lines a rendered help block may be.
 *
 * "One screen" as a number. It is not a formatting preference: a block that scrolls is one whose
 * head — the summary and the usage — is gone by the time the reader reaches the examples, and the
 * blocks this replaced were 60 to 110 lines of which most was rationale. The cap is what keeps the
 * rationale in the `workflow` topic and in the LLPs instead of creeping back one paragraph at a time.
 */
export const MAX_HELP_LINES = 60;

/**
 * The most lines the `Notes` block may be.
 *
 * `Notes` is the one section with no shape of its own — the others are a usage line, an option
 * list, examples and a key list — so it is where a wall of prose grows back one paragraph at a
 * time. The number is what the honest limits of the hardest command need and no more.
 */
export const MAX_NOTE_LINES = 14;

/** Indent of a section's head, and of the lines under it. */
const HEAD_INDENT = '  ';
const BODY_INDENT = '    ';

/** Render one command's help as the block a caller reads. */
export function renderCommandHelp(name: string, help: CommandHelp): string {
  const lines: string[] = [
    '',
    `${HEAD_INDENT}${color.command(name)} — ${commandSummary(name)}`,
    '',
    ...section('Usage', [`${color.muted('$')} ${help.usage}`]),
    ...section(
      'Options',
      help.options.flatMap((option) => option.split('\n'))
    ),
    ...section(
      'Examples',
      help.examples.flatMap((example) => [
        `${color.muted('$')} ${example.run}`,
        `  ${color.muted(example.gets)}`,
      ])
    ),
    ...section('Typically next', [help.next.join(' · ')]),
    ...(help.json
      ? section('JSON (--json)', [
          `stdout  ${help.json.stdout}`,
          `stderr  ${help.json.stderr}`,
          // Every key, not a selection: the point of naming them is that a caller can write the
          // branch without running the command once to find out what came back. Wrapped rather
          // than truncated, because a list that stops at the edge of the terminal is a list a
          // reader has to go and check somewhere else.
          ...wrapKeys(help.json.keys),
        ])
      : []),
    ...(help.notes?.length
      ? section(
          'Notes',
          help.notes.flatMap((note) => note.split('\n'))
        )
      : []),
    `${HEAD_INDENT}${ON_RAMP_FOOTER}`,
    '',
  ];
  return lines.join('\n');
}

/** Width the `keys` list wraps at, counted from the start of the `keys` label. */
const KEYS_WIDTH = 72;

/** The `keys` rows: the label on the first, and the rest under it in the same column. */
function wrapKeys(keys: string[]): string[] {
  const rows: string[] = [];
  for (const key of keys) {
    const last = rows.length - 1;
    if (rows.length && `${rows[last]}, ${key}`.length <= KEYS_WIDTH) {
      rows[last] = `${rows[last]}, ${key}`;
    } else {
      if (rows.length) {
        rows[last] += ',';
      }
      rows.push(key);
    }
  }
  return rows.map((row, index) => (index === 0 ? `keys    ${row}` : `        ${row}`));
}

/** One head, its lines, and the blank line that separates it from the next section. */
function section(title: string, body: string[]): string[] {
  return [
    `${HEAD_INDENT}${color.heading(title)}`,
    ...body.map((line) => `${BODY_INDENT}${line}`),
    '',
  ];
}

/**
 * Print one command's help and exit 0.
 *
 * Every command's `--help` branch ends here, the way every command's failure ends in
 * `logCmdError`: the exit code of a help request is 0 on all of them, and the block is on stdout on
 * all of them, because a caller asked for it and got it.
 */
export function printCommandHelp(help: CommandHelp): never {
  Log.exit(renderCommandHelp(help.command, help), 0);
}
