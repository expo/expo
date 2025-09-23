import { AsyncLocalStorage } from 'node:async_hooks';
const scopeSymbol = Symbol.for('expoServerRuntime');
export function getRequestScopeSingleton() {
    const setup = globalThis;
    return setup[scopeSymbol] ?? (setup[scopeSymbol] = new AsyncLocalStorage());
}
export function getRequestScope() {
    return getRequestScopeSingleton().getStore();
}
//# sourceMappingURL=scope.js.map