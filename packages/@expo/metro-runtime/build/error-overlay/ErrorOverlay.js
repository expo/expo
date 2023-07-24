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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorOverlayBodyContents = exports.ErrorOverlayBody = exports.LogBoxInspector = exports.LogBoxInspectorContainer = void 0;
/**
 * Copyright (c) Evan Bacon.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
const react_views_1 = require("@bacons/react-views");
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const LogBoxData = __importStar(require("./Data/LogBoxData"));
const LogContext_1 = require("./Data/LogContext");
const LogBoxStyle = __importStar(require("./UI/LogBoxStyle"));
const LogBoxInspectorCodeFrame_1 = require("./overlay/LogBoxInspectorCodeFrame");
const LogBoxInspectorFooter_1 = require("./overlay/LogBoxInspectorFooter");
const LogBoxInspectorHeader_1 = require("./overlay/LogBoxInspectorHeader");
const LogBoxInspectorMessageHeader_1 = require("./overlay/LogBoxInspectorMessageHeader");
const LogBoxInspectorStackFrames_1 = require("./overlay/LogBoxInspectorStackFrames");
const HEADER_TITLE_MAP = {
    warn: "Console Warning",
    error: "Console Error",
    fatal: "Uncaught Error",
    syntax: "Syntax Error",
    static: "Static Rendering Error (Node.js)",
    component: "Render Error",
};
function LogBoxInspectorContainer() {
    const { selectedLogIndex, logs } = (0, LogContext_1.useLogs)();
    const log = logs[selectedLogIndex];
    if (log == null) {
        return null;
    }
    return (react_1.default.createElement(LogBoxInspector, { log: log, selectedLogIndex: selectedLogIndex, logs: logs }));
}
exports.LogBoxInspectorContainer = LogBoxInspectorContainer;
function LogBoxInspector({ log, selectedLogIndex, logs, }) {
    const onDismiss = (0, react_1.useCallback)(() => {
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
    const onMinimize = (0, react_1.useCallback)(() => {
        LogBoxData.setSelectedLog(-1);
    }, []);
    const onChangeSelectedIndex = (0, react_1.useCallback)((index) => {
        LogBoxData.setSelectedLog(index);
    }, []);
    (0, react_1.useEffect)(() => {
        if (log) {
            LogBoxData.symbolicateLogNow("stack", log);
            LogBoxData.symbolicateLogNow("component", log);
        }
    }, [log]);
    (0, react_1.useEffect)(() => {
        // Optimistically symbolicate the last and next logs.
        if (logs.length > 1) {
            const selected = selectedLogIndex;
            const lastIndex = logs.length - 1;
            const prevIndex = selected - 1 < 0 ? lastIndex : selected - 1;
            const nextIndex = selected + 1 > lastIndex ? 0 : selected + 1;
            for (const type of ["component", "stack"]) {
                LogBoxData.symbolicateLogLazy(type, logs[prevIndex]);
                LogBoxData.symbolicateLogLazy(type, logs[nextIndex]);
            }
        }
    }, [logs, selectedLogIndex]);
    (0, react_1.useEffect)(() => {
        react_native_1.Keyboard.dismiss();
    }, []);
    const _handleRetry = (0, react_1.useCallback)((type) => {
        LogBoxData.retrySymbolicateLogNow(type, log);
    }, [log]);
    return (react_1.default.createElement(react_native_1.View, { style: styles.container },
        react_1.default.createElement(LogBoxInspectorHeader_1.LogBoxInspectorHeader, { onSelectIndex: onChangeSelectedIndex, level: log.level }),
        react_1.default.createElement(ErrorOverlayBody, { onRetry: _handleRetry }),
        react_1.default.createElement(LogBoxInspectorFooter_1.LogBoxInspectorFooter, { onDismiss: onDismiss, onMinimize: onMinimize })));
}
exports.LogBoxInspector = LogBoxInspector;
function ErrorOverlayBody({ onRetry, }) {
    const log = (0, LogContext_1.useSelectedLog)();
    return react_1.default.createElement(ErrorOverlayBodyContents, { log: log, onRetry: onRetry });
}
exports.ErrorOverlayBody = ErrorOverlayBody;
function ErrorOverlayBodyContents({ log, onRetry, }) {
    var _a, _b;
    const [collapsed, setCollapsed] = (0, react_1.useState)(true);
    (0, react_1.useEffect)(() => {
        setCollapsed(true);
    }, [log]);
    const headerTitle = (_a = HEADER_TITLE_MAP[log.isComponentError ? "component" : log.level]) !== null && _a !== void 0 ? _a : log.type;
    const header = (react_1.default.createElement(LogBoxInspectorMessageHeader_1.LogBoxInspectorMessageHeader, { collapsed: collapsed, onPress: () => setCollapsed(!collapsed), message: log.message, level: log.level, title: headerTitle }));
    return (react_1.default.createElement(react_1.default.Fragment, null,
        collapsed && header,
        react_1.default.createElement(react_native_1.ScrollView, { style: styles.scrollBody },
            !collapsed && header,
            react_1.default.createElement(LogBoxInspectorCodeFrame_1.LogBoxInspectorCodeFrame, { codeFrame: log.codeFrame }),
            react_1.default.createElement(LogBoxInspectorStackFrames_1.LogBoxInspectorStackFrames, { type: "stack", 
                // eslint-disable-next-line react/jsx-no-bind
                onRetry: onRetry.bind(onRetry, "stack") }),
            !!((_b = log === null || log === void 0 ? void 0 : log.componentStack) === null || _b === void 0 ? void 0 : _b.length) && (react_1.default.createElement(LogBoxInspectorStackFrames_1.LogBoxInspectorStackFrames, { type: "component", 
                // eslint-disable-next-line react/jsx-no-bind
                onRetry: onRetry.bind(onRetry, "component") })))));
}
exports.ErrorOverlayBodyContents = ErrorOverlayBodyContents;
const styles = react_views_1.StyleSheet.create({
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
        position: "fixed",
    },
});
exports.default = LogBoxData.withSubscription(LogBoxInspectorContainer);
//# sourceMappingURL=ErrorOverlay.js.map