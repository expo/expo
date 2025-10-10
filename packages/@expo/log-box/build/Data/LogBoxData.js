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
exports.reportUnexpectedLogBoxError = reportUnexpectedLogBoxError;
exports.isLogBoxErrorMessage = isLogBoxErrorMessage;
exports.isMessageIgnored = isMessageIgnored;
exports._appendNewLog = _appendNewLog;
exports.addLog = addLog;
exports.addException = addException;
exports.symbolicateLogNow = symbolicateLogNow;
exports.retrySymbolicateLogNow = retrySymbolicateLogNow;
exports.symbolicateLogLazy = symbolicateLogLazy;
exports.clear = clear;
exports.setSelectedLog = setSelectedLog;
exports.clearErrors = clearErrors;
exports.dismiss = dismiss;
exports.getIgnorePatterns = getIgnorePatterns;
exports.addIgnorePatterns = addIgnorePatterns;
exports.setDisabled = setDisabled;
exports.isDisabled = isDisabled;
exports.observe = observe;
exports.withSubscription = withSubscription;
const React = __importStar(require("react"));
const react_native_1 = require("react-native");
const LogBoxLog_1 = require("./LogBoxLog");
const parseLogBoxLog_1 = require("./parseLogBoxLog");
const devServerEndpoints_1 = require("../utils/devServerEndpoints");
const parseUnexpectedThrownValue_1 = require("../utils/parseUnexpectedThrownValue");
const observers = new Set();
const ignorePatterns = new Set();
let logs = new Set();
let updateTimeout = null;
let _isDisabled = false;
let _selectedIndex = -1;
const LOGBOX_ERROR_MESSAGE = 'An error was thrown while presenting an error!';
function getNextState() {
    return {
        logs,
        isDisabled: _isDisabled,
        selectedLogIndex: _selectedIndex,
    };
}
function reportUnexpectedLogBoxError(error) {
    if ((0, parseLogBoxLog_1.isError)(error)) {
        error.message = `${LOGBOX_ERROR_MESSAGE}\n\n${error.message}`;
    }
    addException(error);
}
function isLogBoxErrorMessage(message) {
    return typeof message === 'string' && message.includes(LOGBOX_ERROR_MESSAGE);
}
function isMessageIgnored(message) {
    for (const pattern of ignorePatterns) {
        if ((pattern instanceof RegExp && pattern.test(message)) ||
            (typeof pattern === 'string' && message.includes(pattern))) {
            return true;
        }
    }
    return false;
}
function handleUpdate() {
    if (updateTimeout == null) {
        updateTimeout = setTimeout(() => {
            updateTimeout = null;
            const nextState = getNextState();
            observers.forEach(({ observer }) => observer(nextState));
        }, 0);
    }
}
/** Exposed for debugging */
function _appendNewLog(newLog) {
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
        if (lastLog.level === newLog.level) {
            lastLog.incrementCount();
            handleUpdate();
            return;
        }
        else {
            // Determine which one is more important. This is because console.error for React errors shows before the more important root componentDidCatch which should force the UI to show.
            if (newLog.level === 'fatal') {
                // If the new log is fatal, then we want to show it
                // and hide the last one.
                newLog.count = lastLog.count;
                logs.delete(lastLog);
            }
        }
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
    else if (newLog.level === 'syntax' || newLog.level === 'resolution') {
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
    setTimeout(() => {
        try {
            const stack = (0, devServerEndpoints_1.parseErrorStack)(errorForStackTrace?.stack);
            _appendNewLog(new LogBoxLog_1.LogBoxLog({
                level: log.level,
                message: log.message,
                isComponentError: !!log.componentStack?.length,
                stack,
                category: log.category,
                componentStack: log.componentStack,
                codeFrame: {},
            }));
        }
        catch (unexpectedError) {
            reportUnexpectedLogBoxError(unexpectedError);
        }
    }, 0);
}
function addException(error) {
    let logBoxData;
    // NOTE(Bacon): Support newer system for formatting errors as logbox data with more data and less parsing.
    if ('toLogBoxLogData' in error && typeof error.toLogBoxLogData === 'function') {
        const logBoxLogData = error.toLogBoxLogData();
        if (logBoxLogData) {
            logBoxData = logBoxLogData;
        }
    }
    // Fallback to the old system for formatting errors as logbox data.
    // This is used for unexpected behavior and should be reduced as much as possible.
    logBoxData ??= (0, parseLogBoxLog_1.parseLogBoxException)((0, parseUnexpectedThrownValue_1.parseUnexpectedThrownValue)(error));
    // Parsing logs are expensive so we schedule this
    // otherwise spammy logs would pause rendering.
    setTimeout(() => {
        try {
            _appendNewLog(new LogBoxLog_1.LogBoxLog(logBoxData));
        }
        catch (unexpectedError) {
            reportUnexpectedLogBoxError(unexpectedError);
        }
    }, 0);
}
function symbolicateLogNow(type, log) {
    log.symbolicate(type, () => {
        handleUpdate();
    });
}
function retrySymbolicateLogNow(type, log) {
    log.retrySymbolicate(type, () => {
        handleUpdate();
    });
}
function symbolicateLogLazy(type, log) {
    log.symbolicate(type);
}
function clear() {
    if (logs.size > 0) {
        logs = new Set();
        setSelectedLog(-1);
    }
}
function setSelectedLog(proposedNewIndex) {
    const oldIndex = _selectedIndex;
    let newIndex = proposedNewIndex;
    const logArray = Array.from(logs);
    let index = logArray.length - 1;
    while (index >= 0) {
        // The latest syntax error is selected and displayed before all other logs.
        if (logArray[index].level === 'syntax' || logArray[index].level === 'resolution') {
            newIndex = index;
            break;
        }
        index -= 1;
    }
    _selectedIndex = newIndex;
    handleUpdate();
    setTimeout(() => {
        if (oldIndex < 0 && newIndex >= 0) {
            require('../ErrorOverlayWebControls').presentGlobalErrorOverlay();
        }
        else if (oldIndex >= 0 && newIndex < 0) {
            require('../ErrorOverlayWebControls').dismissGlobalErrorOverlay();
        }
    }, 0);
}
function clearErrors() {
    const newLogs = Array.from(logs).filter((log) => log.level !== 'error' && log.level !== 'fatal');
    if (newLogs.length !== logs.size) {
        logs = new Set(newLogs);
        setSelectedLog(-1);
    }
}
function dismiss(log) {
    if (logs.has(log)) {
        logs.delete(log);
        handleUpdate();
    }
    else {
        // Find log with matching message
        const message = log.message.content;
        const logToDismiss = Array.from(logs).find((l) => l.message.content === message);
        if (logToDismiss) {
            logs.delete(logToDismiss);
            handleUpdate();
        }
        else {
            console.warn('LogBoxLog not found in logs:', log, logs);
        }
    }
}
function getIgnorePatterns() {
    return Array.from(ignorePatterns);
}
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
function setDisabled(value) {
    if (value === _isDisabled) {
        return;
    }
    _isDisabled = value;
    handleUpdate();
}
function isDisabled() {
    return _isDisabled;
}
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
const emitter = new react_native_1.NativeEventEmitter({
    addListener() { },
    removeListeners() { },
});
function withSubscription(WrappedComponent) {
    class RootDevErrorBoundary extends React.Component {
        static getDerivedStateFromError() {
            return { hasError: true };
        }
        constructor(props) {
            super(props);
            if (process.env.NODE_ENV === 'development') {
                emitter.addListener('devLoadingView:hide', () => {
                    if (this.state.hasError) {
                        this.retry();
                    }
                });
            }
        }
        componentDidCatch(err, errorInfo) {
            // TODO: Won't this catch all React errors and make them appear as unexpected rendering errors?
            err.componentStack ??= errorInfo.componentStack;
            // TODO: Make the error appear more like the React console.error, appending the "The above error occurred" line.
            const { category, message, componentStack } = (0, parseLogBoxLog_1.parseLogBoxLog)([err]);
            if (!isMessageIgnored(message.content)) {
                addLog({
                    // Always show the static rendering issues as full screen since they
                    // are too confusing otherwise.
                    level: 'fatal',
                    category,
                    message,
                    componentStack,
                });
            }
        }
        _subscription;
        state = {
            logs: new Set(),
            isDisabled: false,
            hasError: false,
            selectedLogIndex: -1,
        };
        retry = () => {
            return new Promise((resolve) => {
                this.setState({ hasError: false }, () => {
                    resolve();
                });
            });
        };
        render() {
            return (React.createElement(LogBoxLog_1.LogContext.Provider, { value: {
                    selectedLogIndex: this.state.selectedLogIndex,
                    isDisabled: this.state.isDisabled,
                    logs: Array.from(this.state.logs),
                } },
                this.props.children,
                React.createElement(WrappedComponent, null)));
        }
        componentDidMount() {
            this._subscription = observe((data) => {
                // Ignore the initial empty log
                // if (data.selectedLogIndex === -1) return;
                React.startTransition(() => {
                    this.setState(data);
                });
            });
        }
        componentWillUnmount() {
            if (this._subscription != null) {
                this._subscription.unsubscribe();
            }
        }
    }
    return RootDevErrorBoundary;
}
