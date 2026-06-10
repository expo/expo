'use dom';
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = LogBoxPolyfillDOM;
const react_1 = __importDefault(require("react"));
const ContextActions_1 = require("./ContextActions");
const LogBoxData = __importStar(require("./Data/LogBoxData"));
const LogBoxLog_1 = require("./Data/LogBoxLog");
const environmentHelper_1 = require("./environmentHelper");
const fetchHelper_1 = require("./fetchHelper");
const Overlay_1 = require("./overlay/Overlay");
const convertLogBoxLog_1 = require("./utils/convertLogBoxLog");
function LogBoxPolyfillDOM({ 
// Default is mainly used in RedBox replacement,
// where we won't to keep the native webview wrapper interface as minimal as possible.
onCopyText = (text) => navigator.clipboard.writeText(text), onMinimize, fetchTextAsync, onReload, ...props }) {
    (0, environmentHelper_1.useEnvironmentVariablesPolyfill)(props);
    const logs = react_1.default.useMemo(() => {
        return [
            // Convert from React Native style to Expo style LogBoxLog
            ...(props.logs ?? []).map(convertLogBoxLog_1.convertToExpoLogBoxLog),
            // Convert native logs to Expo Log Box format
            ...(props.nativeLogs ?? []).map(convertLogBoxLog_1.convertNativeToExpoLogBoxLog),
        ];
    }, [props.logs, props.nativeLogs]);
    const selectedIndex = props.selectedIndex ?? (logs && logs?.length - 1) ?? -1;
    if (fetchTextAsync)
        (0, fetchHelper_1.setFetchText)(fetchTextAsync);
    useViewportMeta('width=device-width, initial-scale=1, viewport-fit=cover');
    useNativeLogBoxDataPolyfill({ logs }, props);
    return (react_1.default.createElement(LogBoxLog_1.LogContext, { value: {
            selectedLogIndex: selectedIndex,
            isDisabled: false,
            logs,
        } },
        react_1.default.createElement(ContextActions_1.ActionsContext, { onMinimize: onMinimize, onReload: onReload, onCopyText: onCopyText },
            react_1.default.createElement(Overlay_1.LogBoxInspectorContainer, null))));
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
    react_1.default.useEffect(() => {
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