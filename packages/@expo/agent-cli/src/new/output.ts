// @ref llp/0007-deploy-and-headless.rfc.md §new
// What of `create-expo`'s output belongs on a terminal that nobody is watching.
//
// `create-expo` writes for a person at a TTY: a spinner that overwrites itself with a carriage
// return, and a closing "what to do next" block. Neither survives the trip. With no cursor to move,
// every spinner frame lands on one line — `⠋ Locating…⠙ Locating…⠹ Locating…` — and the next-steps
// block arrives directly above `@expo/agent-cli new`'s own `Suggested next:`, so the reader ends up with
// two differently worded sets of instructions for the same project.
//
// Both are presentation, so both are fixed here rather than by asking `create-expo` to print less:
// the tool is right about what it prints, and this run is the unusual one.

import { stripVTControlCharacters } from 'util';

/** The frames of `ora`'s default spinner, which is what `create-expo` animates its steps with. */
const SPINNER_FRAME = /^[⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏]\s/;

/**
 * The line `create-expo` ends its work on, and starts telling the reader what to do next on.
 *
 * Everything after it — `cd`, the three `run` commands, the "make sure you have modules installed"
 * warning — is answered by this command's own summary and `Suggested next:` section
 * [observed — `packages/create-expo/src/Template.ts`, `src/createAsync.ts`].
 */
const NEXT_STEPS_MARKER = /^\s*✅\s+Your project is ready!/;

/**
 * A filter over `create-expo`'s printed lines, for a run with no terminal.
 *
 * Stateful, because the second rule is about everything *after* a line rather than about a line:
 * one filter per run.
 *
 * @returns the line to print, or null to drop it.
 */
export function createExpoOutputFilter(): (line: string) => string | null {
  let past = false;

  return (line: string): string | null => {
    if (past) {
      return null;
    }

    const shown = lastSpinnerFrame(line);
    if (NEXT_STEPS_MARKER.test(stripVTControlCharacters(shown))) {
      // The line itself stays: it is the result, and it is the last thing the tool has to say.
      past = true;
      return shown;
    }
    // A frame that never resolved is an animation nobody saw, so there is nothing to show for it.
    return SPINNER_FRAME.test(stripVTControlCharacters(shown).trimStart()) ? null : shown;
  };
}

/**
 * What a terminal would have shown for one line.
 *
 * A carriage return means "start this line again", so only what follows the last one was ever
 * visible: `⠋ Locating…\r⠙ Locating…\r✔ Downloaded…` was always meant to read as one finished step.
 */
function lastSpinnerFrame(line: string): string {
  const index = line.lastIndexOf('\r');
  return index === -1 ? line : line.slice(index + 1);
}
