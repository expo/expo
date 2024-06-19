export function registerWebModule(moduleName, moduleImplementation) {
    if (globalThis.expo.modules[moduleName]) {
        return globalThis.expo.modules[moduleName];
    }
    globalThis.expo.modules[moduleName] = new moduleImplementation();
    return globalThis.expo.modules[moduleName];
}
//# sourceMappingURL=registerWebModule.js.map