/**
 * Copyright (c) 650 Industries.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { StackFrame } from 'stacktrace-parser';

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

async function symbolicateStackTrace(stack: StackFrame[]): Promise<SymbolicatedStackTrace> {
  const baseUrl =
    typeof window === 'undefined'
      ? process.env.EXPO_DEV_SERVER_ORIGIN
      : window.location.protocol + '//' + window.location.host;

  const response = await fetch(baseUrl + '/symbolicate', {
    method: 'POST',
    body: JSON.stringify({ stack }),
  });
  return await response.json();
}

export default symbolicateStackTrace;
