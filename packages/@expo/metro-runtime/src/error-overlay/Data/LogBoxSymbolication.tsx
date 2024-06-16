/**
 * Copyright (c) 650 Industries.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { StackFrame as UpstreamStackFrame } from 'stacktrace-parser';

import symbolicateStackTrace from '../modules/symbolicateStackTrace';

type SymbolicatedStackTrace = any;

type StackFrame = UpstreamStackFrame & { collapse?: boolean };

export type Stack = StackFrame[];

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

export function deleteStack(stack: Stack): void {
  cache.delete(stack);
}

export function symbolicate(stack: Stack): Promise<SymbolicatedStackTrace> {
  let promise = cache.get(stack);
  if (promise == null) {
    promise = symbolicateStackTrace(stack).then(sanitize);
    cache.set(stack, promise);
  }

  return promise;
}
