import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Copyright (c) 650 Industries.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React, { useEffect, useCallback, useMemo } from 'react';
import styles from './ErrorToast.module.css';
import * as LogBoxData from '../Data/LogBoxData';
import { useLogs } from '../Data/LogBoxLog';
import { LogBoxMessage } from '../overlay/Message';
import { parseUnexpectedThrownValue } from '../utils/parseUnexpectedThrownValue';
import '../overlay/Overlay.module.css';
export function ErrorToastContainer() {
    useRejectionHandler();
    const { logs, isDisabled } = useLogs();
    if (!logs.length || isDisabled) {
        return null;
    }
    return _jsx(ErrorToastStack, { logs: logs });
}
function ErrorToastStack({ logs }) {
    const onDismissErrors = useCallback(() => {
        LogBoxData.clearErrors();
    }, []);
    const setSelectedLog = useCallback((index) => {
        LogBoxData.setSelectedLog(index);
    }, []);
    function openLog(log) {
        let index = logs.length - 1;
        while (index > 0 && logs[index] !== log) {
            index -= 1;
        }
        setSelectedLog(index);
    }
    const errors = useMemo(() => logs.filter((log) => log.level === 'error' || log.level === 'fatal'), [logs]);
    const lastError = errors[errors.length - 1];
    return (_jsx("div", { className: styles.container, children: lastError != null && (_jsx(ErrorToast, { log: lastError, level: "error", totalLogCount: errors.length, onPressOpen: () => openLog(lastError), onPressDismiss: onDismissErrors })) }));
}
function useSymbolicatedLog(log) {
    // Eagerly symbolicate so the stack is available when pressing to inspect.
    useEffect(() => {
        LogBoxData.symbolicateLogLazy('stack', log);
        LogBoxData.symbolicateLogLazy('component', log);
    }, [log]);
}
function ErrorToast(props) {
    const { totalLogCount, log } = props;
    useSymbolicatedLog(log);
    return (_jsxs("div", { className: styles.toast, onClick: props.onPressOpen, role: "button", tabIndex: 0, children: [_jsx(Count, { count: totalLogCount }), _jsx("span", { className: styles.message, children: log.message && _jsx(LogBoxMessage, { maxLength: 40, message: log.message }) }), _jsx(Dismiss, { onPress: props.onPressDismiss })] }));
}
function Count({ count }) {
    return (_jsx("div", { className: styles.count, children: _jsx("span", { className: styles.countText, children: count <= 1 ? '!' : count }) }));
}
function Dismiss({ onPress }) {
    return (_jsx("button", { className: styles.dismissButton, onClick: (e) => {
            e.stopPropagation();
            onPress();
        }, children: _jsx("div", { className: styles.dismissContent, children: _jsx("svg", { className: styles.dismissIcon, fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M17 7L7 17M7 7L17 17" }) }) }) }));
}
function useStackTraceLimit(limit) {
    const current = React.useRef(0);
    React.useEffect(() => {
        try {
            // @ts-ignore: StackTraceLimit is not defined in the Error type
            const currentLimit = Error.stackTraceLimit;
            // @ts-ignore: StackTraceLimit is not defined in the Error type
            Error.stackTraceLimit = limit;
            current.current = currentLimit;
        }
        catch { }
        return () => {
            try {
                // @ts-ignore: StackTraceLimit is not defined in the Error type
                Error.stackTraceLimit = current.current;
            }
            catch { }
        };
    }, [limit]);
}
function useRejectionHandler() {
    const hasError = React.useRef(false);
    useStackTraceLimit(35);
    React.useEffect(() => {
        function onUnhandledError(ev) {
            hasError.current = true;
            const error = ev?.error;
            if (!error || !(error instanceof Error) || typeof error.stack !== 'string') {
                // TODO: Handle non-Error objects?
                return;
            }
            error.componentStack = React.captureOwnerStack();
            LogBoxData.addException(parseUnexpectedThrownValue(error));
        }
        function onUnhandledRejection(ev) {
            hasError.current = true;
            const reason = ev?.reason;
            if (!reason || !(reason instanceof Error) || typeof reason.stack !== 'string') {
                // TODO: Handle non-Error objects?
                return;
            }
            LogBoxData.addException(parseUnexpectedThrownValue(reason));
        }
        window.addEventListener('unhandledrejection', onUnhandledRejection);
        window.addEventListener('error', onUnhandledError);
        return () => {
            window.removeEventListener('error', onUnhandledError);
            window.removeEventListener('unhandledrejection', onUnhandledRejection);
        };
    }, []);
    return hasError;
}
export default LogBoxData.withSubscription(ErrorToastContainer);
//# sourceMappingURL=ErrorToast.js.map