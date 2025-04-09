/**
 * Copyright (c) 650 Industries.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { type MetroStackFrame } from '../devServerEndpoints';
import type { Category, Message, ComponentStack, CodeFrame } from './parseLogBoxLog';
export type SymbolicationStatus = 'NONE' | 'PENDING' | 'COMPLETE' | 'FAILED';
export type LogLevel = 'warn' | 'error' | 'fatal' | 'syntax' | 'static';
export type LogBoxLogData = {
    level: LogLevel;
    type?: string;
    message: Message;
    stack: MetroStackFrame[];
    category: string;
    componentStack: ComponentStack;
    codeFrame?: CodeFrame;
    isComponentError: boolean;
};
export type StackType = 'stack' | 'component';
type SymbolicationResult = {
    error: null;
    stack: null;
    status: 'NONE';
} | {
    error: null;
    stack: null;
    status: 'PENDING';
} | {
    error: null;
    stack: MetroStackFrame[];
    status: 'COMPLETE';
} | {
    error: Error;
    stack: null;
    status: 'FAILED';
};
export declare class LogBoxLog {
    message: Message;
    type: string;
    category: Category;
    componentStack: ComponentStack;
    stack: MetroStackFrame[];
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
    getAvailableStack(type: StackType): MetroStackFrame[] | null;
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