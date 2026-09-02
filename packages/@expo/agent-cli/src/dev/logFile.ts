// @ref llp/0004-smart-start-and-project-state.rfc.md §Daemonization
// @ref llp/0004-smart-start-and-project-state.rfc.md §Daemonization
// Where a detached dev server's output goes, and how it is read back.
//
// One file per project, not one per port, and truncated on each run. Both follow from the rule the
// lock already enforces: **one detached dev server per project**. A name carrying the port could
// not be resolved by `dev:logs` before the port was known, and a file that accumulated across runs
// would answer "what is my dev server doing" with what a dev server did last week.
//
// It sits in `.expo/dev/logs/`, which `src/utils/dotExpo.ts` already documents as the directory of
// per-run logs — so nothing new appears in a project, and `.expo` is already gitignored.

import fs from 'fs';
import path from 'path';
import { stripVTControlCharacters } from 'util';

/** Directory of the per-run logs, as `.expo`'s own README describes it. */
const DEV_LOGS_DIR = path.join('.expo', 'dev', 'logs');

/** Name of the file a detached dev server's stdout and stderr are written to. */
const DETACHED_LOG_NAME = 'dev-detached.log';

/** Where this project's detached dev server writes its output. */
export function detachedLogPath(projectRoot: string): string {
  return path.join(projectRoot, DEV_LOGS_DIR, DETACHED_LOG_NAME);
}

/**
 * Create the log file for a new detached run, truncating whatever was there.
 *
 * @returns the path and an open file descriptor for the child's stdout and stderr. The caller
 * closes the descriptor once the child owns it.
 */
export function openDetachedLogSync(projectRoot: string): { logFile: string; fd: number } {
  const logFile = detachedLogPath(projectRoot);
  fs.mkdirSync(path.dirname(logFile), { recursive: true });
  // `w`, so a new run starts a new log: the previous run's Metro output under a question about
  // this one is worse than no answer.
  return { logFile, fd: fs.openSync(logFile, 'w') };
}

/** What a read of the log amounts to. */
export interface DetachedLogRead {
  /** Absolute path of the file, so a caller can open it itself. */
  logFile: string;
  /** The last lines asked for, ANSI stripped, oldest first. */
  lines: string[];
  /** How many lines the file has in total. */
  totalLines: number;
  /** Whether older lines were left out because {@link lines} was capped. */
  truncated: boolean;
}

/**
 * Read the tail of a detached dev server's log, or null when the project has none.
 *
 * The escape codes are stripped rather than passed through: Metro colours its output and draws
 * progress bars with cursor moves, and neither survives being read out of a file by anything but a
 * terminal. What is left is the text an agent reads.
 *
 * @param tail how many lines from the end to return.
 */
export function readDetachedLogSync(projectRoot: string, tail: number): DetachedLogRead | null {
  const logFile = detachedLogPath(projectRoot);
  let raw: string;
  try {
    raw = fs.readFileSync(logFile, 'utf8');
  } catch {
    return null;
  }

  const all = stripVTControlCharacters(raw)
    .split('\n')
    // A file ending in a newline has an empty last line that is not a line of output.
    .filter((line, index, lines) => index < lines.length - 1 || line.length > 0);

  return {
    logFile,
    lines: tail >= all.length ? all : all.slice(all.length - tail),
    totalLines: all.length,
    truncated: tail < all.length,
  };
}
