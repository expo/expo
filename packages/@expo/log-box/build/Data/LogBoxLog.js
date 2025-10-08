"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogContext = exports.LogBoxLog = void 0;
exports.useLogs = useLogs;
/**
 * Copyright (c) 650 Industries.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
const react_1 = __importDefault(require("react"));
const devServerEndpoints_1 = require("../utils/devServerEndpoints");
class LogBoxLog {
    message;
    type;
    category;
    componentStack;
    stack;
    count;
    level;
    codeFrame = {};
    isComponentError;
    isMissingModuleError;
    symbolicated = {
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
    callbacks = new Map();
    constructor(data) {
        this.level = data.level;
        this.type = data.type ?? 'error';
        this.message = data.message;
        this.stack = data.stack;
        this.category = data.category;
        this.componentStack = data.componentStack;
        this.codeFrame = data.codeFrame;
        this.isComponentError = data.isComponentError;
        this.count = 1;
        this.symbolicated = data.symbolicated ?? this.symbolicated;
        this.isMissingModuleError = data.isMissingModuleError;
    }
    incrementCount() {
        this.count += 1;
    }
    getStackStatus(type) {
        return this.symbolicated[type]?.status;
    }
    getAvailableStack(type) {
        if (this.symbolicated[type]?.status === 'COMPLETE') {
            return this.symbolicated[type].stack;
        }
        return this.getStack(type);
    }
    flushCallbacks(type) {
        const callbacks = this.callbacks.get(type);
        const status = this.symbolicated[type]?.status;
        if (callbacks) {
            for (const callback of callbacks) {
                callback(status);
            }
            callbacks.clear();
        }
    }
    pushCallback(type, callback) {
        let callbacks = this.callbacks.get(type);
        if (!callbacks) {
            callbacks = new Set();
            this.callbacks.set(type, callbacks);
        }
        callbacks.add(callback);
    }
    retrySymbolicate(type, callback) {
        this._symbolicate(type, true, callback);
    }
    symbolicate(type, callback) {
        this._symbolicate(type, false, callback);
    }
    _symbolicate(type, retry, callback) {
        if (callback) {
            this.pushCallback(type, callback);
        }
        const status = this.symbolicated[type]?.status;
        if (status === 'COMPLETE') {
            return this.flushCallbacks(type);
        }
        if (retry) {
            (0, devServerEndpoints_1.invalidateCachedStack)(this.getStack(type));
            this.handleSymbolicate(type);
        }
        else {
            if (status === 'NONE') {
                this.handleSymbolicate(type);
            }
        }
    }
    getStack(type) {
        if (type === 'component') {
            return this.componentStack;
        }
        return this.stack;
    }
    handleSymbolicate(type) {
        if (this.symbolicated[type]?.status === 'PENDING') {
            return;
        }
        this.updateStatus(type, null, null, null);
        (0, devServerEndpoints_1.symbolicateStackAndCacheAsync)(this.getStack(type)).then((data) => {
            this.updateStatus(type, null, data?.stack, data?.codeFrame);
        }, (error) => {
            this.updateStatus(type, error, null, null);
        });
    }
    updateStatus(type, error, stack, codeFrame) {
        const lastStatus = this.symbolicated[type]?.status;
        if (error != null) {
            this.symbolicated[type] = {
                error,
                stack: null,
                status: 'FAILED',
            };
        }
        else if (stack != null) {
            if (codeFrame) {
                this.codeFrame[type] = codeFrame;
            }
            this.symbolicated[type] = {
                error: null,
                stack,
                status: 'COMPLETE',
            };
        }
        else {
            this.symbolicated[type] = {
                error: null,
                stack: null,
                status: 'PENDING',
            };
        }
        const status = this.symbolicated[type]?.status;
        if (lastStatus !== status) {
            if (['COMPLETE', 'FAILED'].includes(status)) {
                this.flushCallbacks(type);
            }
        }
    }
}
exports.LogBoxLog = LogBoxLog;
exports.LogContext = react_1.default.createContext(null);
function useLogs() {
    const logs = react_1.default.useContext(exports.LogContext);
    if (!logs) {
        throw new Error('useLogs must be used within a LogContext.Provider');
    }
    return logs;
}
