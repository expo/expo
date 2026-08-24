// @ref llp/0005-runtime-loop-tools.rfc.md §Candidates — "Structured red-screen feed".
// Turning the bundle offsets in a runtime error's stack into project files and lines.
//
// An unsymbolicated frame from a live Expo app is this [observed — SDK 57, 2026-08-23]:
//
//     at overrideMethod (http://127.0.0.1:8150/node_modules/expo-router/entry.bundle//&platform=ios
//       &dev=true&hot=false&lazy=true&transform.engine=hermes&transform.bytecode=1
//       &transform.routerRoot=src%2Fapp&transform.reactCompiler=true
//       &unstable_transformProfile=hermes-stable:49572:39)
//
// Two kilobytes of repeated query string per error, one offset into a bundle nobody has, and no
// project file anywhere. Metro already knows the answer: it serves `POST /symbolicate`, which the
// app itself calls for its red screens.
//
// Contract [observed — metro 0.84.4 `src/Server.js` and `src/Server/symbolicate.js`]:
//
//   POST <dev server>/symbolicate   {"stack": [{file, lineNumber, column, methodName}, ...]}
//   -> 200  {"stack": [ ...same length, same order... ], "codeFrame": {...} | null}
//
//   - `lineNumber` is **1-based** and `column` is **0-based**, both ways.
//   - `file` must be the whole bundle URL, query string included: the lookup is exact string
//     equality against the URLs Metro built, and the query selects the bundle's options. The
//     JSC-safe `//&` form is normalized by Metro itself (`jsc-safe-url`), so it is sent as it came.
//   - A frame Metro cannot map comes back **unchanged**, never null and never dropped. Expo's
//     `customizeFrame` hook additionally blanks `lineNumber`/`column` and sets `collapse: true` for
//     any frame whose `file` is still a URL, so an unmapped frame is recognisable by that.
//   - `collapse: true` marks a frame inside a framework rather than in the project.
//   - 400 for a malformed request, 500 when the source map cannot be built.

import { debugEvent } from './events';

/** One stack frame, in the shape Metro's symbolicator speaks. */
export interface StackFrame {
  /** Function name, or `<anonymous>`. */
  methodName: string;
  /** Bundle URL before symbolication, absolute project path after it. */
  file: string;
  /** 1-based, the way editors count. */
  lineNumber: number;
  /** 0-based, the way Metro counts. Rendered one higher. */
  column: number;
  /** True for a frame inside a framework rather than in the project's own code. */
  collapse?: boolean;
}

/** `  at name (url:line:column)`, the shape {@link formatStackFrames} writes. */
const STACK_LINE = /^\s*at\s+(.*?)\s*\((.+):(\d+):(\d+)\)\s*$/;
/** `  at name`, for a frame the runtime reported without a location. */
const STACK_LINE_NO_LOCATION = /^\s*at\s+(\S+)\s*$/;

/**
 * Read frames back out of a stack the runtime reported as text.
 *
 * Some exceptions arrive with structured `callFrames` and some only as the lines inside an error's
 * `description`, and both have to be symbolicated. A line that is not a frame is skipped rather
 * than guessed at.
 *
 * Text stacks count columns from 1, the way a person reads them; Metro counts from 0, so the value
 * is lowered here — exactly what React Native's own `parseErrorStack` does before calling it.
 */
export function parseStackFrames(stack: string): StackFrame[] {
  const frames: StackFrame[] = [];
  for (const line of stack.split('\n')) {
    const located = STACK_LINE.exec(line);
    if (located) {
      frames.push({
        methodName: located[1] || '<anonymous>',
        file: located[2]!,
        lineNumber: Number(located[3]),
        column: Math.max(0, Number(located[4]) - 1),
      });
      continue;
    }
    const bare = STACK_LINE_NO_LOCATION.exec(line);
    if (bare) {
      frames.push({ methodName: bare[1]!, file: '', lineNumber: 0, column: 0 });
    }
  }
  return frames;
}

/**
 * Split a message that carries its own stack into the message and that stack.
 *
 * React Native reports a thrown error through the console path as one string: the message, then
 * the error's own frames [observed — SDK 57, 2026-08-23]. Those frames are the useful ones — they
 * name the project function that threw — while the `stackTrace` CDP sends alongside describes the
 * console machinery that reported it. Leaving them inside the message means they are never
 * symbolicated, and the message carries a bundle URL and its whole query string per frame.
 *
 * A located frame (`at name (file:line:column)`) has to appear before anything is split off, so a
 * message that merely contains the word "at" keeps every line it was written with.
 */
export function splitTextStack(text: string): { message: string; frames: StackFrame[] } {
  const lines = text.split('\n');
  const first = lines.findIndex((line) => STACK_LINE.test(line));
  if (first < 0) {
    return { message: text, frames: [] };
  }
  return {
    message: lines.slice(0, first).join('\n').trimEnd(),
    frames: parseStackFrames(lines.slice(first).join('\n')),
  };
}

/**
 * Render frames as `  at name (file:line:column)` lines.
 *
 * Columns are printed one higher than they are carried, so the output matches what an editor shows
 * — the same convention `formatCdpStackTrace` already prints.
 */
export function formatStackFrames(frames: StackFrame[]): string {
  return frames
    .map((frame) =>
      frame.file
        ? `  at ${frame.methodName} (${frame.file}:${frame.lineNumber}:${frame.column + 1})`
        : `  at ${frame.methodName}`
    )
    .join('\n');
}

/**
 * Drop the query string of a bundle URL, keeping the path.
 *
 * The query is what makes a stack unreadable — the same 400 characters of transform options on
 * every line — and it says nothing about where the error is. Both spellings are handled: the
 * ordinary `?a=b` and the JSC-safe `//&a=b` that iOS produces.
 */
export function trimBundleUrl(file: string): string {
  if (!file.includes('://')) {
    return file;
  }
  const jscSafe = file.indexOf('//&');
  const trimmed = jscSafe >= 0 ? file.slice(0, jscSafe) : file;
  const query = trimmed.indexOf('?');
  return query >= 0 ? trimmed.slice(0, query) : trimmed;
}

/** Whether a frame still points at a bundle rather than at a file on disk. */
export function isUnmappedFrame(frame: StackFrame): boolean {
  return frame.file.includes('://');
}

/**
 * Make a symbolicated frame readable: project-relative where it can be, trimmed where it cannot.
 *
 * A path under the project is shown relative to it, which is what a `file:line` is for — somewhere
 * to open. A path outside it (a file in `node_modules`, or one Metro resolved through a monorepo)
 * is left absolute, because a `../../..` prefix is not more useful than the path itself.
 */
export function relativizeFrame(frame: StackFrame, projectRoot: string | null): StackFrame {
  if (isUnmappedFrame(frame)) {
    return { ...frame, file: trimBundleUrl(frame.file) };
  }
  const prefix = projectRoot == null ? null : projectRoot.replace(/\/+$/, '') + '/';
  return prefix != null && frame.file.startsWith(prefix)
    ? { ...frame, file: frame.file.slice(prefix.length) }
    : frame;
}

/** How long the dev server is given to map one stack. */
const SYMBOLICATE_TIMEOUT_MS = 5000;

/**
 * Ask the dev server to map bundle offsets onto project files.
 *
 * Never throws: symbolication is an improvement on the report, not a precondition for it, so a dev
 * server that answers 500 — or does not answer — leaves the caller with the frames it already had.
 *
 * @param devServerUrl the dev server that built the bundle these frames came from. Frames from
 * another bundle are returned unchanged by Metro rather than mapped to the wrong file.
 * @returns one frame per input frame, in the same order.
 */
export async function symbolicateFramesAsync(
  devServerUrl: string,
  frames: StackFrame[]
): Promise<StackFrame[]> {
  if (frames.length === 0 || !frames.some(isUnmappedFrame)) {
    return frames;
  }

  const url = `${devServerUrl.replace(/\/+$/, '')}/symbolicate`;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stack: frames }),
      signal: AbortSignal.timeout(SYMBOLICATE_TIMEOUT_MS),
    });
    if (!response.ok) {
      debugEvent('symbolicate_failed', { url, reason: `answered ${response.status}` });
      return frames;
    }
    const payload = (await response.json()) as { stack?: unknown };
    const answered: unknown[] = Array.isArray(payload.stack) ? payload.stack : [];
    if (answered.length !== frames.length) {
      debugEvent('symbolicate_failed', { url, reason: 'the answer was not one frame per frame' });
      return frames;
    }
    // Per frame rather than per stack: Metro maps what it can and hands the rest back untouched,
    // so a stack that is half framework and half project is still half useful.
    return frames.map((frame, index) => readSymbolicatedFrame(answered[index], frame));
  } catch (error: unknown) {
    debugEvent('symbolicate_failed', {
      url,
      reason: error instanceof Error ? error.message : String(error),
    });
    return frames;
  }
}

/**
 * Read one frame out of the symbolicator's answer, falling back to the frame that was sent.
 *
 * Expo's `customizeFrame` hook nulls `lineNumber` and `column` for a frame it could not map, so a
 * frame that came back without a usable line is the original, not an improvement on it.
 */
function readSymbolicatedFrame(answer: unknown, original: StackFrame): StackFrame {
  if (typeof answer !== 'object' || answer === null) {
    return original;
  }
  const frame = answer as Record<string, unknown>;
  const collapse = typeof frame.collapse === 'boolean' ? frame.collapse : undefined;
  if (typeof frame.file !== 'string' || typeof frame.lineNumber !== 'number') {
    return collapse == null ? original : { ...original, collapse };
  }
  return {
    methodName: typeof frame.methodName === 'string' ? frame.methodName : original.methodName,
    file: frame.file,
    lineNumber: frame.lineNumber,
    column: typeof frame.column === 'number' ? frame.column : 0,
    ...(collapse == null ? {} : { collapse }),
  };
}
