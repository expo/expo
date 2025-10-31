export class FailedToResolveNativeOnlyModuleError extends Error {
  constructor(moduleName: string, relativePath: string) {
    super(`Importing native-only module "${moduleName}" on web from: ${relativePath}`);
  }
}
