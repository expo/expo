/**
 * Copyright (c) 650 Industries.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { Keyboard, ScrollView, View, StyleSheet } from 'react-native';
import * as LogBoxData from './Data/LogBoxData';
import { useLogs, useSelectedLog } from './Data/LogContext';
import * as LogBoxStyle from './UI/LogBoxStyle';
import { LogBoxInspectorCodeFrame } from './overlay/LogBoxInspectorCodeFrame';
import { LogBoxInspectorFooter as ErrorOverlayFooter } from './overlay/LogBoxInspectorFooter';
import { LogBoxInspectorHeader as ErrorOverlayHeader } from './overlay/LogBoxInspectorHeader';
import { LogBoxInspectorMessageHeader } from './overlay/LogBoxInspectorMessageHeader';
import { LogBoxInspectorStackFrames } from './overlay/LogBoxInspectorStackFrames';
const HEADER_TITLE_MAP = {
    warn: 'Console Warning',
    error: 'Console Error',
    fatal: 'Uncaught Error',
    syntax: 'Syntax Error',
    static: 'Static Rendering Error (Node.js)',
    component: 'Render Error',
};
export function LogBoxInspectorContainer() {
    const { selectedLogIndex, logs } = useLogs();
    const log = logs[selectedLogIndex];
    if (log == null) {
        return null;
    }
    return React.createElement(LogBoxInspector, { log: log, selectedLogIndex: selectedLogIndex, logs: logs });
}
export function LogBoxInspector({ log, selectedLogIndex, logs, }) {
    const onDismiss = useCallback(() => {
        // Here we handle the cases when the log is dismissed and it
        // was either the last log, or when the current index
        // is now outside the bounds of the log array.
        const logsArray = Array.from(logs);
        if (selectedLogIndex != null) {
            if (logsArray.length - 1 <= 0) {
                LogBoxData.setSelectedLog(-1);
            }
            else if (selectedLogIndex >= logsArray.length - 1) {
                LogBoxData.setSelectedLog(selectedLogIndex - 1);
            }
            LogBoxData.dismiss(logsArray[selectedLogIndex]);
        }
    }, [selectedLogIndex]);
    const onMinimize = useCallback(() => {
        LogBoxData.setSelectedLog(-1);
    }, []);
    const onChangeSelectedIndex = useCallback((index) => {
        LogBoxData.setSelectedLog(index);
    }, []);
    useEffect(() => {
        if (log) {
            LogBoxData.symbolicateLogNow('stack', log);
            LogBoxData.symbolicateLogNow('component', log);
        }
    }, [log]);
    useEffect(() => {
        // Optimistically symbolicate the last and next logs.
        if (logs.length > 1) {
            const selected = selectedLogIndex;
            const lastIndex = logs.length - 1;
            const prevIndex = selected - 1 < 0 ? lastIndex : selected - 1;
            const nextIndex = selected + 1 > lastIndex ? 0 : selected + 1;
            for (const type of ['component', 'stack']) {
                LogBoxData.symbolicateLogLazy(type, logs[prevIndex]);
                LogBoxData.symbolicateLogLazy(type, logs[nextIndex]);
            }
        }
    }, [logs, selectedLogIndex]);
    useEffect(() => {
        Keyboard.dismiss();
    }, []);
    const _handleRetry = useCallback((type) => {
        LogBoxData.retrySymbolicateLogNow(type, log);
    }, [log]);
    return (React.createElement(View, { style: styles.container },
        React.createElement(ErrorOverlayHeader, { onSelectIndex: onChangeSelectedIndex, level: log.level }),
        React.createElement(ErrorOverlayBody, { onRetry: _handleRetry }),
        React.createElement(ErrorOverlayFooter, { onDismiss: onDismiss, onMinimize: onMinimize })));
}
export function ErrorOverlayBody({ onRetry }) {
    const log = useSelectedLog();
    return React.createElement(ErrorOverlayBodyContents, { log: log, onRetry: onRetry });
}
export function ErrorOverlayBodyContents({ log, onRetry, }) {
    const [collapsed, setCollapsed] = useState(true);
    useEffect(() => {
        setCollapsed(true);
    }, [log]);
    const headerTitle = HEADER_TITLE_MAP[log.isComponentError ? 'component' : log.level] ?? log.type;
    const header = (React.createElement(LogBoxInspectorMessageHeader, { collapsed: collapsed, onPress: () => setCollapsed(!collapsed), message: log.message, level: log.level, title: headerTitle }));
    return (React.createElement(React.Fragment, null,
        collapsed && header,
        React.createElement(ScrollView, { style: styles.scrollBody },
            !collapsed && header,
            React.createElement(LogBoxInspectorCodeFrame, { codeFrame: log.codeFrame }),
            React.createElement(LogBoxInspectorStackFrames, { type: "stack", 
                // eslint-disable-next-line react/jsx-no-bind
                onRetry: onRetry.bind(onRetry, 'stack') }),
            !!log?.componentStack?.length && (React.createElement(LogBoxInspectorStackFrames, { type: "component", 
                // eslint-disable-next-line react/jsx-no-bind
                onRetry: onRetry.bind(onRetry, 'component') })))));
}
const styles = StyleSheet.create({
    scrollBody: {
        backgroundColor: LogBoxStyle.getBackgroundColor(1),
        flex: 1,
    },
    container: {
        top: 0,
        left: 0,
        bottom: 0,
        right: 0,
        zIndex: 999,
        flex: 1,
        // @ts-expect-error: fixed is not in the RN types but it works on web
        position: 'fixed',
    },
});
export default LogBoxData.withSubscription(LogBoxInspectorContainer);
//# sourceMappingURL=ErrorOverlay.js.map