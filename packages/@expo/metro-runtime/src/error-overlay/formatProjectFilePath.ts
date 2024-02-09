import type { StackFrame } from 'stacktrace-parser';

export type MetroStackFrame = StackFrame & { collapse?: boolean };

export function formatProjectFilePath(projectRoot: string, file?: string | null): string {
  if (file == null) {
    return '<unknown>';
  }

  return pathRelativeToPath(file.replace(/\\/g, '/'), projectRoot.replace(/\\/g, '/')).replace(
    /\?.*$/,
    ''
  );
}

function pathRelativeToPath(path: string, relativeTo: string, sep = '/') {
  const relativeToParts = relativeTo.split(sep);
  const pathParts = path.split(sep);
  let i = 0;
  while (i < relativeToParts.length && i < pathParts.length) {
    if (relativeToParts[i] !== pathParts[i]) {
      break;
    }
    i++;
  }
  return pathParts.slice(i).join(sep);
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
