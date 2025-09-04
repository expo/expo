interface ESModuleType {
  __esModule?: boolean;
  default: any;
}

/**
 * Interop helper for async imports.
 *
 * Because CLI files are built with CJS, we need the interop helper for async imports.
 * @example
 * ```ts
 * const { setNodeEnv, loadEnvFiles } = asyncImportInterop(await import('../utils/nodeEnv.js'));
 * ```
 *
 * FWIW, these are the differences
 * ```
 * > // Import CJS module
 * > await import('./packages/@expo/cli/build/src/utils/nodeEnv.js')
 * [Module: null prototype] {
 *   __esModule: true,
 *   default: { loadEnvFiles: [Getter], setNodeEnv: [Getter] }
 * }
 * >
 * > // Require a CJS module
 * > require('./packages/@expo/cli/build/src/utils/nodeEnv.js')
 * { loadEnvFiles: [Getter], setNodeEnv: [Getter] }
 * >
 * > // Import an ESM module
 * > await import('expo-mcp')
 * [Module: null prototype] {
 *   addMcpCapabilities: [Function: addMcpCapabilities]
 * }
 * ```
 */
export function asyncImportInterop(obj: ESModuleType): ESModuleType['default'] {
  if (
    obj &&
    typeof obj === 'object' &&
    '__esModule' in obj &&
    obj.__esModule &&
    'default' in obj &&
    obj.default
  ) {
    return obj.default;
  }

  return obj;
}
