// @ref llp/0008-guardrails.rfc.md §Consent is a re-run, never a prompt
//
// This CLI is driven by agents, and an agent cannot answer a question. So the guardrail on a step
// that costs minutes or deletes files is not a `? Run this plan? ›` — it is a stop: the command
// prints what it was about to do and hands back the line that does it. Consent is the caller
// typing that line, which works identically for a person, an agent, a script and CI, and which
// leaves a record of what was approved.
//
// The line has to be the caller's *own* invocation plus the flag, and nothing else. A re-run that
// dropped `--ios` starts a different build than the one whose plan was just approved — the same
// rule that F58 and F103 were filed for — and a re-run the caller has to repair before it works is
// not a hint. So the argv is copied verbatim from `process.argv`, never rebuilt from parsed
// options, which is the only form guaranteed to hold flags this command never learned to name.

import { PROGRAM_PREFIX } from '../programName';

/** The flag, and the short form the parsers accept for it. */
const YES_FLAGS = new Set(['--yes', '-y']);

/**
 * Characters that make a shell do something other than pass the word through.
 *
 * Kept deliberately wide: the cost of quoting a word that did not need it is an extra pair of
 * quotes in a line that still runs, and the cost of missing one is a line that runs *something
 * else*.
 */
const NEEDS_QUOTING = /[^\w@%+=:,./-]/;

/** One argument, as a shell would have to be given it to arrive unchanged. */
function quoteArgument(argument: string): string {
  if (argument !== '' && !NEEDS_QUOTING.test(argument)) {
    return argument;
  }
  return `'${argument.replace(/'/g, `'\\''`)}'`;
}

/**
 * The command that runs what this run stopped short of: the caller's own invocation, plus `--yes`.
 *
 * @param fallbackArgv what to name when this process has no argv of its own, e.g. an embedder that
 *   required the bundle instead of spawning the bin. The command name and the flags the caller
 *   passed to it, in the order they were typed.
 * @param processArgv this process' `process.argv`, i.e. the node binary, the script, then the
 *   words the caller typed. Injectable for tests, which have neither.
 */
export function consentRerunCommand(
  fallbackArgv: readonly string[],
  processArgv: readonly string[] = process.argv
): string {
  const typed = processArgv.slice(2);
  const argv = typed.length ? typed : [...fallbackArgv];
  const withFlag = argv.some((argument) => YES_FLAGS.has(argument)) ? argv : [...argv, '--yes'];
  return `${PROGRAM_PREFIX} ${withFlag.map(quoteArgument).join(' ')}`;
}
