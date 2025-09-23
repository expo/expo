"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRequestScopeSingleton = getRequestScopeSingleton;
exports.getRequestScope = getRequestScope;
const node_async_hooks_1 = require("node:async_hooks");
const scopeSymbol = Symbol.for('expoServerRuntime');
function getRequestScopeSingleton() {
    const setup = globalThis;
    return setup[scopeSymbol] ?? (setup[scopeSymbol] = new node_async_hooks_1.AsyncLocalStorage());
}
function getRequestScope() {
    return getRequestScopeSingleton().getStore();
}
//# sourceMappingURL=scope.js.map