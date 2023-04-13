import fetch from 'node-fetch';
import { parse, StackFrame } from 'stacktrace-parser';

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
  stack: StackFrame[];
  codeFrame?: CodeFrame;
};

export async function symbolicateStackTrace(
  origin: string,
  stack: StackFrame[]
): Promise<SymbolicatedStackTrace> {
  const response = await fetch(origin + '/symbolicate', {
    method: 'POST',
    body: JSON.stringify({ stack }),
  });
  return await response.json();
}

export function parseErrorStack(stack?: string): (StackFrame & { collapse?: boolean })[] {
  if (stack == null) {
    return [];
  }
  if (Array.isArray(stack)) {
    return stack;
  }

  // Native support for parsing for non-standard Hermes stack traces.
  //   // @ts-expect-error: HermesInternal is not a global variable, but it is injected by the Hermes VM.
  //   if (global.HermesInternal) {
  //     return require("./parseHermesStack").parseErrorStack(stack);
  //   }

  return parse(stack).map((frame) => {
    // frame.file will mostly look like `http://localhost:8081/index.bundle?platform=web&dev=true&hot=false`
    return {
      ...frame,
      column: frame.column != null ? frame.column - 1 : null,
    };
  });
}

declare const process: any;

export function openFileInEditor(baseUrl: string, file: string, lineNumber: number) {
  if (process.env.NODE_ENV !== 'production') {
    // TODO: This is not a great URL since it now blocks users from accessing the `/open-stack-frame` url in their router
    // ideally it would be something like `/_devtools/open-stack-frame`.

    fetch(baseUrl + '/open-stack-frame', {
      method: 'POST',
      body: JSON.stringify({ file, lineNumber }),
    });
  }
}

const cache: Map<Stack, Promise<SymbolicatedStackTrace>> = new Map();

/**
 * Sanitize because sometimes, `symbolicateStackTrace` gives us invalid values.
 */
const sanitize = ({
  stack: maybeStack,
  codeFrame,
}: SymbolicatedStackTrace): SymbolicatedStackTrace => {
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
};

export function symbolicate(originUrl: string, stack: Stack): Promise<SymbolicatedStackTrace> {
  let promise = cache.get(stack);
  if (promise == null) {
    promise = symbolicateStackTrace(originUrl, stack).then(sanitize);
    cache.set(stack, promise);
  }

  return promise;
}

type MetroStackFrame = StackFrame & { collapse?: boolean };

export type Stack = StackFrame[];

export async function symbolicateServerError(
  originUrl: string,
  error: Error
): Promise<SymbolicatedStackTrace> {
  const stack = parseErrorStack(error.stack);

  return symbolicate(originUrl, stack);
}

export function getStackFormattedLocation(projectRoot: string, frame: MetroStackFrame) {
  const column = frame.column != null && parseInt(String(frame.column), 10);
  const location =
    formatProjectFileName(projectRoot, frame.file) +
    (frame.lineNumber != null
      ? ':' + frame.lineNumber + (column && !isNaN(column) ? ':' + (column + 1) : '')
      : '');

  return location;
}

export function formatProjectFileName(projectRoot: string, file?: string | null): string {
  if (file == null) {
    return '<unknown>';
  }
  if (!projectRoot) {
    return file;
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
