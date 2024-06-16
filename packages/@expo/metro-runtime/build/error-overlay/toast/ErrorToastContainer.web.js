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
exports.ErrorToastContainer = void 0;
/**
 * Copyright (c) 650 Industries.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const ErrorToast_1 = require("./ErrorToast");
const LogBoxData = __importStar(require("../Data/LogBoxData"));
const LogContext_1 = require("../Data/LogContext");
const useRejectionHandler_1 = require("../useRejectionHandler");
function ErrorToastContainer() {
    (0, useRejectionHandler_1.useRejectionHandler)();
    const { logs, isDisabled } = (0, LogContext_1.useLogs)();
    if (!logs.length || isDisabled) {
        return null;
    }
    return react_1.default.createElement(ErrorToastStack, { logs: logs });
}
exports.ErrorToastContainer = ErrorToastContainer;
function ErrorToastStack({ logs }) {
    const onDismissWarns = (0, react_1.useCallback)(() => {
        LogBoxData.clearWarnings();
    }, []);
    const onDismissErrors = (0, react_1.useCallback)(() => {
        LogBoxData.clearErrors();
    }, []);
    const setSelectedLog = (0, react_1.useCallback)((index) => {
        LogBoxData.setSelectedLog(index);
    }, []);
    function openLog(log) {
        let index = logs.length - 1;
        // Stop at zero because if we don't find any log, we'll open the first log.
        while (index > 0 && logs[index] !== log) {
            index -= 1;
        }
        setSelectedLog(index);
    }
    const warnings = (0, react_1.useMemo)(() => logs.filter((log) => log.level === 'warn'), [logs]);
    const errors = (0, react_1.useMemo)(() => logs.filter((log) => log.level === 'error' || log.level === 'fatal'), [logs]);
    return (react_1.default.createElement(react_native_1.View, { style: styles.list },
        warnings.length > 0 && (react_1.default.createElement(ErrorToast_1.ErrorToast, { log: warnings[warnings.length - 1], level: "warn", totalLogCount: warnings.length, onPressOpen: () => openLog(warnings[warnings.length - 1]), onPressDismiss: onDismissWarns })),
        errors.length > 0 && (react_1.default.createElement(ErrorToast_1.ErrorToast, { log: errors[errors.length - 1], level: "error", totalLogCount: errors.length, onPressOpen: () => openLog(errors[errors.length - 1]), onPressDismiss: onDismissErrors }))));
}
const styles = react_native_1.StyleSheet.create({
    list: {
        bottom: 6,
        left: 10,
        right: 10,
        maxWidth: 320,
        // @ts-expect-error
        position: 'fixed',
    },
});
exports.default = LogBoxData.withSubscription(ErrorToastContainer);
//# sourceMappingURL=ErrorToastContainer.web.js.map