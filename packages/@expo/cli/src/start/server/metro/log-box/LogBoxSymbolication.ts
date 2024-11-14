/**
 * Copyright (c) 650 Industries.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { parse, StackFrame as UpstreamStackFrame } from 'stacktrace-parser';

export type CodeFrame = {
  content: string;
  location?: {
    row: number;
    column: number;
    [key: string]: any;
  } | null;
  fileName: string;

  // TODO: When React switched to using call stack frames,
  // we gained the ability to use the collapse flag, but
  // it is not integrated into the LogBox UI.
  collapse?: boolean;
};

export type SymbolicatedStackTrace = {
  stack: UpstreamStackFrame[];
  codeFrame?: CodeFrame;
};

export type StackFrame = UpstreamStackFrame & { collapse?: boolean };

const cache: Map<StackFrame[], Promise<SymbolicatedStackTrace>> = new Map();

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
  const stack: StackFrame[] = [];
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

export function deleteStack(stack: StackFrame[]): void {
  cache.delete(stack);
}

export function symbolicate(stack: StackFrame[]): Promise<SymbolicatedStackTrace> {
  let promise = cache.get(stack);
  if (promise == null) {
    promise = symbolicateStackTrace(stack).then(sanitize);
    cache.set(stack, promise);
  }

  return promise;
}

async function symbolicateStackTrace(stack: UpstreamStackFrame[]): Promise<SymbolicatedStackTrace> {
  const baseUrl =
    typeof window === 'undefined'
      ? process.env.EXPO_DEV_SERVER_ORIGIN
      : window.location.protocol + '//' + window.location.host;

  return fetch(baseUrl + '/symbolicate', {
    method: 'POST',
    body: JSON.stringify({ stack }),
  }).then((res) => res.json());
}

export function parseErrorStack(stack?: string): (UpstreamStackFrame & { collapse?: boolean })[] {
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
