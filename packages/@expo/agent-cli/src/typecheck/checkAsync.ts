// @ref llp/0001-agentic-cli-on-expo-cli.rfc.md §Constraints — the project's own compiler is
// driven as a subprocess. Nothing here imports `typescript`, for the same reason nothing imports
// `@expo/cli`: what must run is the version the project pinned, whatever that is.
//
// The split is: `tsc` decides, `@expo/agent-cli` reports. Nothing here re-implements a check.

import fs from 'fs';
import path from 'path';
import { stripVTControlCharacters } from 'util';

import { PROGRAM_PREFIX } from '../programName';
import { fileExistsSync } from '../utils/dir';
import { CommandError } from '../utils/errors';
import {
  describeProjectBinSearch,
  lookupProjectBin,
  resolveProjectBin,
  type ProjectBinLookup,
} from '../utils/projectBin';
import { spawnSubprocessAsync } from '../utils/subprocess';
import { findMissingGeneratedTypesSync } from './generatedTypes';
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
 * The project's own copy, and only that — which in a workspace means an ancestor's `node_modules`
 * as well as this directory's, because that is where the package manager installed what this
 * package declared (`src/utils/projectBin.ts`). There is deliberately no `npx typescript` fallback the
 * way `doctor:check` falls back to `npx expo-doctor`: `expo-doctor` is a tool you run *at* a
 * project and its checks are its own, while a type check is a function of the project's compiler
 * version, its `tsconfig.json` and its `@types` — so a compiler fetched from the registry would
 * answer a question about a project that does not exist. A project with no TypeScript has nothing
 * to check, which is an answer.
 */
export function resolveTypeScriptCli(projectRoot: string): TypeScriptCli | null {
  const command = resolveProjectBin(projectRoot, 'tsc');
  return command ? { command } : null;
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

/** Directories a project's own TypeScript is never in, skipped by the source scan. */
const NOT_PROJECT_SOURCE = new Set([
  'node_modules',
  '.git',
  '.expo',
  'ios',
  'android',
  'dist',
  'build',
  'web-build',
  'coverage',
  '.next',
  '.turbo',
]);

/**
 * How many directories the source scan will open before it stops looking.
 *
 * The scan exists to answer "is this a TypeScript project", and a TypeScript project answers it in
 * the first few directories — the entry file, `app/`, or `src/`. The cap is there so the *negative*
 * answer, which is the one that has to walk everything, cannot cost a second on a large repository.
 */
const MAX_SCANNED_DIRECTORIES = 500;

/**
 * Whether the project has TypeScript source files of its own.
 *
 * The second half of "is this a TypeScript project", and the reason the question needs two halves:
 * a `tsconfig.json` is the usual evidence, and a project that lost one — or never had one, and
 * relies on `expo start`'s implicit config — still has `.ts` files that a type check is about. A
 * project with neither is a JavaScript project, which is the one case where "nothing to check" is
 * the truth rather than a broken setup (llp/0010 §The fourth: `typecheck`).
 */
export function hasTypeScriptSourcesSync(projectRoot: string): boolean {
  const queue: string[] = [projectRoot];
  let opened = 0;

  while (queue.length > 0 && opened < MAX_SCANNED_DIRECTORIES) {
    const directory = queue.shift()!;
    opened++;
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(directory, { withFileTypes: true });
    } catch {
      // A directory this process may not read says nothing either way, so it is skipped.
      continue;
    }
    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (!entry.name.startsWith('.') && !NOT_PROJECT_SOURCE.has(entry.name)) {
          queue.push(path.join(directory, entry.name));
        }
      } else if (/\.(ts|tsx|mts|cts)$/.test(entry.name) && !entry.name.endsWith('.d.ts')) {
        // `.d.ts` alone is not a TypeScript project: `expo-env.d.ts` is generated into every app,
        // JavaScript ones included.
        return true;
      }
    }
  }
  return false;
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
    generatedTypes: null,
  });

  // Three states, and only one of them is "nothing to check" (llp/0010 §The fourth: `typecheck`).
  // A missing compiler used to be reported as the *same* thing as a project with no TypeScript in
  // it, word for word, so a broken TypeScript setup passed an exit-code gate and the reason it
  // printed was false [observed — friction run 4, 2026-08-23].
  const cli = resolveTypeScriptCli(projectRoot);
  const tsConfigPath = resolveTsConfigPath(projectRoot);
  if (!cli) {
    if (tsConfigPath != null || hasTypeScriptSourcesSync(projectRoot)) {
      throw compilerMissingError(tsConfigPath != null, lookupProjectBin(projectRoot, 'tsc'));
    }
    return nothingToCheck(
      `this project has no TypeScript in it — no tsconfig.json and no .ts or .tsx files of its own — so there is nothing to type-check`
    );
  }
  if (tsConfigPath == null) {
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
    // Only when something failed: the note explains diagnostics, and a run with none needs no
    // explanation of them (F64).
    generatedTypes: errors.length > 0 ? findMissingGeneratedTypesSync(projectRoot) : null,
  };
}

/**
 * The error for a TypeScript project with no compiler to check it with.
 *
 * A **tool** failure and so exit 1, not "nothing to check" and exit 0: the project has TypeScript
 * in it, the question was asked, and no answer was produced. The old behaviour reported the absence
 * of the compiler as the absence of TypeScript, which passes every gate that reads the exit code
 * and states something untrue in the same breath.
 *
 * The **How** used to open with "install the project's dependencies", which is a guess about why
 * nothing was found rather than a fact — and the wrong guess in a workspace, where the dependencies
 * are installed and hoisted to a `node_modules` this used to never look in (F113, wave 28). What
 * the search covered is a fact, so it is what the message carries now.
 *
 * @param hasTsConfig whether it was the `tsconfig.json` that identified this as a TypeScript
 * project, or its `.ts` files — the two are different evidence and the reader should see theirs.
 * @param lookup the search that came back empty, which is what says where it looked.
 */
function compilerMissingError(hasTsConfig: boolean, lookup: ProjectBinLookup): CommandError {
  const error = new CommandError(
    'TYPECHECK_CLI_MISSING',
    [
      `This project is a TypeScript project with no TypeScript compiler installed, so nothing was type-checked.`,
      `Why: ${hasTsConfig ? 'it has a tsconfig.json' : 'it has .ts or .tsx source files'}, but ${describeProjectBinSearch('tsc', lookup)} — so no copy of it is installed for this project, in its own node_modules or in a workspace's. Nothing here falls back to a compiler from the registry, because a type check is a function of the version this project pinned, its tsconfig.json and its @types — one fetched from elsewhere would answer a question about a project that does not exist.`,
      `How: add TypeScript to this project with "${PROGRAM_PREFIX} install typescript --dev". If it is already in package.json, then its dependencies have not been installed since — run your package manager's install, at the workspace root when this is a workspace package.`,
    ].join('\n')
  );
  error.suggestedCommand = `${PROGRAM_PREFIX} install typescript --dev`;
  return error;
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
  error.suggestedCommand = `${PROGRAM_PREFIX} typecheck`;
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
