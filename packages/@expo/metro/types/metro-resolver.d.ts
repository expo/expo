// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro-resolver/src/index.js (entry point)
declare module '@expo/metro/metro-resolver' {
  export type * from '@expo/metro/metro-resolver/types';

  export { default as FailedToResolveNameError } from '@expo/metro/metro-resolver/errors/FailedToResolveNameError';
  export { default as FailedToResolvePathError } from '@expo/metro/metro-resolver/errors/FailedToResolvePathError';
  export { default as formatFileCandidates } from '@expo/metro/metro-resolver/errors/formatFileCandidates';
  export { default as InvalidPackageError } from '@expo/metro/metro-resolver/errors/InvalidPackageError';
  export { default as resolve } from '@expo/metro/metro-resolver/resolve';
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro-resolver/src/PackageExportsResolve.js
declare module '@expo/metro/metro-resolver/PackageExportsResolve' {
  import type {
    ExportsField,
    ExportMap,
    FileResolution,
    ResolutionContext,
  } from '@expo/metro/metro-resolver/types';

  /**
   * Resolve a package subpath based on the entry points defined in the package's
   * "exports" field. If there is no match for the given subpath (which may be
   * augmented by resolution of conditional exports for the passed `context`),
   * throws a `PackagePathNotExportedError`.
   *
   * Implements modern package resolution behaviour based on the [Package Entry
   * Points spec](https://nodejs.org/docs/latest-v19.x/api/packages.html#package-entry-points).
   *
   * @throws {InvalidPackageConfigurationError} Raised if configuration specified
   *   by `exportsField` is invalid.
   * @throws {InvalidModuleSpecifierError} Raised if the resolved module specifier
   *   is invalid.
   * @throws {PackagePathNotExportedError} Raised when the requested subpath is
   *   not exported.
   */
  export function resolvePackageTargetFromExports(
    context: ResolutionContext,
    packagePath: string,
    modulePath: string,
    exportsField: ExportsField,
    platform: string | null
  ): FileResolution;

  /**
   * Identifies whether the given subpath is defined in the given "exports"-like
   * mapping. Does not reduce exports conditions (therefore does not identify
   * whether the subpath is mapped to a value).
   */
  export function isSubpathDefinedInExports(exportMap: ExportMap, subpath: string): boolean;
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro-resolver/src/PackageResolve.js
declare module '@expo/metro/metro-resolver/PackageResolve' {
  import type { PackageInfo, ResolutionContext } from '@expo/metro/metro-resolver/types';

  /**
   * Resolve the main entry point subpath for a package.
   *
   * Implements legacy (non-exports) package resolution behaviour based on the
   * ["browser" field spec](https://github.com/defunctzombie/package-browser-field-spec).
   */
  export function getPackageEntryPoint(
    context: ResolutionContext,
    packageInfo: PackageInfo,
    platform: string | null
  ): string;

  /**
   * Get the resolved file path for the given import specifier based on any
   * `package.json` rules. Returns `false` if the module should be
   * [ignored](https://github.com/defunctzombie/package-browser-field-spec#ignore-a-module),
   * and returns the original path if no `package.json` mapping is matched. Does
   * not test file existence.
   *
   * Implements legacy (non-exports) package resolution behaviour based on the
   * ["browser" field spec](https://github.com/defunctzombie/package-browser-field-spec).
   *
   * This is the default implementation of `context.redirectModulePath`.
   */
  export function redirectModulePath(
    context: readonly {
      getPackageForModule: ResolutionContext['getPackageForModule'];
      mainFields: ResolutionContext['mainFields'];
      originModulePath: ResolutionContext['originModulePath'];
      [key: string]: any; // ...
    },
    /**
     * The module path being imported. This may be:
     *
     * - A relative specifier (beginning with '.'), which may be redirected by a
     *   `package.json` file local to `context.originModulePath`.
     *     - Note: A path begining with '/' is treated as an absolute specifier
     *       (non-standard).
     * - A bare specifier (e.g. 'some-pkg', 'some-pkg/foo'), which may be
     *   redirected by `package.json` rules in the containing package.
     * - An absolute specifier, which may be redirected by `package.json` rules
     *   in the containing package (non-standard, "browser" spec only).
     *
     * See https://nodejs.org/docs/latest-v19.x/api/esm.html#import-specifiers
     */
    modulePath: string
  ): string | false;
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro-resolver/src/createDefaultContext.js
declare module '@expo/metro/metro-resolver/createDefaultContext' {
  import type { ResolutionContext } from '@expo/metro/metro-resolver/types';
  import type { TransformResultDependency } from '@expo/metro/metro/DeltaBundler/types';

  type PartialContext = Readonly<
    ResolutionContext & {
      redirectModulePath?: ResolutionContext['redirectModulePath'];
    }
  >;

  /**
   * Helper used by the `metro` package to create the `ResolutionContext` object.
   * As context values can be overridden by callers, this occurs externally to
   * `resolve.js`.
   */
  export default function createDefaultContext(
    context: PartialContext,
    dependencyMap: TransformResultDependency
  ): ResolutionContext;
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro-resolver/src/resolve.js
declare module '@expo/metro/metro-resolver/resolve' {
  import type { Resolution, ResolutionContext } from '@expo/metro/metro-resolver/types';

  export default function resolve(
    context: ResolutionContext,
    moduleName: string,
    platform: string | null
  ): Resolution;
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro-resolver/src/resolveAsset.js
declare module '@expo/metro/metro-resolver/resolveAsset' {
  import type { AssetResolution, ResolutionContext } from '@expo/metro/metro-resolver/types';

  /**
   * Resolve a file path as an asset. Returns the set of files found after
   * expanding asset resolutions (e.g. `icon@2x.png`). Users may override this
   * behaviour via `context.resolveAsset`.
   */
  export default function resolveAsset(
    context: ResolutionContext,
    filePath: string
  ): AssetResolution | null;
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro-resolver/src/types.js
declare module '@expo/metro/metro-resolver/types' {
  import type { ExportMap } from 'metro-resolver/src/types';

  export type {
    AssetFileResolution,
    AssetResolution,
    CustomResolutionContext,
    CustomResolver,
    CustomResolverOptions,
    DoesFileExist,
    ExportMap,
    FileAndDirCandidates,
    FileCandidates,
    FileResolution,
    GetRealPath,
    IsAssetFile,
    PackageInfo,
    PackageJson,
    Resolution,
    ResolutionContext,
    ResolveAsset,
    Result,
    SourceFileResolution,
  } from 'metro-resolver/src/types';

  /** "exports" mapping where values may be legacy Node.js <13.7 array format. */
  export type ExportMapWithFallbacks = Readonly<{
    [subpath: string]: ExportMap[keyof ExportMap] | ExportValueWithFallback;
  }>;

  /** "exports" subpath value when in legacy Node.js <13.7 array format. */
  export type ExportValueWithFallback =
    | readonly (ExportMap | string)[]
    // JSON can also contain exotic nested array structure, which will not be parsed
    | readonly (readonly any[])[];

  export type ExportsField =
    | string
    | readonly string[]
    | ExportValueWithFallback
    | ExportMap
    | ExportMapWithFallbacks;
}

// #region /errors/

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro-resolver/src/errors/FailedToResolveNameError.js
declare module '@expo/metro/metro-resolver/errors/FailedToResolveNameError' {
  export default class FailedToResolveNameError extends Error {
    dirPaths: readonly string[];
    extraPaths: readonly string[];
    constructor(dirPaths: readonly string[], extraPaths: readonly string[]);
  }
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro-resolver/src/errors/FailedToResolvePathError.js
declare module '@expo/metro/metro-resolver/errors/FailedToResolvePathError' {
  import type { FileAndDirCandidates } from '@expo/metro/metro-resolver/types';

  export default class FailedToResolvePathError extends Error {
    candidates: FileAndDirCandidates;
    constructor(candidates: FileAndDirCandidates);
  }
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro-resolver/src/errors/InvalidPackageConfigurationError.js
declare module '@expo/metro/metro-resolver/errors/InvalidPackageConfigurationError' {
  /** Raised when a package contains an invalid `package.json` configuration. */
  export default class InvalidPackageConfigurationError extends Error {
    /** The description of the error cause. */
    reason: string;
    /** Absolute path of the package being resolved. */
    packagePath: string;

    constructor(options: readonly { reason: string; packagePath: string });
  }
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro-resolver/src/errors/InvalidPackageError.js
declare module '@expo/metro/metro-resolver/errors/InvalidPackageError' {
  import type { FileCandidates } from '@expo/metro/metro-resolver/types';

  export default class InvalidPackageError extends Error {
    /**
     * The file candidates we tried to find to resolve the `main` field of the
     * package. Ex. `/js/foo/beep(.js|.json)?` if `main` is specifying `./beep`
     * as the entry point.
     */
    fileCandidates: FileCandidates;
    /**
     * The 'index' file candidates we tried to find to resolve the `main` field of
     * the package. Ex. `/js/foo/beep/index(.js|.json)?` if `main` is specifying
     * `./beep` as the entry point.
     */
    indexCandidates: FileCandidates;
    /**
     * The full path to the main module that was attempted.
     */
    mainModulePath: string;
    /**
     * Full path the package we were trying to resolve.
     * Ex. `/js/foo/package.json`.
     */
    packageJsonPath: string;

    constructor(options: {
      fileCandidates: FileCandidates;
      indexCandidates: FileCandidates;
      mainModulePath: string;
      packageJsonPath: string;
    });
  }
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro-resolver/src/errors/PackagePathNotExportedError.js
declare module '@expo/metro/metro-resolver/errors/PackagePathNotExportedError' {
  /**
   * Raised when package exports do not define or permit a target subpath in the
   * package for the given module.
   */
  export default class PackagePathNotExportedError extends Error {}
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro-resolver/src/errors/formatFileCandidates.js
declare module '@expo/metro/metro-resolver/errors/formatFileCandidates.js' {
  import type { FileCandidates } from '@expo/metro/metro-resolver/types';

  export function formatFileCandidates(candidates: FileCandidates): string;
}

// #region /utils/

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro-resolver/src/utils/isAssetFile.js
declare module '@expo/metro/metro-resolver/utils/isAssetFile' {
  /**
   * Determine if a file path should be considered an asset file based on the
   * given `assetExts`.
   */
  export default function isAssetFile(filePath: string, assetExts: ReadonlySet<string>): boolean;
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro-resolver/src/utils/toPosixPath.js
declare module '@expo/metro/metro-resolver/utils/toPosixPath' {
  /**
   * Replace path separators in the passed string to coerce to a POSIX path. This
   * is a no-op on POSIX systems.
   */
  export default function toPosixPath(relativePathOrSpecifier: string): string;
}
