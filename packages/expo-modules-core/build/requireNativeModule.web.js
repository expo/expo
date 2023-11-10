export function requireNativeModule(moduleName) {
    throw new Error(`Cannot find native module '${moduleName}'`);
}
export function requireOptionalNativeModule() {
    return null;
}
//# sourceMappingURL=requireNativeModule.web.js.map