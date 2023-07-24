/**
 * Copyright (c) Evan Bacon.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import type { Stack } from "./LogBoxSymbolication";
import type { Category, Message, ComponentStack, CodeFrame } from "./parseLogBoxLog";
type SymbolicationStatus = "NONE" | "PENDING" | "COMPLETE" | "FAILED";
export type LogLevel = "warn" | "error" | "fatal" | "syntax" | "static";
export type LogBoxLogData = {
    level: LogLevel;
    type?: string;
    message: Message;
    stack: Stack;
    category: string;
    componentStack: ComponentStack;
    codeFrame?: CodeFrame;
    isComponentError: boolean;
};
export type StackType = "stack" | "component";
type SymbolicationResult = {
    error: null;
    stack: null;
    status: "NONE";
} | {
    error: null;
    stack: null;
    status: "PENDING";
} | {
    error: null;
    stack: Stack;
    status: "COMPLETE";
} | {
    error: Error;
    stack: null;
    status: "FAILED";
};
export declare class LogBoxLog {
    message: Message;
    type: string;
    category: Category;
    componentStack: ComponentStack;
    stack: Stack;
    count: number;
    level: LogLevel;
    codeFrame?: CodeFrame;
    isComponentError: boolean;
    symbolicated: Record<StackType, SymbolicationResult>;
    private callbacks;
    constructor(data: LogBoxLogData & {
        symbolicated?: Record<StackType, SymbolicationResult>;
    });
    incrementCount(): void;
    getAvailableStack(type: StackType): Stack | null;
    private flushCallbacks;
    private pushCallback;
    retrySymbolicate(type: StackType, callback?: (status: SymbolicationStatus) => void): void;
    symbolicate(type: StackType, callback?: (status: SymbolicationStatus) => void): void;
    private _symbolicate;
    private componentStackCache;
    private getStack;
    private handleSymbolicate;
    private updateStatus;
}
export {};
//# sourceMappingURL=LogBoxLog.d.ts.map