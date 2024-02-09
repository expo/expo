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
declare function symbolicateStackTrace(stack: StackFrame[]): Promise<SymbolicatedStackTrace>;
export default symbolicateStackTrace;
//# sourceMappingURL=index.d.ts.map