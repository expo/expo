// It is a no-op function that returns the module implementation without importing CoreModule.
// Actual implementation is located in `createWebModule.web.ts`.
export function createWebModule<ModuleType = any>(moduleImplementation: ModuleType): ModuleType {
  return moduleImplementation;
}
