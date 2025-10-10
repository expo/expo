/**
 * Copyright (c) 650 Industries.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import type { Category, LogBoxLogData, Message, MetroStackFrame } from './Types';
type ExceptionData = any;
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
