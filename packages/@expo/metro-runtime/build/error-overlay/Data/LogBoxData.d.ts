/**
 * Copyright (c) 650 Industries.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import * as React from 'react';
import { LogBoxLog, StackType } from './LogBoxLog';
import type { LogLevel } from './LogBoxLog';
import type { Message, Category, ComponentStack, ExtendedExceptionData } from './parseLogBoxLog';
export type LogBoxLogs = Set<LogBoxLog>;
export type LogData = {
    level: LogLevel;
    message: Message;
    category: Category;
    componentStack: ComponentStack;
};
type ExtendedError = any;
export type Observer = (options: {
    logs: LogBoxLogs;
    isDisabled: boolean;
    selectedLogIndex: number;
}) => void;
export type IgnorePattern = string | RegExp;
export type Subscription = {
    unsubscribe: () => void;
};
export type WarningInfo = {
    finalFormat: string;
    forceDialogImmediately: boolean;
    suppressDialog_LEGACY: boolean;
    suppressCompletely: boolean;
    monitorEvent: string | null;
    monitorListVersion: number;
    monitorSampleRate: number;
};
export type WarningFilter = (format: string) => WarningInfo;
export declare function reportLogBoxError(error: ExtendedError, componentStack?: string): void;
export declare function reportUnexpectedLogBoxError(error: ExtendedError, componentStack?: string): void;
export declare function isLogBoxErrorMessage(message: string): boolean;
export declare function isMessageIgnored(message: string): boolean;
export declare function addLog(log: LogData): void;
export declare function addException(error: ExtendedExceptionData): void;
export declare function symbolicateLogNow(type: StackType, log: LogBoxLog): void;
export declare function retrySymbolicateLogNow(type: StackType, log: LogBoxLog): void;
export declare function symbolicateLogLazy(type: StackType, log: LogBoxLog): void;
export declare function clear(): void;
export declare function setSelectedLog(proposedNewIndex: number): void;
export declare function clearWarnings(): void;
export declare function clearErrors(): void;
export declare function dismiss(log: LogBoxLog): void;
export declare function getIgnorePatterns(): IgnorePattern[];
export declare function addIgnorePatterns(patterns: IgnorePattern[]): void;
export declare function setDisabled(value: boolean): void;
export declare function isDisabled(): boolean;
export declare function observe(observer: Observer): Subscription;
export declare function withSubscription(WrappedComponent: React.FC<object>): React.Component<object>;
export {};
//# sourceMappingURL=LogBoxData.d.ts.map