"use strict";
/**
 * Copyright (c) 650 Industries.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
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
exports.LogBoxLog = void 0;
const LogBoxSymbolication = __importStar(require("./LogBoxSymbolication"));
function componentStackToStack(componentStack) {
    return componentStack.map((stack) => ({
        file: stack.fileName,
        methodName: stack.content,
        lineNumber: stack.location?.row ?? 0,
        column: stack.location?.column ?? 0,
        arguments: [],
    }));
}
class LogBoxLog {
    message;
    type;
    category;
    componentStack;
    stack;
    count;
    level;
    codeFrame;
    isComponentError;
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
    }
    incrementCount() {
        this.count += 1;
    }
    getAvailableStack(type) {
        if (this.symbolicated[type].status === 'COMPLETE') {
            return this.symbolicated[type].stack;
        }
        return this.getStack(type);
    }
    flushCallbacks(type) {
        const callbacks = this.callbacks.get(type);
        const status = this.symbolicated[type].status;
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
        const status = this.symbolicated[type].status;
        if (status === 'COMPLETE') {
            return this.flushCallbacks(type);
        }
        if (retry) {
            LogBoxSymbolication.deleteStack(this.getStack(type));
            this.handleSymbolicate(type);
        }
        else {
            if (status === 'NONE') {
                this.handleSymbolicate(type);
            }
        }
    }
    componentStackCache = null;
    getStack(type) {
        if (type === 'component') {
            if (this.componentStackCache == null) {
                this.componentStackCache = componentStackToStack(this.componentStack);
            }
            return this.componentStackCache;
        }
        return this.stack;
    }
    handleSymbolicate(type) {
        if (type === 'component' && !this.componentStack?.length) {
            return;
        }
        if (this.symbolicated[type].status !== 'PENDING') {
            this.updateStatus(type, null, null, null);
            LogBoxSymbolication.symbolicate(this.getStack(type)).then((data) => {
                this.updateStatus(type, null, data?.stack, data?.codeFrame);
            }, (error) => {
                this.updateStatus(type, error, null, null);
            });
        }
    }
    updateStatus(type, error, stack, codeFrame) {
        const lastStatus = this.symbolicated[type].status;
        if (error != null) {
            this.symbolicated[type] = {
                error,
                stack: null,
                status: 'FAILED',
            };
        }
        else if (stack != null) {
            if (codeFrame) {
                this.codeFrame = codeFrame;
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
        const status = this.symbolicated[type].status;
        if (lastStatus !== status) {
            if (['COMPLETE', 'FAILED'].includes(status)) {
                this.flushCallbacks(type);
            }
        }
    }
}
exports.LogBoxLog = LogBoxLog;
//# sourceMappingURL=LogBoxLog.js.map