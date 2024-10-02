export function requireNativeModule<ModuleType = any>(moduleName: string): ModuleType {
  const nativeModule = requireOptionalNativeModule<ModuleType>(moduleName);
  if (nativeModule != null) {
    return nativeModule;
  }
  if (typeof window === 'undefined') {
    // For SSR, we expect not to have native modules available, but to avoid crashing from SSR resolutions, we return an empty object.
    return {} as ModuleType;
  }
  throw new Error(`Cannot find native module '${moduleName}'`);
}

export function requireOptionalNativeModule<ModuleType = any>(
  moduleName: string
): ModuleType | null {
  if (typeof globalThis.ExpoDomWebView === 'object' && globalThis?.expo?.modules != null) {
    return globalThis.expo?.modules?.[moduleName] ?? null;
  }
  return null;
}
