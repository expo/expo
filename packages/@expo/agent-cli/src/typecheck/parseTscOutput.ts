// Reading `tsc`'s diagnostics back as data.
//
// The compiler is asked for `--pretty false`, which is the one-line-per-diagnostic form:
//
//     src/app/notes.tsx(60,38): error TS2339: Property 'md' does not exist on type '…'.
//
// The pretty form is parsed too, and that is a decision rather than thoroughness. `--pretty` is a
// compiler option as well as a flag, a project can set it in its `tsconfig.json`, and what runs is
// whatever the project has under that name — which across a process boundary is an assumption, not
// a fact (llp/0010 §The fourth: `typecheck`). A parser that only knew one form would report
// "no errors" for a project whose compiler printed the other, which is the one answer a gate must
// never give:
//
//     src/app/notes.tsx:60:38 - error TS2339: Property 'md' does not exist on type '…'.
//
// Three details of the parse are decisions:
//
//  - **A diagnostic with no file is kept**, with nulls for its location. `TS18003: No inputs were
//    found in config file …` is a real answer about the project, and dropping it would leave a
//    failing run reporting zero errors.
//  - **Continuation lines are joined onto the message**, because a `TS2345` is one sentence and
//    then the three nested sentences that say why, and the second half is where the fix is.
//  - **A blank line ends a diagnostic.** In the pretty form the code frame under an error is
//    indented exactly like a continuation and is separated from it by a blank line, so the blank
//    line is what tells the two apart. The terse form never has one inside a diagnostic.

import { stripVTControlCharacters } from 'util';

import type { TypeError } from './types';

/** `file(line,col): error TS1234: message` — the `--pretty false` form. */
const TERSE = /^(.+?)\((\d+),(\d+)\):\s+(?:error|warning)\s+(TS\d+):\s*(.*)$/;
/** `file:line:col - error TS1234: message` — the pretty form, with its colors already stripped. */
const PRETTY = /^(.+?):(\d+):(\d+)\s+-\s+(?:error|warning)\s+(TS\d+):\s*(.*)$/;
/** `error TS1234: message` — a diagnostic about the configuration rather than about a file. */
const GLOBAL = /^(?:error|warning)\s+(TS\d+):\s*(.*)$/;

/**
 * Read the diagnostics out of one `tsc` run.
 *
 * @param output everything the compiler printed, stdout and stderr together. ANSI codes are
 * stripped here rather than assumed absent: the pretty form is colored whenever the compiler
 * thinks something is watching.
 */
export function parseTscOutput(output: string): TypeError[] {
  const errors: TypeError[] = [];
  let open: TypeError | null = null;

  for (const raw of stripVTControlCharacters(output).split('\n')) {
    const line = raw.replace(/\r$/, '');

    // A blank line closes whatever diagnostic was being read, so the code frame the pretty form
    // prints under an error is never mistaken for the rest of its message.
    if (!line.trim()) {
      open = null;
      continue;
    }

    const located = TERSE.exec(line) ?? PRETTY.exec(line);
    if (located) {
      open = {
        file: located[1]!,
        line: Number(located[2]),
        column: Number(located[3]),
        code: located[4]!,
        message: located[5]!.trim(),
      };
      errors.push(open);
      continue;
    }

    const global = GLOBAL.exec(line.trim());
    if (global && !/^\s/.test(line)) {
      open = {
        file: null,
        line: null,
        column: null,
        code: global[1]!,
        message: global[2]!.trim(),
      };
      errors.push(open);
      continue;
    }

    // An indented line right under a diagnostic is the rest of it.
    if (open && /^\s/.test(line)) {
      open.message = `${open.message}\n${line.trim()}`;
      continue;
    }

    // Anything else — the `Found 7 errors in 2 files.` summary, a progress line — is not a
    // diagnostic and does not continue one.
    open = null;
  }

  return errors;
}
