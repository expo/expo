// @ref llp/0005-runtime-loop-tools.rfc.md
// Formatting for the Chrome DevTools Protocol payloads the app sends back: values, exceptions,
// stacks, and console arguments. Pure functions only, so every shape is unit-testable without a
// dev server.
import type CdpMessageType from 'devtools-protocol';

import { splitMethodContext, type StackFrame } from './symbolicate';

/** Formatted view of a CDP exception, ready to show to a caller. */
export interface FormattedCdpException {
  /** Single line error message, e.g. `TypeError: x is not a function`. */
  message: string;
  /** Stack as the runtime reported it, one frame per line, when available. */
  stack?: string;
  /** Source location as `url:line:column`, when the runtime reported a url. */
  location?: string;
}

/** Serializes an unknown value for display without throwing on cycles. */
export function stringifyCdpValue(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }
  try {
    return JSON.stringify(value) ?? String(value);
  } catch {
    return String(value);
  }
}

/**
 * Formats a CDP stack trace into `  at name (url:line:column)` lines.
 * CDP reports zero-based positions; the output is one-based to match editors.
 */
export function formatCdpStackTrace(
  stackTrace?: CdpMessageType.Runtime.StackTrace
): string | undefined {
  const callFrames = stackTrace?.callFrames ?? [];
  if (callFrames.length === 0) {
    return undefined;
  }

  return callFrames
    .map((frame) => {
      const name = frame.functionName || '<anonymous>';
      const location = formatLocation(frame.url, frame.lineNumber, frame.columnNumber);
      return location ? `  at ${name} (${location})` : `  at ${name}`;
    })
    .join('\n');
}

/**
 * Reads a CDP stack trace as frames the symbolicator can map.
 *
 * Kept next to {@link formatCdpStackTrace} because they differ in exactly one thing that matters:
 * CDP counts both lines and columns from 0, editors count both from 1, and Metro counts lines from
 * 1 and columns from 0. Only the last of those is what goes on the wire.
 */
export function cdpStackFrames(stackTrace?: CdpMessageType.Runtime.StackTrace): StackFrame[] {
  return (stackTrace?.callFrames ?? [])
    .filter((frame) => !!frame.url)
    .map((frame) => {
      // The React Compiler writes the original module into the function's own name, so a
      // `functionName` arrives as `HomeScreen (./index.tsx)`. Split here as well as in the text
      // parser, so a frame has one shape whichever way the runtime reported it.
      const { methodName, sourceHint } = splitMethodContext(frame.functionName || '<anonymous>');
      return {
        methodName,
        file: frame.url,
        lineNumber: (frame.lineNumber ?? 0) + 1,
        column: frame.columnNumber ?? 0,
        ...(sourceHint == null ? null : { sourceHint }),
      };
    });
}

/** Extracts the message, stack, and source location from CDP exception details. */
export function formatCdpExceptionDetails(
  exceptionDetails: CdpMessageType.Runtime.ExceptionDetails
): FormattedCdpException {
  const { exception, text, stackTrace, url, lineNumber, columnNumber } = exceptionDetails;
  const description =
    typeof exception?.description === 'string' ? exception.description : undefined;

  let message: string;
  if (description) {
    message = description.split('\n')[0] ?? description;
  } else if (exception && exception.value !== undefined) {
    message = stringifyCdpValue(exception.value);
  } else {
    message = text || 'Unknown error';
  }

  let stack = formatCdpStackTrace(stackTrace);
  if (!stack && description?.includes('\n')) {
    // Some runtimes only send the stack as part of the exception description.
    stack = description.split('\n').slice(1).join('\n');
  }

  return {
    message,
    stack,
    location: formatLocation(url, lineNumber, columnNumber),
  };
}

/** Formats CDP console arguments the same way a console would print them. */
export function formatCdpConsoleArgs(args?: CdpMessageType.Runtime.RemoteObject[]): string {
  return (args ?? [])
    .map((arg) => {
      if (arg.value !== undefined) {
        return stringifyCdpValue(arg.value);
      }
      return arg.description ?? arg.type;
    })
    .join(' ');
}

function formatLocation(
  url: string | undefined,
  lineNumber: number | undefined,
  columnNumber: number | undefined
): string | undefined {
  if (!url) {
    return undefined;
  }
  const line = (lineNumber ?? 0) + 1;
  const column = (columnNumber ?? 0) + 1;
  return `${url}:${line}:${column}`;
}
