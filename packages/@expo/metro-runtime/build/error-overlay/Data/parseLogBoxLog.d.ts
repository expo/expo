/**
 * Copyright (c) Evan Bacon.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import type { LogBoxLogData } from "./LogBoxLog";
type ExceptionData = any;
export type ExtendedExceptionData = ExceptionData & {
    isComponentError: boolean;
    [key: string]: any;
};
export type Category = string;
export type CodeFrame = {
    content: string;
    location?: {
        row: number;
        column: number;
        [key: string]: any;
    } | null;
    fileName: string;
    collapse?: boolean;
};
export type Message = {
    content: string;
    substitutions: {
        length: number;
        offset: number;
    }[];
};
export type ComponentStack = CodeFrame[];
export declare function parseInterpolation(args: readonly any[]): {
    category: Category;
    message: Message;
};
export declare function parseComponentStack(message: string): ComponentStack;
export declare function parseLogBoxException(error: ExtendedExceptionData): LogBoxLogData;
export declare function parseLogBoxLog(args: readonly any[]): {
    componentStack: ComponentStack;
    category: Category;
    message: Message;
};
export {};
//# sourceMappingURL=parseLogBoxLog.d.ts.map