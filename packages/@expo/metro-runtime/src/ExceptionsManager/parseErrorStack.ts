import { parse, type StackFrame as UpstreamStackFrame } from 'stacktrace-parser';

export type MetroStackFrame = UpstreamStackFrame & { collapse?: boolean };

export function parseErrorStack(stack?: string): MetroStackFrame[] {
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
