import { parse } from 'stacktrace-parser';

import type { MetroStackFrame } from '../Data/Types';

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
