'use dom';
import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import { ActionsContext } from './ContextActions';
import * as LogBoxData from './Data/LogBoxData';
import { LogContext } from './Data/LogBoxLog';
import { useEnvironmentVariablesPolyfill } from './environmentHelper';
import { setFetchText } from './fetchHelper';
import { LogBoxInspectorContainer } from './overlay/Overlay';
import { convertNativeToExpoLogBoxLog, convertToExpoLogBoxLog } from './utils/convertLogBoxLog';
export default function LogBoxPolyfillDOM({ 
// Default is mainly used in RedBox replacement,
// where we won't to keep the native webview wrapper interface as minimal as possible.
onCopyText = (text) => navigator.clipboard.writeText(text), onMinimize, fetchTextAsync, onReload, ...props }) {
    useEnvironmentVariablesPolyfill(props);
    const logs = React.useMemo(() => {
        return [
            // Convert from React Native style to Expo style LogBoxLog
            ...(props.logs ?? []).map(convertToExpoLogBoxLog),
            // Convert native logs to Expo Log Box format
            ...(props.nativeLogs ?? []).map(convertNativeToExpoLogBoxLog),
        ];
    }, [props.logs, props.nativeLogs]);
    const selectedIndex = props.selectedIndex ?? (logs && logs?.length - 1) ?? -1;
    if (fetchTextAsync)
        setFetchText(fetchTextAsync);
    useViewportMeta('width=device-width, initial-scale=1, viewport-fit=cover');
    useNativeLogBoxDataPolyfill({ logs }, props);
    return (_jsx(LogContext, { value: {
            selectedLogIndex: selectedIndex,
            isDisabled: false,
            logs,
        }, children: _jsx(ActionsContext, { onMinimize: onMinimize, onReload: onReload, onCopyText: onCopyText, children: _jsx(LogBoxInspectorContainer, {}) }) }));
}
function useNativeLogBoxDataPolyfill({ logs, }, polyfill) {
    // @ts-ignore
    // eslint-disable-next-line import/namespace
    LogBoxData.setSelectedLog = polyfill.onChangeSelectedIndex;
    // @ts-ignore
    // eslint-disable-next-line import/namespace
    LogBoxData.dismiss = (log) => {
        const index = logs.indexOf(log);
        polyfill.onDismiss?.(index);
    };
}
function useViewportMeta(content) {
    React.useEffect(() => {
        let meta = document.querySelector('meta[name="viewport"]');
        if (!meta) {
            meta = document.createElement('meta');
            // @ts-ignore
            meta.name = 'viewport';
            document.head.appendChild(meta);
        }
        meta.setAttribute('content', content);
    }, [content]);
}
//# sourceMappingURL=logbox-dom-polyfill.js.map