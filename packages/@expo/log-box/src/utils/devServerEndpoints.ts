import type { CodeFrame, MetroStackFrame } from '../Data/Types';
import { fetchTextAsync } from '../fetchHelper';

export type SymbolicatedStackTrace = {
  stack: MetroStackFrame[];
  codeFrame?: CodeFrame;
};

const cache: Map<MetroStackFrame[], Promise<SymbolicatedStackTrace>> = new Map();

export function getBaseUrl() {
  const devServerOverride = process.env.EXPO_DEV_SERVER_ORIGIN;
  if (devServerOverride) {
    return devServerOverride;
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

function fetchTextAsyncWithBase(url: string, init?: RequestInit) {
  const fullUrl = new URL(url, getBaseUrl()).href;
  return fetchTextAsync(fullUrl, init);
}

export function openFileInEditor(file: string, lineNumber: number): void {
  fetchTextAsyncWithBase('/open-stack-frame', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ file, lineNumber }),
  });
}

export async function fetchProjectMetadataAsync(): Promise<{
  projectRoot: string;
  serverRoot: string;
  sdkVersion: string;
}> {
  // Dev Server implementation https://github.com/expo/expo/blob/f29b9f3715e42dca87bf3eebf11f7e7dd1ff73c1/packages/%40expo/cli/src/start/server/metro/MetroBundlerDevServer.ts#L1145
  const response = await fetchTextAsyncWithBase('/_expo/error-overlay-meta', {
    method: 'GET',
  });
  return JSON.parse(response);
}

async function symbolicateStackTrace(stack: MetroStackFrame[]): Promise<SymbolicatedStackTrace> {
  const response = await fetchTextAsyncWithBase('/symbolicate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ stack }),
  });
  return JSON.parse(response);
}

export function formatProjectFilePath(
  projectRoot: string = '',
  file: string | null = null
): string {
  if (file == null) {
    return '<unknown>';
  }

  return pathRelativeToPath(file.replace(/\\/g, '/'), projectRoot.replace(/\\/g, '/')).replace(
    /\?.*$/,
    ''
  );
}

export function getFormattedStackTrace(stack: MetroStackFrame[], projectRoot: string = '') {
  return stack
    .map((frame) => {
      let stack = `  at `;

      const location = getStackFormattedLocation(projectRoot, frame);
      stack += `${frame.methodName ?? '<unknown>'} (${location})`;
      return stack;
    })
    .join('\n');
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

export function isStackFileAnonymous(
  frame: Pick<MetroStackFrame, 'column' | 'file' | 'lineNumber'>
): boolean {
  return !frame.file || frame.file === '<unknown>' || frame.file === '<anonymous>';
}

export function getStackFormattedLocation(
  projectRoot: string | undefined,
  frame: Pick<MetroStackFrame, 'column' | 'file' | 'lineNumber'>
): string {
  const column = frame.column != null && parseInt(String(frame.column), 10);
  let location = formatProjectFilePath(projectRoot, frame.file);

  if (frame.lineNumber != null && frame.lineNumber >= 0) {
    location += ':' + frame.lineNumber;
    if (column && !isNaN(column) && column >= 0) {
      location += ':' + (column + 1);
    }
  }

  return location;
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
  const stack = maybeStack.map<MetroStackFrame>((maybeFrame) => {
    let collapse = false;
    if ('collapse' in maybeFrame) {
      if (typeof maybeFrame.collapse !== 'boolean') {
        throw new Error('Expected stack frame `collapse` to be a boolean.');
      }
      collapse = maybeFrame.collapse;
    }
    return {
      arguments: [],
      column: maybeFrame.column,
      file: maybeFrame.file,
      lineNumber: maybeFrame.lineNumber,
      methodName: maybeFrame.methodName,
      collapse,
    };
  });
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
    promise = symbolicateStackTrace(ensureStackFilesHaveParams(stack)).then(
      normalizeMetroSymbolicatedStackResults
    );
    cache.set(stack, promise);
  }

  return promise;
}

// Sometime the web stacks don't have correct query params, this can lead to Metro errors when it attempts to resolve without a platform.
// This will attempt to reconcile the issue by adding the current query params to the stack frames if they exist, or fallback to some common defaults.
function ensureStackFilesHaveParams(stack: MetroStackFrame[]): MetroStackFrame[] {
  const currentSrc =
    typeof document !== 'undefined' && document.currentScript
      ? ('src' in document.currentScript && document.currentScript.src) || null
      : null;

  const platform = process.env.EXPO_DOM_HOST_OS ?? process.env.EXPO_OS;
  const currentParams = currentSrc
    ? new URLSearchParams(currentSrc)
    : new URLSearchParams({
        ...(platform ? { platform } : undefined),
        dev: String(__DEV__),
      });

  return stack.map((frame) => {
    if (
      !frame.file?.startsWith('http') ||
      // Account for Metro malformed URLs
      frame.file.includes('&platform=')
    )
      return frame;

    const url = new URL(frame.file);
    if (url.searchParams.has('platform')) {
      return frame;
    }

    currentParams.forEach((value, key) => {
      if (url.searchParams.has(key)) return;
      url.searchParams.set(key, value);
    });

    return { ...frame, file: url.toString() };
  });
}
