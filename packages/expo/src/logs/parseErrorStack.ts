/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

import { parse } from 'stacktrace-parser';

export type StackFrame = {
  column?: number;
  file: string;
  lineNumber: number;
  methodName: string;
};

export type ExtendedError = Error & {
  framesToPop?: number;
  jsEngine?: string;
};

export default function parseErrorStack(e: ExtendedError): StackFrame[] {
  if (!e || !e.stack) {
    return [];
  }

  const stack = Array.isArray(e.stack) ? e.stack : parse(e.stack);

  let framesToPop = typeof e.framesToPop === 'number' ? e.framesToPop : 0;
  while (framesToPop--) {
    stack.shift();
  }
  return stack;
}
