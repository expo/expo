import { parse, type StackFrame as UpstreamStackFrame } from 'stacktrace-parser';

export type MetroStackFrame = UpstreamStackFrame & { collapse?: boolean };

export type CodeFrame = {
  content: string;
  location?: {
    row: number;
    column: number;
    [key: string]: any;
  };
  fileName: string;
};

export type SymbolicatedStackTrace = {
  stack: MetroStackFrame[];
  codeFrame?: CodeFrame;
};

const cache: Map<MetroStackFrame[], Promise<SymbolicatedStackTrace>> = new Map();

function getBaseUrl() {
  if (typeof window === 'undefined') {
    return process.env.EXPO_DEV_SERVER_ORIGIN;
  }

  if (process.env.EXPO_OS !== 'web') {
    const getDevServer = require('react-native/Libraries/Core/Devtools/getDevServer').default;
    const devServer = getDevServer();
    if (!devServer.bundleLoadedFromServer) {
      throw new Error('Cannot create devtools websocket connections in embedded environments.');
    }

    return devServer.url;
  }

  return window.location.protocol + '//' + window.location.host;
}

export function openFileInEditor(file: string, lineNumber: number): void {
  fetch(new URL('/open-stack-frame', getBaseUrl()).href, {
    method: 'POST',
    body: JSON.stringify({ file, lineNumber }),
  });
}

async function symbolicateStackTrace(stack: MetroStackFrame[]): Promise<SymbolicatedStackTrace> {
  const response = await fetch(new URL('/symbolicate', getBaseUrl()).href, {
    method: 'POST',
    body: JSON.stringify({ stack }),
  });
  return await response.json();
}

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

export function getStackFormattedLocation(
  projectRoot: string,
  frame: Pick<MetroStackFrame, 'column' | 'file' | 'lineNumber'>
): string {
  const column = frame.column != null && parseInt(String(frame.column), 10);
  const location =
    formatProjectFilePath(projectRoot, frame.file) +
    (frame.lineNumber != null
      ? ':' + frame.lineNumber + (column && !isNaN(column) ? ':' + (column + 1) : '')
      : '');

  return location;
}

export function parseErrorStack(stack?: string): (MetroStackFrame & { collapse?: boolean })[] {
  if (stack == null) {
    return [];
  }
  if (Array.isArray(stack)) {
    return stack;
  }

  return parse(stack).map((frame) => {
    // frame.file will mostly look like `http://localhost:8081/index.bundle?platform=web&dev=true&hot=false`
    return {
      ...frame,
      column: frame.column != null ? frame.column - 1 : null,
    };
  });
}

/**
 * Sanitize because sometimes, `symbolicateStackTrace` gives us invalid values.
 */
function normalizeMetroSymbolicatedStackResults({
  stack: maybeStack,
  codeFrame,
}: SymbolicatedStackTrace): SymbolicatedStackTrace {
  if (!Array.isArray(maybeStack)) {
    throw new Error('Expected stack to be an array.');
  }
  const stack: MetroStackFrame[] = [];
  for (const maybeFrame of maybeStack) {
    let collapse = false;
    if ('collapse' in maybeFrame) {
      if (typeof maybeFrame.collapse !== 'boolean') {
        throw new Error('Expected stack frame `collapse` to be a boolean.');
      }
      collapse = maybeFrame.collapse;
    }
    stack.push({
      arguments: [],
      column: maybeFrame.column,
      file: maybeFrame.file,
      lineNumber: maybeFrame.lineNumber,
      methodName: maybeFrame.methodName,
      collapse,
    });
  }
  return { stack, codeFrame };
}

export function invalidateCachedStack(stack: MetroStackFrame[]): void {
  cache.delete(stack);
}

export function symbolicateStackAndCacheAsync(
  stack: MetroStackFrame[]
): Promise<SymbolicatedStackTrace> {
  let promise = cache.get(stack);
  if (promise == null) {
    promise = symbolicateStackTrace(stack).then(normalizeMetroSymbolicatedStackResults);
    cache.set(stack, promise);
  }

  return promise;
}
