/**
 * Copyright (c) 650 Industries.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React from 'react';
import { type MetroStackFrame } from '../devServerEndpoints';
import type { Category, Message, CodeFrame } from './parseLogBoxLog';
export type SymbolicationStatus = 'NONE' | 'PENDING' | 'COMPLETE' | 'FAILED';
export type LogLevel = 'error' | 'fatal' | 'syntax' | 'resolution' | 'static';
export type LogBoxLogData = {
    level: LogLevel;
    type?: string;
    message: Message;
    stack: MetroStackFrame[];
    category: string;
    componentStack: MetroStackFrame[];
    codeFrame: Partial<Record<StackType, CodeFrame>>;
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
    componentStack: MetroStackFrame[];
    stack: MetroStackFrame[];
    count: number;
    level: LogLevel;
    codeFrame: Partial<Record<StackType, CodeFrame>>;
    isComponentError: boolean;
    private symbolicated;
    private callbacks;
    constructor(data: LogBoxLogData & {
        symbolicated?: Record<StackType, SymbolicationResult>;
    });
    incrementCount(): void;
    getStackStatus(type: StackType): "NONE" | "PENDING" | "COMPLETE" | "FAILED";
    getAvailableStack(type: StackType): MetroStackFrame[] | null;
    private flushCallbacks;
    private pushCallback;
    retrySymbolicate(type: StackType, callback?: (status: SymbolicationStatus) => void): void;
    symbolicate(type: StackType, callback?: (status: SymbolicationStatus) => void): void;
    private _symbolicate;
    private getStack;
    private handleSymbolicate;
    private updateStatus;
}
export declare const LogContext: React.Context<{
    selectedLogIndex: number;
    isDisabled: boolean;
    logs: LogBoxLog[];
} | null>;
export declare function useLogs(): {
    selectedLogIndex: number;
    isDisabled: boolean;
    logs: LogBoxLog[];
};
export {};
//# sourceMappingURL=LogBoxLog.d.ts.map