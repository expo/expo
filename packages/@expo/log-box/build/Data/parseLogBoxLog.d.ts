/**
 * Copyright (c) 650 Industries.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import type { Category, LogBoxLogData, Message, MetroStackFrame } from './Types';
type ExceptionData = {
    message: string;
    originalMessage: string | undefined;
    name: string | undefined;
    componentStack: string | undefined;
    stack: {
        column: number | null;
        file: string | null;
        lineNumber: number | null;
        methodName: string;
        collapse?: boolean;
    }[];
    id: number;
    isFatal: boolean;
    extraData?: Record<string, unknown>;
    [key: string]: unknown;
};
export type ExtendedExceptionData = ExceptionData & {
    isComponentError: boolean;
    [key: string]: any;
};
export declare function parseInterpolation(args: readonly any[]): {
    category: Category;
    message: Message;
};
export declare function parseLogBoxException(error: ExtendedExceptionData): LogBoxLogData;
export declare function isError(err: any): err is Error;
export declare function parseLogBoxLog(args: any[]): {
    componentStack: MetroStackFrame[];
    category: Category;
    message: Message;
};
export {};
//# sourceMappingURL=parseLogBoxLog.d.ts.map