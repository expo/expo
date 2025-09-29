"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scopeRef = void 0;
// NOTE(@kitten): When multiple versions of `@expo/server` are bundled, we still want to reuse the same scope definition
const scopeSymbol = Symbol.for('expoServerRuntime');
const sharedScope = globalThis;
const scopeRef = sharedScope[scopeSymbol] ||
    (sharedScope[scopeSymbol] = {
        current: null,
    });
exports.scopeRef = scopeRef;
//# sourceMappingURL=scope.js.map