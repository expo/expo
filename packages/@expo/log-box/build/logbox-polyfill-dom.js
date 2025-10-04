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
const ErrorOverlay_1 = require("./ErrorOverlay");
const LogBoxLog_1 = require("./Data/LogBoxLog");
const LogBoxData = __importStar(require("./Data/LogBoxData"));
const react_1 = __importDefault(require("react"));
const parseLogBoxLog_1 = require("./Data/parseLogBoxLog");
const ContextPlatform_1 = require("./ContextPlatform");
const ContextActions_1 = require("./ContextActions");
function LogBoxPolyfillDOM({ onMinimize, onCopyText, platform, fetchJsonAsync, reloadRuntime, devServerUrl, ...props }) {
    const logs = react_1.default.useMemo(() => {
        // Convert from React Native style to Expo style LogBoxLog
        return [
            ...(props.logs?.map(({ symbolicated, symbolicatedComponentStack, codeFrame, componentCodeFrame, ...log }) => {
                const outputCodeFrame = {};
                if (codeFrame) {
                    outputCodeFrame.stack = codeFrame;
                }
                if (componentCodeFrame) {
                    outputCodeFrame.component = componentCodeFrame;
                }
                const outputSymbolicated = {
                    stack: {
                        error: null,
                        stack: null,
                        status: 'NONE',
                    },
                    component: {
                        error: null,
                        stack: null,
                        status: 'NONE',
                    },
                };
                if (symbolicated) {
                    outputSymbolicated.stack = symbolicated;
                }
                if (symbolicatedComponentStack) {
                    outputSymbolicated.component = {
                        error: symbolicatedComponentStack.error,
                        // @ts-ignore
                        stack: symbolicatedComponentStack.componentStack?.map((frame) => ({
                            // From the upstream style (incorrect)
                            // {
                            //   "fileName": "/Users/evanbacon/Documents/GitHub/expo/node_modules/react-native/Libraries/Components/View/View.js",
                            //   "location": { "row": 32, "column": 33 },
                            //   "content": "React.forwardRef$argument_0",
                            //   "collapse": false
                            // },
                            // To the stack frame style (correct)
                            column: frame.location?.column,
                            file: frame.fileName,
                            lineNumber: frame.location?.row,
                            methodName: frame.content,
                            collapse: frame.collapse,
                        })),
                        status: symbolicatedComponentStack.status,
                    };
                }
                return new LogBoxLog_1.LogBoxLog({
                    ...log,
                    codeFrame: outputCodeFrame,
                    symbolicated: outputSymbolicated,
                });
            }) ?? []),
            // Convert native logs to Expo Log Box format
            ...((props.nativeLogs?.map((message) => {
                let originalMessage = message;
                if (platform === 'android') {
                    try {
                        const bodyIndex = originalMessage.indexOf("Body:");
                        if (bodyIndex !== -1) {
                            const originalJson = originalMessage.slice(bodyIndex + 5);
                            if (originalJson) {
                                const originalErrorResponseBody = JSON.parse(originalJson);
                                originalMessage = originalErrorResponseBody.message;
                            }
                        }
                    }
                    catch (e) {
                        // Ignore JSON parse errors
                    }
                }
                const log = new LogBoxLog_1.LogBoxLog((0, parseLogBoxLog_1.parseLogBoxException)({
                    originalMessage,
                    stack: [],
                }));
                // Never show stack for native errors, these are typically bundling errors, component stack would lead to LogBox.
                log.componentStack = [];
                return log;
            }) ?? [])),
        ];
    }, [props.logs, props.nativeLogs, platform]);
    const selectedIndex = props.selectedIndex ?? (logs && logs?.length - 1) ?? -1;
    if (devServerUrl) {
        globalThis.process = globalThis.process || {};
        globalThis.process.env = {
            ...globalThis.process.env,
            EXPO_DEV_SERVER_ORIGIN: devServerUrl,
        };
    }
    // @ts-ignore
    globalThis.__polyfill_onCopyText = onCopyText;
    // @ts-ignore
    globalThis.__polyfill_platform = platform;
    if (fetchJsonAsync) {
        // @ts-ignore
        globalThis.__polyfill_dom_fetchJsonAsync = async (url, options) => {
            const response = await fetchJsonAsync(url, options);
            return JSON.parse(response);
        };
        // @ts-ignore
        globalThis.__polyfill_dom_fetchAsync = async (url, options) => {
            return await fetchJsonAsync(url, options);
        };
    }
    // @ts-ignore
    globalThis.__polyfill_dom_reloadRuntime = reloadRuntime;
    useViewportMeta('width=device-width, initial-scale=1, viewport-fit=cover');
    useNativeLogBoxDataPolyfill({ logs }, props);
    return (react_1.default.createElement(LogBoxLog_1.LogContext.Provider, { value: {
            selectedLogIndex: selectedIndex,
            isDisabled: false,
            logs,
        } },
        react_1.default.createElement(ContextPlatform_1.RuntimePlatformProvider, { platform: platform },
            react_1.default.createElement(ContextActions_1.ActionsProvider, { onMinimize: onMinimize },
                react_1.default.createElement(ErrorOverlay_1.LogBoxInspectorContainer, null)))));
}
function useNativeLogBoxDataPolyfill({ logs, }, polyfill) {
    // @ts-ignore
    LogBoxData.setSelectedLog = polyfill.onChangeSelectedIndex;
    // @ts-ignore
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
        return () => {
            // Optionally reset or remove on cleanup
            // meta.setAttribute('content', 'width=device-width, initial-scale=1');
        };
    }, [content]);
}
