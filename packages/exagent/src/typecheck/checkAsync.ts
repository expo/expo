// @ref llp/0001-agentic-cli-on-expo-cli.rfc.md §Constraints, item 5 — the project's own compiler is
// driven as a subprocess. Nothing here imports `typescript`, for the same reason nothing imports
// `@expo/cli`: what must run is the version the project pinned, whatever that is.
//
// The split is: `tsc` decides, `exagent` reports. Nothing here re-implements a check.

import path from 'path';
import { stripVTControlCharacters } from 'util';

import { fileExistsSync } from '../utils/dir';
import { CommandError } from '../utils/errors';
import { spawnSubprocessAsync } from '../utils/subprocess';
import { parseTscOutput } from './parseTscOutput';
import type { TypeCheckReport } from './types';

/**
 * The arguments the compiler is run with.
 *
 * `--noEmit` because this is a gate and not a build, and `--pretty false` because the pretty form
 * exists to be read by a person in a terminal: it wraps at the terminal width, colors itself, and
 * draws a code frame under every diagnostic. One line per diagnostic is what a parse wants, and it
 * is what a driving agent wants in its transcript too.
 */
export const TSC_ARGS = ['--noEmit', '--pretty', 'false'];

/** Config files a project type-checks against, in the order `tsc` itself looks for them. */
const TSCONFIG_NAMES = ['tsconfig.json'];

/** Where the compiler came from, so a reader can run the same command by hand. */
export interface TypeScriptCli {
  /** Executable to spawn. */
  command: string;
}

/**
 * The `tsc` this project would run, or null when it has none.
 *
 * The project's own copy, and only that. There is deliberately no `npx typescript` fallback the
 * way `doctor:check` falls back to `npx expo-doctor`: `expo-doctor` is a tool you run *at* a
 * project and its checks are its own, while a type check is a function of the project's compiler
 * version, its `tsconfig.json` and its `@types` — so a compiler fetched from the registry would
 * answer a question about a project that does not exist. A project with no TypeScript has nothing
 * to check, which is an answer.
 */
export function resolveTypeScriptCli(projectRoot: string): TypeScriptCli | null {
  const binName = process.platform === 'win32' ? 'tsc.cmd' : 'tsc';
  const localBin = path.join(projectRoot, 'node_modules', '.bin', binName);
  return fileExistsSync(localBin) ? { command: localBin } : null;
}

/** The `tsconfig.json` the check would use, or null when the project has none. */
export function resolveTsConfigPath(projectRoot: string): string | null {
  for (const name of TSCONFIG_NAMES) {
    const configPath = path.join(projectRoot, name);
    if (fileExistsSync(configPath)) {
      return configPath;
    }
  }
  return null;
}

/**
 * Run the project's TypeScript compiler and report what it found.
 *
 * Never throws for a type error: an error the compiler found is the answer, not a failure of this
 * command. Two things are reported as {@link CommandError} instead — a compiler that could not be
 * started, and one that failed without printing a diagnosis, which are both failures of the tool
 * rather than verdicts on the code.
 *
 * @throws {CommandError} `TYPECHECK_FAILED` when the compiler exited non-zero having reported
 * nothing that could be read as a diagnostic.
 */
export async function runTypeCheckAsync(projectRoot: string): Promise<TypeCheckReport> {
  const nothingToCheck = (reason: string): TypeCheckReport => ({
    projectRoot,
    checked: false,
    reason,
    errorCount: 0,
    errors: [],
    durationMs: 0,
  });

  const cli = resolveTypeScriptCli(projectRoot);
  if (!cli) {
    return nothingToCheck(
      `this project has no TypeScript compiler installed (no node_modules/.bin/tsc), so there is nothing to type-check`
    );
  }
  if (resolveTsConfigPath(projectRoot) == null) {
    return nothingToCheck(
      `this project has no tsconfig.json, so the compiler has no set of files to check`
    );
  }

  const startedAt = Date.now();
  // Captured, not inherited: this command owns its output, and under `--json` it owns stdout.
  const result = await spawnSubprocessAsync(cli.command, TSC_ARGS, {
    cwd: projectRoot,
    output: 'capture',
  });
  const durationMs = Date.now() - startedAt;

  if (result.spawnError) {
    throw notRunnableError(
      cli,
      `spawning it failed (${result.spawnError.code ?? result.spawnError.message})`
    );
  }

  const raw = stripVTControlCharacters(`${result.stdout}${result.stderr}`);
  const errors = parseTscOutput(raw);

  // A compiler that failed and said nothing a parse could read has not answered the question. That
  // is a tool failure and not a verdict, so it must not become exit 20: an agent would go looking
  // for a type error that was never reported.
  if (errors.length === 0 && result.exitCode !== 0) {
    throw unreadableError(cli, result.exitCode, raw);
  }

  return {
    projectRoot,
    checked: true,
    reason: null,
    errorCount: errors.length,
    errors,
    durationMs,
  };
}

/** The error for a compiler that is on disk and could not be started. */
function notRunnableError(cli: TypeScriptCli, why: string): CommandError {
  const error = new CommandError(
    'TYPECHECK_CLI_NOT_RUNNABLE',
    [
      `Could not run this project's TypeScript compiler (${cli.command}), so nothing was type-checked.`,
      `Why: ${why}. The file is there, so this is about the machine rather than about the project — a broken install, or a shim that cannot be executed.`,
      `How: reinstall the project's dependencies, then run this command again.`,
    ].join('\n')
  );
  error.suggestedCommand = 'npx exagent typecheck';
  return error;
}

/** How much of an unreadable compiler failure is quoted back. */
const OUTPUT_EXCERPT_LINES = 20;

/** The error for a compiler that failed without reporting a diagnostic. */
function unreadableError(
  cli: TypeScriptCli,
  exitCode: number | null,
  output: string
): CommandError {
  const excerpt = output.trim().split('\n').slice(0, OUTPUT_EXCERPT_LINES).join('\n');
  const error = new CommandError(
    'TYPECHECK_FAILED',
    [
      `The TypeScript compiler exited ${exitCode} without reporting a diagnostic, so this project's types are unknown.`,
      `Why: every failure this command can report is read back out of what the compiler printed, and nothing it printed is a diagnostic. A tsconfig.json the compiler cannot read, or an option it does not have, both end here.`,
      `How: run "${cli.command} ${TSC_ARGS.join(' ')}" in this project to see the whole answer.${
        excerpt ? `\n\nWhat the compiler printed:\n${excerpt}` : ''
      }`,
    ].join('\n')
  );
  error.suggestedCommand = `${cli.command} ${TSC_ARGS.join(' ')}`;
  return error;
}
