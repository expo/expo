// @ref llp/0012-build-explain.rfc.md §Reading a log this process did not write
//
// Read a build log into lines, without ever holding the whole of it.
//
// A native build log is not a small file. `eas build:download --all-artifacts` hands back Xcode
// logs measured in tens of megabytes, and a Gradle run with `--debug` on can pass a hundred. So
// this streams: bytes arrive in chunks, lines are cut out of a carry buffer, and only a bounded
// window is kept. `fs.readFileSync` on the log is the one thing this module must never do, and a
// unit test asserts it does not.

import fs from 'node:fs';
import { stripVTControlCharacters } from 'node:util';

import { CommandError } from '../../utils/errors';

/**
 * How many lines are kept.
 *
 * The **last** {@link MAX_LINES}, not the first: a build fails at its end, and the phase that
 * failed is the last one in the log. A 100 MB Gradle log is mostly `> Task :…: UP-TO-DATE`, and
 * the answer is in the final few hundred lines of it. 100,000 lines is far more than any real
 * build produces after the truncation of noise, and it caps the resident cost at tens of
 * megabytes rather than at whatever the caller handed over.
 */
export const MAX_LINES = 100_000;

/**
 * How wide one line may be before the rest of it is dropped.
 *
 * A bundler that inlines a source map, or a Gradle task that echoes a classpath, writes a single
 * line of several megabytes. Nothing in the rule table reads past a few hundred characters, and
 * one such line would otherwise cost more memory than the whole rest of the log.
 */
export const MAX_LINE_LENGTH = 4_000;

/** The marker a truncated line ends with, so a reader is never shown a silent cut. */
export const LINE_TRUNCATION_MARKER = '… [line truncated by exagent]';

/**
 * How many lines are dropped at once when the window overflows.
 *
 * Dropping one line per line read is quadratic — every drop shifts the other hundred thousand —
 * and a 400,000-line log took a minute of it [observed while writing `extract-test.ts`]. Dropping
 * a block amortizes that to one shift per {@link TRIM_CHUNK} lines, at the cost of holding
 * `MAX_LINES + TRIM_CHUNK` lines between trims.
 */
const TRIM_CHUNK = 10_000;

/**
 * The message of an EAS Build log record, or the line unchanged when it is not one.
 *
 * **An EAS Build log is JSONL**, one bunyan record per line — `{name, pid, phase, buildId, source,
 * level, msg, time, v, logId}` [observed — 2026-08-26, staging build `77e676e2…`, 644 records].
 * That is not what the rest of this module was built for, and leaving it wrapped costs three
 * things at once: the rule table matches inside a JSON blob rather than against the sentence a
 * tool printed, the `Start phase:` markers never reach `phases.ts`, and every context line a
 * reader is shown is four hundred characters of metadata around the eighty they wanted.
 *
 * Unwrapping here rather than in a reader of its own is deliberate: the whole pipeline downstream
 * is `string[]` in, and one line in is still one line out, so line numbers keep meaning what they
 * meant and nothing else has to learn about the format.
 *
 * Only an object with a **string** `msg` is a record. An EAS log also prints the app config as
 * JSON, and that is content rather than transport — unwrapping it would eat a line the reader
 * needs.
 */
function unwrapEasRecord(line: string): string {
  // Cheap rejections first: this runs on every line of a log that may have a hundred thousand.
  if (line.charCodeAt(0) !== 0x7b /* { */ || !line.includes('"msg"')) {
    return line;
  }
  try {
    const parsed = JSON.parse(line) as Record<string, unknown>;
    return typeof parsed?.msg === 'string' ? parsed.msg : line;
  } catch {
    return line;
  }
}

export interface ReadLogResult {
  /** The lines kept, ANSI stripped, newest last. */
  lines: string[];
  /** Bytes read off the stream, which is the whole log even when lines were dropped. */
  bytes: number;
  /** True when the log had more than {@link MAX_LINES} lines and the oldest were dropped. */
  truncated: boolean;
  /** How many lines were dropped from the front. */
  droppedLines: number;
}

/**
 * Read a readable stream into a bounded window of lines.
 *
 * Exported so both `--file` and `--stdin` go through one implementation: two readers would be two
 * chances to differ about ANSI, about the last line of a file with no trailing newline, and about
 * where truncation starts.
 *
 * @param stream any readable stream of log bytes.
 * @returns the lines kept and what was dropped to keep them.
 */
export async function readLogStreamAsync(stream: NodeJS.ReadableStream): Promise<ReadLogResult> {
  const lines: string[] = [];
  let bytes = 0;
  let droppedLines = 0;
  let carry = '';

  const push = (raw: string) => {
    const stripped = stripVTControlCharacters(unwrapEasRecord(raw));
    const line =
      stripped.length > MAX_LINE_LENGTH
        ? stripped.slice(0, MAX_LINE_LENGTH) + LINE_TRUNCATION_MARKER
        : stripped;
    lines.push(line);
    if (lines.length >= MAX_LINES + TRIM_CHUNK) {
      lines.splice(0, TRIM_CHUNK);
      droppedLines += TRIM_CHUNK;
    }
  };

  for await (const chunk of stream) {
    const text = typeof chunk === 'string' ? chunk : chunk.toString('utf8');
    bytes += Buffer.byteLength(text, 'utf8');
    const parts = (carry + text).split('\n');
    // The last part is whatever came before the next newline, which has not arrived yet.
    carry = parts.pop() ?? '';
    for (const part of parts) {
      push(part.replace(/\r$/, ''));
    }
  }
  // A log that does not end in a newline still ends in a line, and for a stream cut off
  // mid-write that partial line is often the most interesting one in the file.
  if (carry.length > 0) {
    push(carry.replace(/\r$/, ''));
  }

  // The window is trimmed in blocks while reading, so the last block is still oversized here.
  if (lines.length > MAX_LINES) {
    const excess = lines.length - MAX_LINES;
    lines.splice(0, excess);
    droppedLines += excess;
  }

  return { lines, bytes, truncated: droppedLines > 0, droppedLines };
}

/**
 * Read a log file.
 *
 * @param filePath an absolute path to the log.
 * @throws {CommandError} `LOG_UNREADABLE` when the path is not a readable file. This is the exit
 *   `1` case of llp/0012 §Exit codes: no report could be produced at all.
 */
export async function readLogFileAsync(filePath: string): Promise<ReadLogResult> {
  let stats: fs.Stats;
  try {
    stats = await fs.promises.stat(filePath);
  } catch {
    throw unreadable(
      filePath,
      'there is nothing at that path',
      'Check the path, or pipe the log in with "--stdin" instead.'
    );
  }
  if (stats.isDirectory()) {
    throw unreadable(
      filePath,
      'that path is a directory',
      'Name the log file itself, e.g. "--file ./build.log".'
    );
  }
  try {
    await fs.promises.access(filePath, fs.constants.R_OK);
  } catch {
    throw unreadable(
      filePath,
      'this process may not read it',
      'Check the file permissions, or copy the log somewhere readable first.'
    );
  }

  return readLogStreamAsync(fs.createReadStream(filePath, { encoding: 'utf8' }));
}

/** The one error shape for "the log could not be read", with the three parts every error has. */
function unreadable(filePath: string, why: string, how: string): CommandError {
  const error = new CommandError(
    'LOG_UNREADABLE',
    [
      `Could not read the build log at ${filePath}.`,
      `Why: ${why}, so there is no log to explain.`,
      `How: ${how}`,
    ].join('\n')
  );
  error.suggestedCommand = 'npx exagent build:explain --help';
  return error;
}
