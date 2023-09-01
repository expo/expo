import { parse, StackFrame } from 'stacktrace-parser';

function parseErrorStack(stack?: string): (StackFrame & { collapse?: boolean })[] {
  if (stack == null) {
    return [];
  }
  if (Array.isArray(stack)) {
    return stack;
  }

  // This file seems to be web-only, so we can remove this.
  // // Native support for parsing for non-standard Hermes stack traces.
  // if (global.HermesInternal) {
  //   return require('./parseHermesStack').parseErrorStack(stack);
  // }

  return parse(stack).map((frame) => {
    // frame.file will mostly look like `http://localhost:8081/index.bundle?platform=web&dev=true&hot=false`
    return {
      ...frame,
      column: frame.column != null ? frame.column - 1 : null,
    };
  });
}

export default parseErrorStack;
