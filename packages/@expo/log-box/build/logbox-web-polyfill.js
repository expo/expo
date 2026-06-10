import { jsx as _jsx } from "react/jsx-runtime";
import { LogBoxLog } from './Data/LogBoxLog';
import LogBoxInspectorContainer from './logbox-dom-polyfill';
export default () => {
    const { logs, selectedLogIndex } = useLogsFromExpoStaticError();
    return (_jsx(LogBoxInspectorContainer, { logs: logs, selectedIndex: selectedLogIndex, 
        // LogBoxData actions props
        onDismiss: undefined, onChangeSelectedIndex: undefined, 
        // Environment polyfill props
        devServerUrl: undefined, 
        // Common actions props
        fetchTextAsync: undefined, 
        // LogBox UI actions props
        onMinimize: undefined, onReload: () => window.location.reload(), onCopyText: (text) => navigator.clipboard.writeText(text) }));
};
function useLogsFromExpoStaticError() {
    if (process.env.EXPO_OS === 'web' && typeof window !== 'undefined') {
        // Logbox data that is pre-fetched on the dev server and rendered here.
        const expoCliStaticErrorElement = document.getElementById('_expo-static-error');
        if (expoCliStaticErrorElement?.textContent) {
            const raw = JSON.parse(expoCliStaticErrorElement.textContent);
            return {
                ...raw,
                logs: raw.logs.map((raw) => new LogBoxLog(raw)),
            };
        }
    }
    throw new Error('`useLogsFromExpoStaticError` must be used within a document with `_expo-static-error` element.');
}
//# sourceMappingURL=logbox-web-polyfill.js.map