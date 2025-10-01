// NOTE(@kitten): When multiple versions of `@expo/server` are bundled, we still want to reuse the same scope definition
const scopeSymbol = Symbol.for('expoServerRuntime');
const sharedScope = globalThis;
const scopeRef = sharedScope[scopeSymbol] ||
    (sharedScope[scopeSymbol] = {
        current: null,
    });
export { scopeRef };
//# sourceMappingURL=scope.js.map