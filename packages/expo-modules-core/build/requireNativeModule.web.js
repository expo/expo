export function requireNativeModule(moduleName) {
    throw new Error(`Cannot find native module '${moduleName}'`);
}
export function requireOptionalNativeModule() {
    return null;
}
if (!globalThis.expo) {
    globalThis.expo = {
        modules: {},
    };
}
//# sourceMappingURL=requireNativeModule.web.js.map