/**
 * Copyright © 2025 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
export interface LoaderResolutionOptions {
    isExporting?: boolean;
    projectRoot?: string;
    routerRoot?: string;
}
/**
 * Resolves a loader's module path.
 *
 * In development mode: Returns a Metro-compatible relative path
 * In export mode: Returns an absolute filesystem path
 *
 */
export declare function resolveLoaderModulePath(contextKey: string, options: LoaderResolutionOptions): string;
//# sourceMappingURL=resolveLoaderPath.d.ts.map