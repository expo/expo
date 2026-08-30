// @ref llp/0024-cli-ui.rfc.md §The program names itself
// What this CLI is called, read from its own `package.json` at runtime.
//
// Every screen this CLI prints names the program: the usage line, each example, the `Try:` line
// after a failure, the `Next:` rungs, the block `agents:setup` writes into `AGENTS.md`. Written out
// as a literal, each of those is a copy of a fact that lives in exactly one place — `name` in
// `package.json` — and a rename turns all of them into instructions for a command the reader cannot
// run. The package has been renamed twice already, and the second time the sweep was 3431 edits.
//
// So the name is read, not written. **At runtime, not at build time**: the check that this works is
// that `package.json` can be edited *after* the bundle is built and `-h` says the new name — an
// `import name from '../package.json'` would be inlined by ncc and would answer with whatever the
// build machine saw. Nothing here is statically resolvable for that reason.
//
// Two exports, because the output needs two forms: {@link PROGRAM_NAME} is the name on its own, for
// a sentence about the program, and {@link PROGRAM_PREFIX} is how a caller invokes it, for anything
// they are meant to run. `npx <name>` is the invocation for a scoped and an unscoped name alike.
//
// What does *not* follow the name: identifiers with a contract behind them. The follow-up `id`s are
// stable keys an agent branches on, the files under `.expo/` are read by the next run of a
// possibly-different version, and the git identity of a snapshot commit is one author across a
// project's history. A rename must not split any of those in two, so they are constants, spelled
// out where they are used.

import fs from 'fs';
import path from 'path';

/**
 * What the program is called when its own `package.json` cannot be read.
 *
 * A help screen that crashes over its banner is worse than one that prints a stale name, and the
 * only way to get here is an installation missing the file that describes it. So the failure is
 * silent and the constant is the name this package is published under.
 */
export const FALLBACK_PROGRAM_NAME = '@expo/agent-cli';

/**
 * The `name` of the nearest `package.json` at or above `directory`, or null.
 *
 * "Nearest with a `name`" rather than "nearest": a bundler may leave a `package.json` carrying only
 * a `type` field beside its output, and stopping at one of those would answer with nothing. A file
 * that fails to parse is treated the same as a file that is not there — the walk continues, because
 * the package above it is a better answer than a fallback.
 */
export function readProgramNameFrom(directory: string): string | null {
  let at = path.resolve(directory);
  for (;;) {
    try {
      const parsed = JSON.parse(fs.readFileSync(path.join(at, 'package.json'), 'utf8')) as {
        name?: unknown;
      };
      if (typeof parsed.name === 'string' && parsed.name.length > 0) {
        return parsed.name;
      }
    } catch {
      // No file here, or not JSON. Either way the answer is above.
    }
    const parent = path.dirname(at);
    if (parent === at) {
      return null;
    }
    at = parent;
  }
}

/**
 * Where the walk starts, in the order the answers are trusted.
 *
 * `__dirname` is this module's own directory — `src/` when a test imports it, `build/cli/` in the
 * bundle — and both sit inside the package the name belongs to.
 *
 * `process.argv[1]` is the second try, through `realpath`: an installed CLI is invoked through a
 * symlink in `node_modules/.bin`, and the directory of the *link* walks up into the caller's
 * project, whose `package.json` is a different program's. The real path is the bin script inside
 * this package. A run with no argv[1] at all — an embedder that required the bundle — has nothing
 * to add here, and the first candidate has already answered.
 */
function startDirectories(): string[] {
  const directories = [__dirname];
  const entry = process.argv[1];
  if (entry) {
    try {
      directories.push(path.dirname(fs.realpathSync(entry)));
    } catch {
      // The entry is gone or unreadable; `__dirname` is the answer.
    }
  }
  return directories;
}

/** Resolved once per process: the read is a file system hit, and the answer cannot change. */
function resolveProgramName(): string {
  for (const directory of startDirectories()) {
    const name = readProgramNameFrom(directory);
    if (name != null) {
      return name;
    }
  }
  return FALLBACK_PROGRAM_NAME;
}

/**
 * The program's name, as its own `package.json` spells it, e.g. `@expo/agent-cli`.
 *
 * For a sentence *about* the program — `"@expo/agent-cli dev" is not a command`. Anything the
 * reader is meant to run takes {@link PROGRAM_PREFIX} instead, so the line can be copied.
 */
export const PROGRAM_NAME: string = resolveProgramName();

/**
 * How a caller invokes this program, e.g. `npx @expo/agent-cli`.
 *
 * The head of every runnable line this CLI prints. `npx` rather than the `bin` name because that is
 * what works without an install, which is the state an agent handed this CLI is in.
 */
export const PROGRAM_PREFIX = `npx ${PROGRAM_NAME}`;
