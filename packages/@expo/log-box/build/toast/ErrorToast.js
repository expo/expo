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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorToastContainer = ErrorToastContainer;
/**
 * Copyright (c) 650 Industries.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const ContextActions_1 = require("../ContextActions");
const ContextPlatform_1 = require("../ContextPlatform");
const LogBoxData = __importStar(require("../Data/LogBoxData"));
const LogBoxLog_1 = require("../Data/LogBoxLog");
const Message_1 = require("../overlay/Message");
require("../Global.css");
function ErrorToastContainer() {
    useRejectionHandler();
    const { logs, isDisabled } = (0, LogBoxLog_1.useLogs)();
    if (!logs.length || isDisabled) {
        return null;
    }
    return react_1.default.createElement(ErrorToastStack, { logs: logs });
}
function ErrorToastStack({ logs }) {
    const onDismissErrors = (0, react_1.useCallback)(() => {
        LogBoxData.clearErrors();
    }, []);
    const setSelectedLog = (0, react_1.useCallback)((index) => {
        LogBoxData.setSelectedLog(index);
    }, []);
    function openLog(log) {
        let index = logs.length - 1;
        while (index > 0 && logs[index] !== log) {
            index -= 1;
        }
        setSelectedLog(index);
    }
    const errors = (0, react_1.useMemo)(() => logs.filter((log) => log.level === 'error' || log.level === 'fatal'), [logs]);
    return (react_1.default.createElement("div", { style: {
            bottom: 'calc(6px + env(safe-area-inset-bottom, 0px))',
            left: 10,
            right: 10,
            maxWidth: 320,
            position: 'fixed',
            display: 'flex',
        } }, errors.length > 0 && (react_1.default.createElement(ErrorToast, { log: errors[errors.length - 1], level: "error", totalLogCount: errors.length, onPressOpen: () => openLog(errors[errors.length - 1]), onPressDismiss: onDismissErrors }))));
}
function useSymbolicatedLog(log) {
    // Eagerly symbolicate so the stack is available when pressing to inspect.
    (0, react_1.useEffect)(() => {
        LogBoxData.symbolicateLogLazy('stack', log);
        LogBoxData.symbolicateLogLazy('component', log);
    }, [log]);
}
function ErrorToast(props) {
    const { totalLogCount, log } = props;
    useSymbolicatedLog(log);
    return (react_1.default.createElement(react_1.default.Fragment, null,
        react_1.default.createElement("style", null, `
[data-expo-log-toast] {
  background-color: #632e2c;
  height: 48px;
  justify-content: center;
  margin-bottom: 4px;
  display: flex;
  border-radius: 6px;
  transition: background-color 0.2s;
  border: 1px solid var(--expo-log-color-danger);
  /* border: 1px solid var(--expo-log-color-border); */
  cursor: pointer;
  overflow: hidden;
  flex: 1;
  padding: 0 10px;
  flex-direction: row;
  align-items: center;
  gap: 8px;
}

[data-expo-log-toast]:hover {
  background-color: #924340;
}
`),
        react_1.default.createElement("button", { "data-expo-log-toast": true, onClick: props.onPressOpen },
            react_1.default.createElement(Count, { count: totalLogCount }),
            react_1.default.createElement(react_native_1.Text, { numberOfLines: 1, style: {
                    userSelect: 'none',
                    paddingLeft: 8,
                    color: 'var(--expo-log-color-label)',
                    flex: 1,
                    fontSize: 14,
                    lineHeight: 22,
                } }, log.message && react_1.default.createElement(Message_1.LogBoxMessage, { maxLength: 40, message: log.message })),
            react_1.default.createElement(Dismiss, { onPress: props.onPressDismiss }))));
}
function Count({ count }) {
    return (react_1.default.createElement("div", { style: {
            minWidth: 30,
            height: 30,
            borderRadius: 6,
            justifyContent: 'center',
            alignItems: 'center',
            display: 'flex',
            background: 'var(--expo-log-color-danger)',
        } },
        react_1.default.createElement(react_native_1.Text, { style: {
                color: 'var(--expo-log-color-label)',
                fontSize: 14,
                lineHeight: 18,
                textAlign: 'center',
                fontWeight: '600',
                // @ts-ignore
                textShadow: `0px 0px 3px rgba(51, 51, 51, 0.8)`,
            } }, count <= 1 ? '!' : count)));
}
function Dismiss({ onPress }) {
    return (react_1.default.createElement(react_native_1.Pressable, { style: {
            marginLeft: 5,
        }, hitSlop: {
            top: 12,
            right: 10,
            bottom: 12,
            left: 10,
        }, onPress: onPress }, ({ 
    /** @ts-expect-error: react-native types are broken. */
    hovered, pressed, }) => (react_1.default.createElement(react_native_1.View, { style: [
            {
                backgroundColor: 'rgba(255,255,255,0.1)',
                height: 20,
                width: 20,
                borderRadius: 25,
                alignItems: 'center',
                justifyContent: 'center',
            },
            hovered && { opacity: 0.8 },
            pressed && { opacity: 0.5 },
        ] },
        react_1.default.createElement("svg", { fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", style: {
                width: 12,
                height: 12,
                color: 'white',
                // color: 'var(--expo-log-color-danger)',
            } },
            react_1.default.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M17 7L7 17M7 7L17 17" }))))));
}
function useStackTraceLimit(limit) {
    const current = react_1.default.useRef(0);
    react_1.default.useEffect(() => {
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
    const hasError = react_1.default.useRef(false);
    useStackTraceLimit(35);
    react_1.default.useEffect(() => {
        function onUnhandledError(ev) {
            hasError.current = true;
            const error = ev?.error;
            if (!error || !(error instanceof Error) || typeof error.stack !== 'string') {
                return;
            }
            LogBoxData.addException(error);
        }
        function onUnhandledRejection(ev) {
            hasError.current = true;
            const reason = ev?.reason;
            if (!reason || !(reason instanceof Error) || typeof reason.stack !== 'string') {
                return;
            }
            LogBoxData.addException(reason);
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
exports.default = LogBoxData.withSubscription((0, ContextPlatform_1.withRuntimePlatform)((0, ContextActions_1.withActions)(ErrorToastContainer, {
    onMinimize: () => {
        LogBoxData.setSelectedLog(-1);
        LogBoxData.setSelectedLog(-1);
    },
}), { platform: process.env.EXPO_OS ?? 'web' }));
