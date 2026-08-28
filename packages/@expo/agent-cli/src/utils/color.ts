// @ref llp/0024-cli-ui.rfc.md §Colors are for humans
// The colors this CLI uses, and the three situations in which it uses none.
//
// Color is for the person reading a terminal. It is never for the agent: an agent reads the exit
// code, the `--json` object and the plain text, and an escape sequence in any of those is noise it
// has to strip before it can compare a string. So the palette is small and semantic — section
// heads, command names, ok and fail markers — and it is *off* wherever the reader might not be a
// person or the output might be parsed.
//
// Off means `chalk.level = 0`, set once by the launcher before any command runs. chalk already
// turns itself off for a non-TTY, so the three rules below are two additions and one belt-and-
// braces: `--json`, because a run whose stdout is a JSON object must not carry escapes into it even
// when a person is watching; and `NO_COLOR`, which chalk 4's `supports-color` does not implement
// [observed — node_modules/.pnpm/supports-color@7.2.0, 2026-08-28] and which is the one switch a
// user has for saying "not on this terminal".

import chalk from 'chalk';

/**
 * Whether the environment asks for no color at all.
 *
 * The `NO_COLOR` convention: set and non-empty means no color, whatever the value
 * (https://no-color.org). An empty value states nothing, so it is not an answer.
 */
export function noColorRequested(env: NodeJS.ProcessEnv = process.env): boolean {
  return (env.NO_COLOR ?? '') !== '';
}

/**
 * Decide whether this run may color anything, and turn chalk off when it may not.
 *
 * Called once, by `cli.ts`, before a command is loaded. `chalk` is a singleton, so one assignment
 * answers for every module that imports it — including the ones that build their strings with
 * `chalk` template literals rather than through {@link semanticColors}.
 *
 * @param json whether `--json` was on the command line, as the launcher read it.
 * @param isTty whether stdout is a terminal.
 */
export function configureColor({ json, isTty }: { json: boolean; isTty: boolean }): void {
  if (json || !isTty || noColorRequested()) {
    chalk.level = 0;
  }
}

/**
 * The whole palette, by what the thing *is* rather than by what color it comes out.
 *
 * Four roles, because four is what a help block and a status report have: the heads a reader scans
 * for, the command names they copy, the pass/fail marker they look for first, and the dim text that
 * is there when they want it. Anything that needs a fifth role probably needs fewer colors.
 */
export const color = {
  /** A section head: `Usage`, `Options`, `dev server`. */
  heading: (text: string): string => chalk.bold(text),
  /** A command a reader may copy, e.g. `npx @expo/agent-cli smoke`. */
  command: (text: string): string => chalk.cyan(text),
  /** An outcome that is fine. */
  ok: (text: string): string => chalk.green(text),
  /** An outcome that is not. */
  fail: (text: string): string => chalk.red(text),
  /** Secondary text: a `$` prompt, an aside, a unit. */
  muted: (text: string): string => chalk.dim(text),
};
