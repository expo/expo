export class FailedToResolveNativeOnlyModuleError extends Error {
  constructor(moduleName: string, relativePath: string) {
    super(`Importing native-only module "${moduleName}" on web from: ${relativePath}`);
  }
}
export class FailedToResolveRuntimeRestrictedModuleError extends Error {
  constructor(moduleName: string, relativePath: string) {
    super(`Importing local "${moduleName}" when standard runtime is enabled from: ${relativePath}`);
  }
}
