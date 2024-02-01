if (typeof expo === 'undefined') {
    // @ts-expect-error: types need to be updated to account for web/server.
    globalThis.expo = {};
}
export function requireNativeModule(moduleName) {
    throw new Error(`Cannot find native module '${moduleName}'`);
}
export function requireOptionalNativeModule() {
    return null;
}
//# sourceMappingURL=requireNativeModule.web.js.map