// @ref llp/0005-runtime-loop-tools.rfc.md §Android
// The app's errors, read out of the dev server's own log.
//
// The second half of friction run 6's F52. Expo Go for Android carries a JavaScript engine with no
// Chrome DevTools Protocol debugger, so `runtime:errors` connects, is acknowledged, and is told
// nothing — an empty window for an app that is showing a red screen. The information is not lost,
// though: React Native reports the same error over the dev server's own log channel, and the dev
// server prints it **symbolicated, with a code frame**. `dev:logs` showed it the whole time.
//
// So this reads it back. The format is Expo's own logger [reference —
// `@expo/cli` `src/start/server/serverLogLikeMetro.ts` `logLikeMetro`]:
//
// ```js
// const modePrefix = platform && platform !== 'BRIDGE' && platform !== 'NOBRIDGE'
//   ? chalk.bold`${platform} ` : '';
// originalLogFunction(modePrefix + color.bold(` ${LEVEL} `) + ''.padEnd(groupStack.length * 2), ...data);
// ```
//
// which, with the escape codes stripped, is `[<platform> ] <LEVEL>  <message>` followed by
// whatever the log carried under it. Live [observed — 2026-08-25, notesapp on SDK 57 in Expo Go on
// an Android emulator]:
//
// ```
//  ERROR  [Error: boom from HomeScreen]
//
// Code: index.tsx
//   33 |   throw new Error('boom from HomeScreen');
// Call Stack
//   HomeScreen (src/app/index.tsx:33:18)
// ```
//
// **Two limits, stated because a reader will otherwise assume them away.**
//
//  1. **The log does not name the platform.** `modePrefix` is empty for a bridgeless app, which
//     every modern one is — the capture above has an iOS simulator and an Android emulator on the
//     same dev server and no prefix on the line. So an error read this way is the *dev server's*,
//     not a particular app's, and anything reporting it has to say so.
//  2. **It is text.** There is no structured stack, no `isError` flag and no way to tell a logged
//     `Error` from an uncaught one. What there is, is the file and line the dev server already
//     resolved, which is the thing a reader acts on.

/** Log levels Expo's logger writes, in the spelling it writes them. */
const LOG_LEVELS = ['LOG', 'INFO', 'WARN', 'ERROR', 'DEBUG', 'TRACE'] as const;

/** The levels this module reports. A warning is not something a gate may fail on. */
const ERROR_LEVELS = new Set(['ERROR']);

/**
 * One log line, with the platform prefix when the logger wrote one.
 *
 * `^(?:(\w+) )?` is the prefix, ` ?LEVEL {2}` the level as `logLikeMetro` renders it: a leading
 * space from `chalk.inverse`'s padding, and two spaces after it because the level and the message
 * are separate `console.error` arguments.
 */
const LOG_LINE = new RegExp(`^(?:([A-Za-z][A-Za-z0-9]*) )? ?(${LOG_LEVELS.join('|')}) {2}(.*)$`);

/** One entry the dev server's log carried. */
export interface DevServerLogEntry {
  /** The level as the logger wrote it, e.g. `ERROR`. */
  level: string;
  /** The platform the logger named, or null — which is the usual case for a bridgeless app. */
  platform: string | null;
  /** The first line: what the app reported. */
  message: string;
  /** Everything under it — the code frame and the call stack — with trailing blanks removed. */
  details: string;
  /** Index of the entry's first line in the log, so a caller can window by position. */
  line: number;
}

/**
 * Read every error the dev server's log carries.
 *
 * The lines are expected to be ANSI-stripped already, which is what `readDetachedLogSync` hands
 * back: Metro colours its output and draws progress bars with cursor moves, and neither survives
 * being read out of a file.
 */
export function parseDevServerLogEntries(lines: readonly string[]): DevServerLogEntry[] {
  const entries: DevServerLogEntry[] = [];
  let open: DevServerLogEntry | null = null;
  let details: string[] = [];

  const close = () => {
    if (open) {
      open.details = details.join('\n').replace(/^\n+|\s+$/g, '');
      entries.push(open);
    }
    open = null;
    details = [];
  };

  for (let index = 0; index < lines.length; index++) {
    const match = LOG_LINE.exec(lines[index]!);
    if (match) {
      close();
      const [, platform, level, message] = match;
      if (ERROR_LEVELS.has(level!)) {
        open = {
          level: level!,
          platform: platform ?? null,
          message: message!.trim(),
          details: '',
          line: index,
        };
      }
      continue;
    }
    if (open) {
      details.push(lines[index]!);
    }
  }
  close();

  return entries;
}

/** What a windowed read of the log amounts to. */
export interface DevServerLogErrorRead {
  /** Errors whose first line was written after the mark. */
  errors: DevServerLogEntry[];
  /**
   * Errors that were already in the log when the window opened.
   *
   * Counted rather than reported, and counted rather than ignored: they are not evidence about the
   * window, and a reader who is told nothing about them will not go and look.
   */
  older: number;
}

/**
 * The errors written after a mark, and how many were there before it.
 *
 * The mark is a line count taken when the window opened, which is the same bound a debugger window
 * has: a log is cumulative, and reporting everything in it as "what happened while I watched" would
 * be the same overclaim in the other direction.
 */
export function readDevServerLogErrors(
  lines: readonly string[],
  markedAtLine: number
): DevServerLogErrorRead {
  const all = parseDevServerLogEntries(lines);
  return {
    errors: all.filter((entry) => entry.line >= markedAtLine),
    older: all.filter((entry) => entry.line < markedAtLine).length,
  };
}
