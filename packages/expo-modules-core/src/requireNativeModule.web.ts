export function requireNativeModule(moduleName: string) {
  throw new Error(`Cannot find native module '${moduleName}'`);
}

export function requireOptionalNativeModule() {
  return null;
}
