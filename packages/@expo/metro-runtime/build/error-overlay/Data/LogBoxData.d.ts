/**
 * Copyright (c) 650 Industries.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import * as React from 'react';
import { MetroStackFrame } from '../devServerEndpoints';
import type { LogLevel } from './LogBoxLog';
import { LogBoxLog, StackType } from './LogBoxLog';
import type { Category, ExtendedExceptionData, Message } from './parseLogBoxLog';
export type LogBoxLogs = Set<LogBoxLog>;
export type LogData = {
    level: LogLevel;
    message: Message;
    category: Category;
    componentStack: MetroStackFrame[];
};
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
type State = {
    logs: LogBoxLogs;
    isDisabled: boolean;
    hasError: boolean;
    selectedLogIndex: number;
};
export declare function reportUnexpectedLogBoxError(error: any): void;
export declare function reportUnexpectedThrownValue(value: any): void;
export declare function isLogBoxErrorMessage(message: string): boolean;
export declare function isMessageIgnored(message: string): boolean;
/** Exposed for debugging */
export declare function _appendNewLog(newLog: LogBoxLog): void;
export declare function addLog(log: LogData): void;
export declare function addException(error: ExtendedExceptionData): void;
export declare function symbolicateLogNow(type: StackType, log: LogBoxLog): void;
export declare function retrySymbolicateLogNow(type: StackType, log: LogBoxLog): void;
export declare function symbolicateLogLazy(type: StackType, log: LogBoxLog): void;
export declare function clear(): void;
export declare function setSelectedLog(proposedNewIndex: number): void;
export declare function clearErrors(): void;
export declare function dismiss(log: LogBoxLog): void;
export declare function getIgnorePatterns(): IgnorePattern[];
export declare function addIgnorePatterns(patterns: IgnorePattern[]): void;
export declare function setDisabled(value: boolean): void;
export declare function isDisabled(): boolean;
export declare function observe(observer: Observer): Subscription;
export declare function withSubscription(WrappedComponent: React.FC<object>): {
    new (props: any): {
        componentDidCatch(err: Error & {
            componentStack?: string;
        }, errorInfo: {
            componentStack: string;
        } & any): void;
        _subscription?: Subscription;
        state: {
            logs: Set<LogBoxLog>;
            isDisabled: boolean;
            hasError: boolean;
            selectedLogIndex: number;
        };
        retry: () => Promise<void>;
        render(): React.JSX.Element;
        componentDidMount(): void;
        componentWillUnmount(): void;
        context: unknown;
        setState<K extends keyof State>(state: State | ((prevState: Readonly<State>, props: Readonly<React.PropsWithChildren<object>>) => State | Pick<State, K> | null) | Pick<State, K> | null, callback?: (() => void) | undefined): void;
        forceUpdate(callback?: (() => void) | undefined): void;
        readonly props: Readonly<React.PropsWithChildren<object>>;
        shouldComponentUpdate?(nextProps: Readonly<React.PropsWithChildren<object>>, nextState: Readonly<State>): boolean;
        getSnapshotBeforeUpdate?(prevProps: Readonly<React.PropsWithChildren<object>>, prevState: Readonly<State>): any;
        componentDidUpdate?(prevProps: Readonly<React.PropsWithChildren<object>>, prevState: Readonly<State>, snapshot?: any): void;
        componentWillMount?(): void;
        UNSAFE_componentWillMount?(): void;
        componentWillReceiveProps?(nextProps: Readonly<React.PropsWithChildren<object>>): void;
        UNSAFE_componentWillReceiveProps?(nextProps: Readonly<React.PropsWithChildren<object>>): void;
        componentWillUpdate?(nextProps: Readonly<React.PropsWithChildren<object>>, nextState: Readonly<State>): void;
        UNSAFE_componentWillUpdate?(nextProps: Readonly<React.PropsWithChildren<object>>, nextState: Readonly<State>): void;
    };
    getDerivedStateFromError(): {
        hasError: boolean;
    };
    contextType?: React.Context<any> | undefined;
    propTypes?: any;
};
export {};
//# sourceMappingURL=LogBoxData.d.ts.map