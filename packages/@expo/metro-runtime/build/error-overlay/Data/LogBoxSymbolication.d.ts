/**
 * Copyright (c) 650 Industries.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { StackFrame as UpstreamStackFrame } from 'stacktrace-parser';
type SymbolicatedStackTrace = any;
type StackFrame = UpstreamStackFrame & {
    collapse?: boolean;
};
export type Stack = StackFrame[];
export declare function deleteStack(stack: Stack): void;
export declare function symbolicate(stack: Stack): Promise<SymbolicatedStackTrace>;
export {};
//# sourceMappingURL=LogBoxSymbolication.d.ts.map