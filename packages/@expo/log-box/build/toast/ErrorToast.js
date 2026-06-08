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
exports.ErrorToastContainer = ErrorToastContainer;
/**
 * Copyright (c) 650 Industries.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
const react_1 = __importStar(require("react"));
const ErrorToast_module_css_1 = __importDefault(require("./ErrorToast.module.css"));
const LogBoxData = __importStar(require("../Data/LogBoxData"));
const LogBoxLog_1 = require("../Data/LogBoxLog");
const Message_1 = require("../overlay/Message");
const parseUnexpectedThrownValue_1 = require("../utils/parseUnexpectedThrownValue");
require("../overlay/Overlay.module.css");
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
    const lastError = errors[errors.length - 1];
    return (react_1.default.createElement("div", { className: ErrorToast_module_css_1.default.container }, lastError != null && (react_1.default.createElement(ErrorToast, { log: lastError, level: "error", totalLogCount: errors.length, onPressOpen: () => openLog(lastError), onPressDismiss: onDismissErrors }))));
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
    return (react_1.default.createElement("div", { className: ErrorToast_module_css_1.default.toast, onClick: props.onPressOpen, role: "button", tabIndex: 0 },
        react_1.default.createElement(Count, { count: totalLogCount }),
        react_1.default.createElement("span", { className: ErrorToast_module_css_1.default.message }, log.message && react_1.default.createElement(Message_1.LogBoxMessage, { maxLength: 40, message: log.message })),
        react_1.default.createElement(Dismiss, { onPress: props.onPressDismiss })));
}
function Count({ count }) {
    return (react_1.default.createElement("div", { className: ErrorToast_module_css_1.default.count },
        react_1.default.createElement("span", { className: ErrorToast_module_css_1.default.countText }, count <= 1 ? '!' : count)));
}
function Dismiss({ onPress }) {
    return (react_1.default.createElement("button", { className: ErrorToast_module_css_1.default.dismissButton, onClick: (e) => {
            e.stopPropagation();
            onPress();
        } },
        react_1.default.createElement("div", { className: ErrorToast_module_css_1.default.dismissContent },
            react_1.default.createElement("svg", { className: ErrorToast_module_css_1.default.dismissIcon, fill: "none", viewBox: "0 0 24 24", stroke: "currentColor" },
                react_1.default.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M17 7L7 17M7 7L17 17" })))));
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
                // TODO: Handle non-Error objects?
                return;
            }
            error.componentStack = react_1.default.captureOwnerStack();
            LogBoxData.addException((0, parseUnexpectedThrownValue_1.parseUnexpectedThrownValue)(error));
        }
        function onUnhandledRejection(ev) {
            hasError.current = true;
            const reason = ev?.reason;
            if (!reason || !(reason instanceof Error) || typeof reason.stack !== 'string') {
                // TODO: Handle non-Error objects?
                return;
            }
            LogBoxData.addException((0, parseUnexpectedThrownValue_1.parseUnexpectedThrownValue)(reason));
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
exports.default = LogBoxData.withSubscription(ErrorToastContainer);
//# sourceMappingURL=ErrorToast.js.map