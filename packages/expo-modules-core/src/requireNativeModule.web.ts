export function requireNativeModule<ModuleType = any>(moduleName: string): ModuleType {
  const nativeModule = requireOptionalNativeModule<ModuleType>(moduleName);

  if (!nativeModule) {
    throw new Error(`Cannot find native module '${moduleName}'`);
  }
  return nativeModule;
}

export function requireOptionalNativeModule<ModuleType = any>(
  moduleName: string
): ModuleType | null {
  if (typeof globalThis.ExpoDomWebView === 'object' && globalThis?.expo?.modules != null) {
    return globalThis.expo?.modules?.[moduleName] ?? null;
  }
  return null;
}
