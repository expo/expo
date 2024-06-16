/**
 * Copyright (c) 650 Industries.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use client';
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.withSubscription = exports.observe = exports.isDisabled = exports.setDisabled = exports.addIgnorePatterns = exports.getIgnorePatterns = exports.dismiss = exports.clearErrors = exports.clearWarnings = exports.setSelectedLog = exports.clear = exports.symbolicateLogLazy = exports.retrySymbolicateLogNow = exports.symbolicateLogNow = exports.addException = exports.addLog = exports.isMessageIgnored = exports.isLogBoxErrorMessage = exports.reportUnexpectedLogBoxError = exports.reportLogBoxError = void 0;
const React = __importStar(require("react"));
const LogBoxLog_1 = require("./LogBoxLog");
const LogContext_1 = require("./LogContext");
const parseLogBoxLog_1 = require("./parseLogBoxLog");
const NativeLogBox_1 = __importDefault(require("../modules/NativeLogBox"));
const parseErrorStack_1 = __importDefault(require("../modules/parseErrorStack"));
const observers = new Set();
const ignorePatterns = new Set();
let logs = new Set();
let updateTimeout = null;
let _isDisabled = false;
let _selectedIndex = -1;
const LOGBOX_ERROR_MESSAGE = 'An error was thrown when attempting to render log messages via LogBox.';
function getNextState() {
    return {
        logs,
        isDisabled: _isDisabled,
        selectedLogIndex: _selectedIndex,
    };
}
function reportLogBoxError(error, componentStack) {
    const ExceptionsManager = require('../modules/ExceptionsManager').default;
    if (componentStack != null) {
        error.componentStack = componentStack;
    }
    ExceptionsManager.handleException(error);
}
exports.reportLogBoxError = reportLogBoxError;
function reportUnexpectedLogBoxError(error, componentStack) {
    error.message = `${LOGBOX_ERROR_MESSAGE}\n\n${error.message}`;
    return reportLogBoxError(error, componentStack);
}
exports.reportUnexpectedLogBoxError = reportUnexpectedLogBoxError;
function isLogBoxErrorMessage(message) {
    return typeof message === 'string' && message.includes(LOGBOX_ERROR_MESSAGE);
}
exports.isLogBoxErrorMessage = isLogBoxErrorMessage;
function isMessageIgnored(message) {
    for (const pattern of ignorePatterns) {
        if ((pattern instanceof RegExp && pattern.test(message)) ||
            (typeof pattern === 'string' && message.includes(pattern))) {
            return true;
        }
    }
    return false;
}
exports.isMessageIgnored = isMessageIgnored;
function setImmediateShim(callback) {
    if (!global.setImmediate) {
        return setTimeout(callback, 0);
    }
    return global.setImmediate(callback);
}
function handleUpdate() {
    if (updateTimeout == null) {
        updateTimeout = setImmediateShim(() => {
            updateTimeout = null;
            const nextState = getNextState();
            observers.forEach(({ observer }) => observer(nextState));
        });
    }
}
function appendNewLog(newLog) {
    // Don't want store these logs because they trigger a
    // state update when we add them to the store.
    if (isMessageIgnored(newLog.message.content)) {
        return;
    }
    // If the next log has the same category as the previous one
    // then roll it up into the last log in the list by incrementing
    // the count (similar to how Chrome does it).
    const lastLog = Array.from(logs).pop();
    if (lastLog && lastLog.category === newLog.category) {
        lastLog.incrementCount();
        handleUpdate();
        return;
    }
    if (newLog.level === 'fatal') {
        // If possible, to avoid jank, we don't want to open the error before
        // it's symbolicated. To do that, we optimistically wait for
        // symbolication for up to a second before adding the log.
        const OPTIMISTIC_WAIT_TIME = 1000;
        let addPendingLog = () => {
            logs.add(newLog);
            if (_selectedIndex < 0) {
                setSelectedLog(logs.size - 1);
            }
            else {
                handleUpdate();
            }
            addPendingLog = null;
        };
        const optimisticTimeout = setTimeout(() => {
            if (addPendingLog) {
                addPendingLog();
            }
        }, OPTIMISTIC_WAIT_TIME);
        // TODO: HANDLE THIS
        newLog.symbolicate('component');
        newLog.symbolicate('stack', (status) => {
            if (addPendingLog && status !== 'PENDING') {
                addPendingLog();
                clearTimeout(optimisticTimeout);
            }
            else if (status !== 'PENDING') {
                // The log has already been added but we need to trigger a render.
                handleUpdate();
            }
        });
    }
    else if (newLog.level === 'syntax') {
        logs.add(newLog);
        setSelectedLog(logs.size - 1);
    }
    else {
        logs.add(newLog);
        handleUpdate();
    }
}
function addLog(log) {
    const errorForStackTrace = new Error();
    // Parsing logs are expensive so we schedule this
    // otherwise spammy logs would pause rendering.
    setImmediate(() => {
        try {
            const stack = (0, parseErrorStack_1.default)(errorForStackTrace?.stack);
            appendNewLog(new LogBoxLog_1.LogBoxLog({
                level: log.level,
                message: log.message,
                isComponentError: false,
                stack,
                category: log.category,
                componentStack: log.componentStack,
            }));
        }
        catch (error) {
            reportUnexpectedLogBoxError(error);
        }
    });
}
exports.addLog = addLog;
function addException(error) {
    // Parsing logs are expensive so we schedule this
    // otherwise spammy logs would pause rendering.
    setImmediate(() => {
        try {
            appendNewLog(new LogBoxLog_1.LogBoxLog((0, parseLogBoxLog_1.parseLogBoxException)(error)));
        }
        catch (loggingError) {
            reportUnexpectedLogBoxError(loggingError);
        }
    });
}
exports.addException = addException;
function symbolicateLogNow(type, log) {
    log.symbolicate(type, () => {
        handleUpdate();
    });
}
exports.symbolicateLogNow = symbolicateLogNow;
function retrySymbolicateLogNow(type, log) {
    log.retrySymbolicate(type, () => {
        handleUpdate();
    });
}
exports.retrySymbolicateLogNow = retrySymbolicateLogNow;
function symbolicateLogLazy(type, log) {
    log.symbolicate(type);
}
exports.symbolicateLogLazy = symbolicateLogLazy;
function clear() {
    if (logs.size > 0) {
        logs = new Set();
        setSelectedLog(-1);
    }
}
exports.clear = clear;
function setSelectedLog(proposedNewIndex) {
    const oldIndex = _selectedIndex;
    let newIndex = proposedNewIndex;
    const logArray = Array.from(logs);
    let index = logArray.length - 1;
    while (index >= 0) {
        // The latest syntax error is selected and displayed before all other logs.
        if (logArray[index].level === 'syntax') {
            newIndex = index;
            break;
        }
        index -= 1;
    }
    _selectedIndex = newIndex;
    handleUpdate();
    if (NativeLogBox_1.default) {
        setTimeout(() => {
            if (oldIndex < 0 && newIndex >= 0) {
                NativeLogBox_1.default.show();
            }
            else if (oldIndex >= 0 && newIndex < 0) {
                NativeLogBox_1.default.hide();
            }
        }, 0);
    }
}
exports.setSelectedLog = setSelectedLog;
function clearWarnings() {
    const newLogs = Array.from(logs).filter((log) => log.level !== 'warn');
    if (newLogs.length !== logs.size) {
        logs = new Set(newLogs);
        setSelectedLog(-1);
        handleUpdate();
    }
}
exports.clearWarnings = clearWarnings;
function clearErrors() {
    const newLogs = Array.from(logs).filter((log) => log.level !== 'error' && log.level !== 'fatal');
    if (newLogs.length !== logs.size) {
        logs = new Set(newLogs);
        setSelectedLog(-1);
    }
}
exports.clearErrors = clearErrors;
function dismiss(log) {
    if (logs.has(log)) {
        logs.delete(log);
        handleUpdate();
    }
}
exports.dismiss = dismiss;
function getIgnorePatterns() {
    return Array.from(ignorePatterns);
}
exports.getIgnorePatterns = getIgnorePatterns;
function addIgnorePatterns(patterns) {
    const existingSize = ignorePatterns.size;
    // The same pattern may be added multiple times, but adding a new pattern
    // can be expensive so let's find only the ones that are new.
    patterns.forEach((pattern) => {
        if (pattern instanceof RegExp) {
            for (const existingPattern of ignorePatterns) {
                if (existingPattern instanceof RegExp &&
                    existingPattern.toString() === pattern.toString()) {
                    return;
                }
            }
            ignorePatterns.add(pattern);
        }
        ignorePatterns.add(pattern);
    });
    if (ignorePatterns.size === existingSize) {
        return;
    }
    // We need to recheck all of the existing logs.
    // This allows adding an ignore pattern anywhere in the codebase.
    // Without this, if you ignore a pattern after the a log is created,
    // then we would keep showing the log.
    logs = new Set(Array.from(logs).filter((log) => !isMessageIgnored(log.message.content)));
    handleUpdate();
}
exports.addIgnorePatterns = addIgnorePatterns;
function setDisabled(value) {
    if (value === _isDisabled) {
        return;
    }
    _isDisabled = value;
    handleUpdate();
}
exports.setDisabled = setDisabled;
function isDisabled() {
    return _isDisabled;
}
exports.isDisabled = isDisabled;
function observe(observer) {
    const subscription = { observer };
    observers.add(subscription);
    observer(getNextState());
    return {
        unsubscribe() {
            observers.delete(subscription);
        },
    };
}
exports.observe = observe;
function withSubscription(WrappedComponent) {
    class LogBoxStateSubscription extends React.Component {
        static getDerivedStateFromError() {
            return { hasError: true };
        }
        componentDidCatch(err, errorInfo) {
            /* $FlowFixMe[class-object-subtyping] added when improving typing for
             * this parameters */
            reportLogBoxError(err, errorInfo.componentStack);
        }
        _subscription;
        state = {
            logs: new Set(),
            isDisabled: false,
            hasError: false,
            selectedLogIndex: -1,
        };
        render() {
            if (this.state.hasError) {
                // This happens when the component failed to render, in which case we delegate to the native redbox.
                // We can't show any fallback UI here, because the error may be with <View> or <Text>.
                return null;
            }
            return (React.createElement(LogContext_1.LogContext.Provider, { value: {
                    selectedLogIndex: this.state.selectedLogIndex,
                    isDisabled: this.state.isDisabled,
                    logs: Array.from(this.state.logs),
                } },
                this.props.children,
                React.createElement(WrappedComponent, null)));
        }
        componentDidMount() {
            this._subscription = observe((data) => {
                this.setState(data);
            });
        }
        componentWillUnmount() {
            if (this._subscription != null) {
                this._subscription.unsubscribe();
            }
        }
        _handleDismiss = () => {
            // Here we handle the cases when the log is dismissed and it
            // was either the last log, or when the current index
            // is now outside the bounds of the log array.
            const { selectedLogIndex, logs: stateLogs } = this.state;
            const logsArray = Array.from(stateLogs);
            if (selectedLogIndex != null) {
                if (logsArray.length - 1 <= 0) {
                    setSelectedLog(-1);
                }
                else if (selectedLogIndex >= logsArray.length - 1) {
                    setSelectedLog(selectedLogIndex - 1);
                }
                dismiss(logsArray[selectedLogIndex]);
            }
        };
        _handleMinimize = () => {
            setSelectedLog(-1);
        };
        _handleSetSelectedLog = (index) => {
            setSelectedLog(index);
        };
    }
    // @ts-expect-error
    return LogBoxStateSubscription;
}
exports.withSubscription = withSubscription;
//# sourceMappingURL=LogBoxData.js.map