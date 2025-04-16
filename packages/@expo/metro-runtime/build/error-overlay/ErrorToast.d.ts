/**
 * Copyright (c) 650 Industries.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React from 'react';
import * as LogBoxData from './Data/LogBoxData';
import { LogBoxLog } from './Data/LogBoxLog';
import './ErrorOverlay.css';
export declare function ErrorToastContainer(): React.JSX.Element | null;
export declare function ErrorToast(props: {
    log: LogBoxLog;
    totalLogCount: number;
    level: 'warn' | 'error';
    onPressOpen: () => void;
    onPressDismiss: () => void;
}): React.JSX.Element;
declare const _default: {
    new (props: any): {
        componentDidCatch(err: Error & {
            componentStack?: string;
        }, errorInfo: {
            componentStack: string;
        } & any): void;
        _subscription?: LogBoxData.Subscription;
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
        setState<K extends keyof {
            logs: LogBoxData.LogBoxLogs;
            isDisabled: boolean;
            hasError: boolean;
            selectedLogIndex: number;
        }>(state: {
            logs: LogBoxData.LogBoxLogs;
            isDisabled: boolean;
            hasError: boolean;
            selectedLogIndex: number;
        } | ((prevState: Readonly<{
            logs: LogBoxData.LogBoxLogs;
            isDisabled: boolean;
            hasError: boolean;
            selectedLogIndex: number;
        }>, props: Readonly<React.PropsWithChildren<object>>) => {
            logs: LogBoxData.LogBoxLogs;
            isDisabled: boolean;
            hasError: boolean;
            selectedLogIndex: number;
        } | Pick<{
            logs: LogBoxData.LogBoxLogs;
            isDisabled: boolean;
            hasError: boolean;
            selectedLogIndex: number;
        }, K> | null) | Pick<{
            logs: LogBoxData.LogBoxLogs;
            isDisabled: boolean;
            hasError: boolean;
            selectedLogIndex: number;
        }, K> | null, callback?: (() => void) | undefined): void;
        forceUpdate(callback?: (() => void) | undefined): void;
        readonly props: Readonly<React.PropsWithChildren<object>>;
        shouldComponentUpdate?(nextProps: Readonly<React.PropsWithChildren<object>>, nextState: Readonly<{
            logs: LogBoxData.LogBoxLogs;
            isDisabled: boolean;
            hasError: boolean;
            selectedLogIndex: number;
        }>): boolean;
        getSnapshotBeforeUpdate?(prevProps: Readonly<React.PropsWithChildren<object>>, prevState: Readonly<{
            logs: LogBoxData.LogBoxLogs;
            isDisabled: boolean;
            hasError: boolean;
            selectedLogIndex: number;
        }>): any;
        componentDidUpdate?(prevProps: Readonly<React.PropsWithChildren<object>>, prevState: Readonly<{
            logs: LogBoxData.LogBoxLogs;
            isDisabled: boolean;
            hasError: boolean;
            selectedLogIndex: number;
        }>, snapshot?: any): void;
        componentWillMount?(): void;
        UNSAFE_componentWillMount?(): void;
        componentWillReceiveProps?(nextProps: Readonly<React.PropsWithChildren<object>>): void;
        UNSAFE_componentWillReceiveProps?(nextProps: Readonly<React.PropsWithChildren<object>>): void;
        componentWillUpdate?(nextProps: Readonly<React.PropsWithChildren<object>>, nextState: Readonly<{
            logs: LogBoxData.LogBoxLogs;
            isDisabled: boolean;
            hasError: boolean;
            selectedLogIndex: number;
        }>): void;
        UNSAFE_componentWillUpdate?(nextProps: Readonly<React.PropsWithChildren<object>>, nextState: Readonly<{
            logs: LogBoxData.LogBoxLogs;
            isDisabled: boolean;
            hasError: boolean;
            selectedLogIndex: number;
        }>): void;
    };
    getDerivedStateFromError(): {
        hasError: boolean;
    };
    contextType?: React.Context<any> | undefined;
    propTypes?: any;
};
export default _default;
//# sourceMappingURL=ErrorToast.d.ts.map