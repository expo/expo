import commander from 'commander';
import fs from 'fs';
import path from 'path';

import { SupportedPlatform } from '../types';

export interface AutolinkingOptions {
  /** Only scan direct "dependencies" of a project for React Native modules, rather than including transitive dependencies.
   * @remarks
   * Before SDK 54, React Native modules would only be linked if they were listed as dependencies
   * of a project. However, in SDK 54+ transitive React Native modules dependencies are also
   * auto-linked, unless this flag is enabled.
   * @defaultValue `false`
   */
  legacy_shallowReactNativeLinking: boolean;
  /** Extra modules directories to search for native modules.
   * @defaultValue `[]`
   */
  searchPaths: string[];
  /** Local native modules directory to add to autolinking.
   * @defaultValue `"./modules"`
   */
  nativeModulesDir: string | null;
  /** Native modules to exclude from autolinking by name.
   * @defaultValue `[]`
   */
  exclude: string[];
  /** A list of package names to opt out of prebuilt Expo modules (Android-only)
   * @defaultValue `[]`
   */
  buildFromSource?: string[];
  /** CocoaPods flags to pass to each autolinked pod (Apple/iOS-only)
   * @defaultValue `[]`
   */
  flags?: Record<string, any>;
}

const isJSONObject = (x: unknown): x is Record<string, unknown> =>
  x != null && typeof x === 'object';

const resolvePathMaybe = (target: unknown, basePath: string): string | null => {
  if (typeof target !== 'string') {
    return null;
  }
  let resolved = path.resolve(basePath, target);
  if (fs.existsSync(resolved)) {
    return resolved;
  } else if ((resolved = path.resolve(target)) && fs.existsSync(target)) {
    // TODO(@kitten): This is here for legacy support. However, this *will* be inconsistent
    // This relies on the current working directory, and hence, can behave differently depending
    // on where the command was invoked.
    return target;
  } else {
    return null;
  }
};

export const filterMapSearchPaths = (
  searchPaths: unknown,
  basePath: string
): string[] | undefined => {
  if (Array.isArray(searchPaths)) {
    return searchPaths
      .map((searchPath) => resolvePathMaybe(searchPath, basePath))
      .filter((searchPath) => searchPath != null);
  } else {
    return undefined;
  }
};

const parsePackageJsonOptions = (
  packageJson: Record<string, unknown>,
  appRoot: string,
  platform: SupportedPlatform | null | undefined
): Partial<AutolinkingOptions> => {
  const expo = isJSONObject(packageJson.expo) ? packageJson.expo : null;
  const autolinkingOptions = expo && isJSONObject(expo.autolinking) ? expo.autolinking : null;
  let platformOptions: Record<string, unknown> | null = null;
  if (platform) {
    platformOptions =
      autolinkingOptions && isJSONObject(autolinkingOptions[platform])
        ? autolinkingOptions[platform]
        : null;
    if (!platformOptions && platform === 'apple') {
      // NOTE: `platform: 'apple'` has a fallback on `ios`. This doesn't make much sense, since apple should
      // be the base option for other apple platforms, but changing this now is a breaking change
      platformOptions =
        autolinkingOptions && isJSONObject(autolinkingOptions.ios) ? autolinkingOptions.ios : null;
    }
  }
  const mergedOptions = { ...autolinkingOptions, ...platformOptions };
  const outputOptions: Partial<AutolinkingOptions> = {};
  // legacy_shallowReactNativeLinking
  if (mergedOptions.legacy_shallowReactNativeLinking != null) {
    outputOptions.legacy_shallowReactNativeLinking =
      !!mergedOptions.legacy_shallowReactNativeLinking;
  }
  // searchPaths
  if (typeof mergedOptions.searchPaths === 'string' || Array.isArray(mergedOptions.searchPaths)) {
    const rawSearchPaths =
      typeof mergedOptions.searchPaths === 'string'
        ? [mergedOptions.searchPaths]
        : mergedOptions.searchPaths;
    outputOptions.searchPaths = filterMapSearchPaths(rawSearchPaths, appRoot);
  }
  // nativeModulesDir
  if (typeof mergedOptions.nativeModulesDir === 'string') {
    outputOptions.nativeModulesDir = resolvePathMaybe(mergedOptions.nativeModulesDir, appRoot);
  }
  // exclude
  if (Array.isArray(mergedOptions.exclude)) {
    outputOptions.exclude = mergedOptions.exclude.filter((x) => typeof x === 'string');
  }
  // buildFromSource
  if (Array.isArray(mergedOptions.buildFromSource)) {
    outputOptions.buildFromSource = mergedOptions.buildFromSource.filter(
      (x) => typeof x === 'string'
    );
  }
  // flags
  if (isJSONObject(mergedOptions.flags)) {
    outputOptions.flags = { ...mergedOptions.flags };
  }
  return outputOptions;
};

/** Common commandline arguments for autolinking commands (Not to be confused with `AutolinkingOptions` */
export interface AutolinkingCommonArguments {
  projectRoot?: string | null;
  // NOTE(@kitten): These are added to other `searchPaths` entries
  searchPaths?: string[] | null;
  // NOTE(@kitten): These are added to other `exclude` entries
  exclude?: string[] | null;
  platform?: SupportedPlatform | null;
}

export function registerAutolinkingArguments(command: commander.Command): commander.Command {
  return command
    .option<string[] | null>(
      '-e, --exclude <exclude...>',
      'Package names to exclude when looking up for modules.',
      (value, previous) => (previous ?? []).concat(value)
    )
    .option(
      '-p, --platform [platform]',
      'The platform that the resulting modules must support. Available options: "apple", "android"',
      'apple'
    )
    .option(
      // NOTE(@kitten): For backwards-compatibility, this is still called `project-root`, but it
      // really is a replacement path for the current working directory. Henceforth called `commandRoot`
      '--project-root <projectRoot>',
      'The path to the root of the project. Defaults to current working directory',
      process.cwd()
    );
}

interface ArgumentsAutolinkingOptions {
  /** The root directory that will be considered the base path for all other target paths */
  commandRoot: string;
  /** The platform to autolink against. If not passed or unknown, no specific autolinking search logic will be applied */
  platform?: SupportedPlatform;
  /** Added search paths to search for native modules (Usually passed as CLI rest argument. */
  extraSearchPaths?: string[];
  /** Added native module names to exclude from autolined native modules (Usually passed as CLI argument) */
  extraExclude?: string[];
}

const parseExtraArgumentsOptions = (
  args: AutolinkingCommonArguments
): ArgumentsAutolinkingOptions => {
  const cwd = process.cwd();
  const platform = args.platform || undefined;
  const commandRoot = resolvePathMaybe(args.projectRoot, cwd) || cwd;
  const extraSearchPaths = filterMapSearchPaths(args.searchPaths, commandRoot);
  const extraExclude = args.exclude?.filter((name) => typeof name === 'string');
  return {
    platform,
    commandRoot,
    extraSearchPaths,
    extraExclude,
  };
};

const findPackageJsonPathAsync = async (commandRoot: string | null): Promise<string> => {
  const root = commandRoot || process.cwd();
  for (let dir = root; path.dirname(dir) !== dir; dir = path.dirname(dir)) {
    const file = path.resolve(dir, 'package.json');
    if (fs.existsSync(file)) {
      return file;
    }
  }
  throw new Error(`Couldn't find "package.json" up from path "${root}"`);
};

const loadPackageJSONAsync = async (packageJsonPath: string): Promise<Record<string, unknown>> => {
  const packageJsonText = await fs.promises.readFile(packageJsonPath, 'utf8');
  return JSON.parse(packageJsonText);
};

export interface LinkingOptionsLoader {
  getCommandRoot(): string;
  getAppRoot(): Promise<string>;
  getPlatformOptions<T extends SupportedPlatform | undefined>(
    platform: T
  ): Promise<AutolinkingOptions & { platform: T }>;
  getPlatformOptions(): Promise<AutolinkingOptions>;
}

export function createAutolinkingOptionsLoader(
  argumentsOptions?: AutolinkingCommonArguments
): LinkingOptionsLoader {
  const extraArgumentsOptions = parseExtraArgumentsOptions(argumentsOptions ?? {});
  const { commandRoot } = extraArgumentsOptions;

  let _packageJsonPath$: Promise<string> | undefined;
  const getPackageJsonPath = () => {
    return _packageJsonPath$ || (_packageJsonPath$ = findPackageJsonPathAsync(commandRoot));
  };

  let _packageJson$: Promise<Record<string, unknown>> | undefined;
  const getPackageJson = async () =>
    _packageJson$ || (_packageJson$ = loadPackageJSONAsync(await getPackageJsonPath()));

  const getAppRoot = async () => path.dirname(await getPackageJsonPath());

  return {
    getCommandRoot: () => commandRoot,
    getAppRoot,
    async getPlatformOptions(platform = extraArgumentsOptions.platform) {
      const packageJson = await getPackageJson();
      const appRoot = await getAppRoot();
      const options = parsePackageJsonOptions(packageJson, appRoot, platform);

      if (extraArgumentsOptions.extraSearchPaths) {
        options.searchPaths = [
          ...extraArgumentsOptions.extraSearchPaths,
          ...(options.searchPaths ?? []),
        ];
      }
      if (extraArgumentsOptions.extraExclude) {
        options.exclude = [...(options.exclude ?? []), ...extraArgumentsOptions.extraExclude];
      }

      return {
        ...normalizeAutolinkingOptions(options, appRoot),
        platform,
      };
    },
  };
}

const normalizeAutolinkingOptions = (
  options: Partial<AutolinkingOptions>,
  appRoot: string
): AutolinkingOptions => {
  return {
    legacy_shallowReactNativeLinking: options.legacy_shallowReactNativeLinking ?? false,
    searchPaths: options.searchPaths ?? [],
    nativeModulesDir: options.nativeModulesDir
      ? (resolvePathMaybe(options.nativeModulesDir, appRoot) ?? null)
      : (resolvePathMaybe('./modules', appRoot) ?? null),
    exclude: options.exclude ?? [],
    buildFromSource: options.buildFromSource,
    flags: options.flags,
  };
};
