import path from 'node:path';
import type { StackFrame } from 'stacktrace-parser';

export type MetroStackFrame = StackFrame & { collapse?: boolean };

export function formatProjectFilePath(projectRoot: string, file?: string | null): string {
  if (file == null) {
    return '<unknown>';
  }
  if (file === '<anonymous>') {
    return file;
  }

  return path
    .relative(projectRoot.replace(/\\/g, '/'), file.replace(/\\/g, '/'))
    .replace(/\?.*$/, '');
}

export function getStackFormattedLocation(projectRoot: string, frame: MetroStackFrame) {
  const column = frame.column != null && parseInt(String(frame.column), 10);
  const location =
    formatProjectFilePath(projectRoot, frame.file) +
    (frame.lineNumber != null
      ? ':' + frame.lineNumber + (column && !isNaN(column) ? ':' + (column + 1) : '')
      : '');

  return location;
}
