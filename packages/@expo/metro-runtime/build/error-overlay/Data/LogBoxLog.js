"use strict";
/**
 * Copyright (c) Evan Bacon.
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
    return componentStack.map((stack) => {
        var _a, _b, _c, _d;
        return ({
            file: stack.fileName,
            methodName: stack.content,
            lineNumber: (_b = (_a = stack.location) === null || _a === void 0 ? void 0 : _a.row) !== null && _b !== void 0 ? _b : 0,
            column: (_d = (_c = stack.location) === null || _c === void 0 ? void 0 : _c.column) !== null && _d !== void 0 ? _d : 0,
            arguments: [],
        });
    });
}
class LogBoxLog {
    constructor(data) {
        var _a, _b;
        this.symbolicated = {
            stack: {
                error: null,
                stack: null,
                status: "NONE",
            },
            component: {
                error: null,
                stack: null,
                status: "NONE",
            },
        };
        this.callbacks = new Map();
        this.componentStackCache = null;
        this.level = data.level;
        this.type = (_a = data.type) !== null && _a !== void 0 ? _a : "error";
        this.message = data.message;
        this.stack = data.stack;
        this.category = data.category;
        this.componentStack = data.componentStack;
        this.codeFrame = data.codeFrame;
        this.isComponentError = data.isComponentError;
        this.count = 1;
        this.symbolicated = (_b = data.symbolicated) !== null && _b !== void 0 ? _b : this.symbolicated;
    }
    incrementCount() {
        this.count += 1;
    }
    getAvailableStack(type) {
        if (this.symbolicated[type].status === "COMPLETE") {
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
        if (status === "COMPLETE") {
            return this.flushCallbacks(type);
        }
        if (retry) {
            LogBoxSymbolication.deleteStack(this.getStack(type));
            this.handleSymbolicate(type);
        }
        else {
            if (status === "NONE") {
                this.handleSymbolicate(type);
            }
        }
    }
    getStack(type) {
        if (type === "component") {
            if (this.componentStackCache == null) {
                this.componentStackCache = componentStackToStack(this.componentStack);
            }
            return this.componentStackCache;
        }
        return this.stack;
    }
    handleSymbolicate(type) {
        var _a;
        if (type === "component" && !((_a = this.componentStack) === null || _a === void 0 ? void 0 : _a.length)) {
            return;
        }
        if (this.symbolicated[type].status !== "PENDING") {
            this.updateStatus(type, null, null, null);
            LogBoxSymbolication.symbolicate(this.getStack(type)).then((data) => {
                this.updateStatus(type, null, data === null || data === void 0 ? void 0 : data.stack, data === null || data === void 0 ? void 0 : data.codeFrame);
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
                status: "FAILED",
            };
        }
        else if (stack != null) {
            if (codeFrame) {
                this.codeFrame = codeFrame;
            }
            this.symbolicated[type] = {
                error: null,
                stack,
                status: "COMPLETE",
            };
        }
        else {
            this.symbolicated[type] = {
                error: null,
                stack: null,
                status: "PENDING",
            };
        }
        const status = this.symbolicated[type].status;
        if (lastStatus !== status) {
            if (["COMPLETE", "FAILED"].includes(status)) {
                this.flushCallbacks(type);
            }
        }
    }
}
exports.LogBoxLog = LogBoxLog;
//# sourceMappingURL=LogBoxLog.js.map