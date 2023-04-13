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

export type MetroStackFrame = StackFrame & { collapse?: boolean };
export type Stack = StackFrame[];

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
