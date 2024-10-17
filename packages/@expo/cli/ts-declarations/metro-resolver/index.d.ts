// #region metro-resolver
declare module 'metro-resolver' {
  export * from 'metro-resolver/src/index';
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro-resolver/src/createDefaultContext.js
declare module 'metro-resolver/src/createDefaultContext' {
  import type { ResolutionContext } from 'metro-resolver/src/types';
  import type { TransformResultDependency } from 'metro/src/DeltaBundler/types.flow';
  type PartialContext = Readonly<
    {
      redirectModulePath?: ResolutionContext['redirectModulePath'];
    } & ResolutionContext
  >;
  /**
   * Helper used by the `metro` package to create the `ResolutionContext` object.
   * As context values can be overridden by callers, this occurs externally to
   * `resolve.js`.
   */
  function createDefaultContext(
    context: PartialContext,
    dependency: TransformResultDependency
  ): ResolutionContext;
  export default createDefaultContext;
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro-resolver/src/errors/FailedToResolveNameError.js
declare module 'metro-resolver/src/errors/FailedToResolveNameError' {
  class FailedToResolveNameError extends Error {
    dirPaths: readonly string[];
    extraPaths: readonly string[];
    constructor(dirPaths: readonly string[], extraPaths: readonly string[]);
  }
  export default FailedToResolveNameError;
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro-resolver/src/errors/FailedToResolvePathError.js
declare module 'metro-resolver/src/errors/FailedToResolvePathError' {
  import type { FileAndDirCandidates } from 'metro-resolver/src/types';
  class FailedToResolvePathError extends Error {
    candidates: FileAndDirCandidates;
    constructor(candidates: FileAndDirCandidates);
  }
  export default FailedToResolvePathError;
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro-resolver/src/errors/FailedToResolveUnsupportedError.js
declare module 'metro-resolver/src/errors/FailedToResolveUnsupportedError' {
  class FailedToResolveUnsupportedError extends Error {
    constructor(message: string);
  }
  export default FailedToResolveUnsupportedError;
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro-resolver/src/errors/formatFileCandidates.js
declare module 'metro-resolver/src/errors/formatFileCandidates' {
  import type { FileCandidates } from 'metro-resolver/src/types';
  function formatFileCandidates(candidates: FileCandidates): string;
  export default formatFileCandidates;
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro-resolver/src/errors/InvalidPackageConfigurationError.js
declare module 'metro-resolver/src/errors/InvalidPackageConfigurationError' {
  /**
   * Raised when a package contains an invalid `package.json` configuration.
   */
  class InvalidPackageConfigurationError extends Error {
    reason: string;
    packagePath: string;
    constructor(
      opts: Readonly<{
        reason: string;
        packagePath: string;
      }>
    );
  }
  export default InvalidPackageConfigurationError;
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro-resolver/src/errors/InvalidPackageError.js
declare module 'metro-resolver/src/errors/InvalidPackageError' {
  import type { FileCandidates } from 'metro-resolver/src/types';
  class InvalidPackageError extends Error {
    fileCandidates: FileCandidates;
    indexCandidates: FileCandidates;
    mainModulePath: string;
    packageJsonPath: string;
    constructor(opts: {
      readonly fileCandidates: FileCandidates;
      readonly indexCandidates: FileCandidates;
      readonly mainModulePath: string;
      readonly packageJsonPath: string;
    });
  }
  export default InvalidPackageError;
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro-resolver/src/errors/PackagePathNotExportedError.js
declare module 'metro-resolver/src/errors/PackagePathNotExportedError' {
  /**
   * Raised when package exports do not define or permit a target subpath in the
   * package for the given module.
   */
  class PackagePathNotExportedError extends Error {}
  export default PackagePathNotExportedError;
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro-resolver/src/index.js
declare module 'metro-resolver/src/index' {
  // See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro-resolver/src/index.js

  export type {
    AssetFileResolution,
    CustomResolutionContext,
    CustomResolver,
    CustomResolverOptions,
    DoesFileExist,
    FileAndDirCandidates,
    FileCandidates,
    FileResolution,
    FileSystemLookup,
    ResolutionContext,
    Resolution,
    ResolveAsset,
    Result,
  } from 'metro-resolver/src/types';

  // NOTE(cedric): the flow translation API can't resolve types when using inline requires in object properties
  export { default as FailedToResolveNameError } from 'metro-resolver/src/errors/FailedToResolveNameError';
  export { default as FailedToResolvePathError } from 'metro-resolver/src/errors/FailedToResolvePathError';
  export { default as formatFileCandidates } from 'metro-resolver/src/errors/formatFileCandidates';
  export { default as InvalidPackageError } from 'metro-resolver/src/errors/InvalidPackageError';
  export { default as resolve } from 'metro-resolver/src/resolve';
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro-resolver/src/PackageExportsResolve.js
declare module 'metro-resolver/src/PackageExportsResolve' {
  import type {
    ExportMap,
    ExportsField,
    FileResolution,
    ResolutionContext,
  } from 'metro-resolver/src/types';
  type NormalizedExporthMap = Map<string, null | string | ExportMap>;
  export function resolvePackageTargetFromExports(
    context: ResolutionContext,
    packagePath: string,
    modulePath: string,
    packageRelativePath: string,
    exportsField: ExportsField,
    platform: string | null
  ): FileResolution;
  export function isSubpathDefinedInExports(
    exportMap: NormalizedExporthMap,
    subpath: string
  ): boolean;
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro-resolver/src/PackageResolve.js
declare module 'metro-resolver/src/PackageResolve' {
  import type { PackageInfo, ResolutionContext } from 'metro-resolver/src/types';
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
   */
  export function redirectModulePath(
    context: Readonly<{
      getPackageForModule: ResolutionContext['getPackageForModule'];
      mainFields: ResolutionContext['mainFields'];
      originModulePath: ResolutionContext['originModulePath'];
    }>,
    modulePath: string
  ): string | false;
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro-resolver/src/resolve.js
declare module 'metro-resolver/src/resolve' {
  import type { Resolution, ResolutionContext } from 'metro-resolver/src/types';
  function resolve(
    context: ResolutionContext,
    moduleName: string,
    platform: string | null
  ): Resolution;
  export default resolve;
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro-resolver/src/resolveAsset.js
declare module 'metro-resolver/src/resolveAsset' {
  import type { AssetResolution, ResolutionContext } from 'metro-resolver/src/types';
  /**
   * Resolve a file path as an asset. Returns the set of files found after
   * expanding asset resolutions (e.g. `icon@2x.png`). Users may override this
   * behaviour via `context.resolveAsset`.
   */
  function resolveAsset(context: ResolutionContext, filePath: string): AssetResolution | null;
  export default resolveAsset;
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro-resolver/src/types.js
declare module 'metro-resolver/src/types' {
  import type { TransformResultDependency } from 'metro/src/DeltaBundler/types.flow';
  export type Result<TResolution, TCandidates> =
    | {
        readonly type: 'resolved';
        readonly resolution: TResolution;
      }
    | {
        readonly type: 'failed';
        readonly candidates: TCandidates;
      };
  export type Resolution =
    | FileResolution
    | {
        readonly type: 'empty';
      };
  export type SourceFileResolution = Readonly<{
    type: 'sourceFile';
    filePath: string;
  }>;
  export type AssetFileResolution = readonly string[];
  export type AssetResolution = Readonly<{
    type: 'assetFiles';
    filePaths: AssetFileResolution;
  }>;
  export type FileResolution = AssetResolution | SourceFileResolution;
  export type FileAndDirCandidates = {
    readonly dir?: null | FileCandidates;
    readonly file?: null | FileCandidates;
  };
  /**
   * This is a way to describe what files we tried to look for when resolving
   * a module name as file. This is mainly used for error reporting, so that
   * we can explain why we cannot resolve a module.
   */
  export type FileCandidates =
    | {
        readonly type: 'asset';
        readonly name: string;
      }
    | {
        readonly type: 'sourceFile';
        filePathPrefix: string;
        readonly candidateExts: readonly string[];
      };
  export type ExportMap = Readonly<{
    [subpathOrCondition: string]: string | ExportMap | null;
  }>;
  /** "exports" mapping where values may be legacy Node.js <13.7 array format. */
  export type ExportMapWithFallbacks = Readonly<{
    [subpath: string]: ExportMap[keyof ExportMap] | ExportValueWithFallback;
  }>;
  /** "exports" subpath value when in legacy Node.js <13.7 array format. */
  export type ExportValueWithFallback =
    | readonly (ExportMap | string)[]
    | readonly (readonly any[])[];
  export type ExportsField =
    | string
    | readonly string[]
    | ExportValueWithFallback
    | ExportMap
    | ExportMapWithFallbacks;
  export type PackageJson = Readonly<{
    name?: string;
    main?: string;
    exports?: ExportsField;
  }>;
  export type PackageInfo = Readonly<{
    packageJson: PackageJson;
    rootPath: string;
  }>;
  export type PackageForModule = Readonly<
    {
      packageRelativePath: string;
    } & PackageInfo
  >;
  /**
   * Check existence of a single file.
   */
  export type DoesFileExist = (filePath: string) => boolean;
  /**
   * Performs a lookup against an absolute or project-relative path to determine
   * whether it exists as a file or directory. Follows any symlinks, and returns
   * a real absolute path on existence.
   */
  export type FileSystemLookup = (absoluteOrProjectRelativePath: string) =>
    | {
        exists: false;
      }
    | {
        exists: true;
        type?: 'f' | 'd';
        realPath: string;
      };
  /**
   * Given a directory path and the base asset name, return a list of all the
   * asset file names that match the given base name in that directory. Return
   * null if there's no such named asset. `platform` is used to identify
   * platform-specific assets, ex. `foo.ios.js` instead of a generic `foo.js`.
   */
  export type ResolveAsset = (
    dirPath: string,
    assetName: string,
    extension: string
  ) => null | undefined | readonly string[];
  export type ResolutionContext = Readonly<{
    allowHaste: boolean;
    assetExts: ReadonlySet<string>;
    customResolverOptions: CustomResolverOptions;
    disableHierarchicalLookup: boolean;
    /**
     * Determine whether a regular file exists at the given path.
     *
     * @deprecated, prefer `fileSystemLookup`
     */
    doesFileExist: DoesFileExist;
    extraNodeModules?: null | {
      [$$Key$$: string]: string;
    };
    /** Is resolving for a development bundle. */
    dev: boolean;
    /**
     * Get the parsed contents of the specified `package.json` file.
     */
    getPackage: (packageJsonPath: string) => null | undefined | PackageJson;
    /**
     * Get the closest package scope, parsed `package.json` and relative subpath
     * for a given absolute candidate path (which need not exist), or null if
     * there is no package.json closer than the nearest node_modules directory.
     *
     * @deprecated See https://github.com/facebook/metro/commit/29c77bff31e2475a086bc3f04073f485da8f9ff0
     */
    getPackageForModule: (absoluteModulePath: string) => null | undefined | PackageForModule;
    /**
     * The dependency descriptor, within the origin module, corresponding to the
     * current resolution request. This is provided for diagnostic purposes ONLY
     * and may not be used for resolution purposes.
     */
    dependency?: TransformResultDependency;
    /**
     * Synchonously returns information about a given absolute path, including
     * whether it exists, whether it is a file or directory, and its absolute
     * real path.
     */
    fileSystemLookup: FileSystemLookup;
    /**
     * The ordered list of fields to read in `package.json` to resolve a main
     * entry point based on the "browser" field spec.
     */
    mainFields: readonly string[];
    /**
     * Full path of the module that is requiring or importing the module to be
     * resolved. This may not be the only place this dependency was found,
     * as resolutions can be cached.
     */
    originModulePath: string;
    nodeModulesPaths: readonly string[];
    preferNativePlatform: boolean;
    resolveAsset: ResolveAsset;
    redirectModulePath: (modulePath: string) => string | false;
    /**
     * Given a name, this should return the full path to the file that provides
     * a Haste module of that name. Ex. for `Foo` it may return `/smth/Foo.js`.
     */
    resolveHasteModule: (name: string) => null | undefined | string;
    /**
     * Given a name, this should return the full path to the package manifest that
     * provides a Haste package of that name. Ex. for `Foo` it may return
     * `/smth/Foo/package.json`.
     */
    resolveHastePackage: (name: string) => null | undefined | string;
    resolveRequest?: null | undefined | CustomResolver;
    sourceExts: readonly string[];
    unstable_conditionNames: readonly string[];
    unstable_conditionsByPlatform: Readonly<{
      [platform: string]: readonly string[];
    }>;
    unstable_enablePackageExports: boolean;
    unstable_logWarning: (message: string) => void;
  }>;
  export type CustomResolutionContext = Readonly<
    {
      resolveRequest: CustomResolver;
    } & ResolutionContext
  >;
  export type CustomResolver = (
    context: CustomResolutionContext,
    moduleName: string,
    platform: string | null
  ) => Resolution;
  export type CustomResolverOptions = {
    readonly [$$Key$$: string]: any;
  };
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro-resolver/src/utils/isAssetFile.js
declare module 'metro-resolver/src/utils/isAssetFile' {
  /**
   * Determine if a file path should be considered an asset file based on the
   * given `assetExts`.
   */
  function isAssetFile(filePath: string, assetExts: ReadonlySet<string>): boolean;
  export default isAssetFile;
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro-resolver/src/utils/toPosixPath.js
declare module 'metro-resolver/src/utils/toPosixPath' {
  /**
   * Replace path separators in the passed string to coerce to a POSIX path. This
   * is a no-op on POSIX systems.
   */
  function toPosixPath(relativePathOrSpecifier: string): string;
  export default toPosixPath;
}
