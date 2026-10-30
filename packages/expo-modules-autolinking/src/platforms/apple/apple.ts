import spawnAsync from '@expo/spawn-async';
import fs from 'fs';
import path from 'path';

import type { AutolinkingOptions } from '../../commands/autolinkingOptions';
import {
  getIosInlineModulesClassNames,
  isTargetInInlineModulesTargets,
} from '../../inlineModules/iosInlineModules';
import {
  LOCAL_PACKAGE_NAME,
  type AppleCodeSignEntitlements,
  type ExtraDependencies,
  type ModuleDescriptorIos,
  type ModuleIosConfig,
  type ModuleIosPodspecInfo,
  type PackageRevision,
  type SearchResults,
  type SupportedPlatform,
} from '../../types';
import { listFilesInDirectories, fileExistsAsync } from '../../utils';
import {
  collectPackageRoots,
  groupScannedModules,
  loadModulesScanner,
  scanExpoModulesAsync,
} from './moduleScanner';

const APPLE_PROPERTIES_FILE = 'Podfile.properties.json';
const APPLE_EXTRA_BUILD_DEPS_KEY = 'apple.extraPods';

interface AppleConfigurationOutput {
  buildFromSource: string[];
}

export function getConfiguration(
  options: AutolinkingOptions
): AppleConfigurationOutput | undefined {
  return options.buildFromSource ? { buildFromSource: options.buildFromSource } : undefined;
}

const indent = '  ';

/** Find all *.podspec files in top-level directories */
async function findPodspecFiles(revision: PackageRevision): Promise<string[]> {
  const configPodspecPaths = revision.config?.applePodspecPaths();
  if (configPodspecPaths && configPodspecPaths.length) {
    return configPodspecPaths;
  } else {
    return await listFilesInDirectories(revision.path, (basename) => basename.endsWith('.podspec'));
  }
}

export function getSwiftModuleNames(
  pods: ModuleIosPodspecInfo[],
  swiftModuleNames: string[] | undefined
): string[] {
  if (swiftModuleNames && swiftModuleNames.length) {
    return swiftModuleNames;
  }
  // by default, non-alphanumeric characters in the pod name are replaced by _ in the module name
  return pods.map((pod) => pod.podName.replace(/[^a-zA-Z0-9]/g, '_'));
}

/**
 * Scans all packages for `@ExpoModule` classes that compile for the given platform, in one scanner
 * run. Returns the classes by package name, or null when the scan is unavailable or fails.
 */
export async function scanNativeModulesAsync(
  searchResults: SearchResults,
  platform: SupportedPlatform
): Promise<Record<string, ModuleIosConfig[]> | null> {
  // The scanner is a macOS binary.
  if (process.platform !== 'darwin') {
    return null;
  }
  // Without expo-modules-core nothing can use the macro.
  const coreRevision = searchResults['expo-modules-core'];
  if (!coreRevision) {
    return null;
  }
  const scanner = loadModulesScanner(coreRevision.path);
  if (!scanner) {
    console.warn(
      `warning: Couldn't load expo-modules-macros from ${coreRevision.path}, so only modules declared in expo-module.config.json will be linked. Reinstall your JavaScript dependencies to restore it.`
    );
    return null;
  }

  const packageRoots = collectPackageRoots(searchResults);
  const output = await scanExpoModulesAsync(scanner, packageRoots);
  return output ? groupScannedModules(output, packageRoots, platform) : null;
}

/**
 * The declared modules when the config declares the list (even an empty one), otherwise the scanned
 * classes sorted by code unit.
 */
function pickModules(
  declaredModules: ModuleIosConfig[] | null,
  scannedModules: ModuleIosConfig[]
): ModuleIosConfig[] {
  if (declaredModules) {
    return declaredModules;
  }
  return [...scannedModules].sort((a, b) => (a.class < b.class ? -1 : a.class > b.class ? 1 : 0));
}

/** Resolves module search result with additional details required for iOS platform. */
export async function resolveModuleAsync(
  packageName: string,
  revision: PackageRevision,
  extraOutput: {
    flags?: Record<string, any>;
    scannedModules?: Record<string, ModuleIosConfig[]> | null;
  }
): Promise<ModuleDescriptorIos | null> {
  const podspecFiles = await findPodspecFiles(revision);
  if (!podspecFiles.length) {
    return null;
  }

  const pods = podspecFiles.map((podspecFile) => ({
    podName: path.basename(podspecFile, path.extname(podspecFile)),
    podspecDir: path.dirname(path.join(revision.path, podspecFile)),
  }));

  const swiftModuleNames = getSwiftModuleNames(pods, revision.config?.appleSwiftModuleNames());
  const coreFeatures = revision.config?.coreFeatures() ?? [];

  const configModules =
    revision.config
      ?.appleModules()
      .map((module) => (typeof module === 'string' ? { name: null, class: module } : module)) ?? [];

  const declaresModules = revision.config?.declaresAppleModules() ?? false;
  const modules = pickModules(
    declaresModules ? configModules : null,
    extraOutput.scannedModules?.[packageName] ?? []
  );

  return {
    packageName,
    ...(revision.isLocal ? { exportedPackageName: LOCAL_PACKAGE_NAME } : {}),
    pods,
    swiftModuleNames,
    flags: extraOutput.flags,
    modules,
    ...(!declaresModules && modules.length > 0 ? { modulesFromScan: true } : {}),
    appDelegateSubscribers: revision.config?.appleAppDelegateSubscribers() ?? [],
    reactDelegateHandlers: revision.config?.appleReactDelegateHandlers() ?? [],
    debugOnly: revision.config?.appleDebugOnly() ?? false,
    ...(coreFeatures.length > 0 ? { coreFeatures } : {}),
  };
}

export async function resolveExtraBuildDependenciesAsync(
  projectNativeRoot: string
): Promise<ExtraDependencies | null> {
  const propsFile = path.join(projectNativeRoot, APPLE_PROPERTIES_FILE);
  try {
    const contents = await fs.promises.readFile(propsFile, 'utf8');
    const podfileJson = JSON.parse(contents);
    if (podfileJson[APPLE_EXTRA_BUILD_DEPS_KEY]) {
      // expo-build-properties would serialize the extraPods as JSON string, we should parse it again.
      const extraPods = JSON.parse(podfileJson[APPLE_EXTRA_BUILD_DEPS_KEY]);
      return extraPods;
    }
  } catch {}
  return null;
}

interface GenerateModulesProviderParams {
  watchedDirectories: string[];
  inlineModulesTargets: { mainTarget?: string; targets: string[] };
  targetPath: string;
  targetName?: string;
  appRoot: string;
  /** Version of the installed `expo-modules-core`. The provider has `packages` only when it supports them. */
  coreVersion?: string | null;
}

/**
 * The first `expo-modules-core` version with `ExpoPackage` and `ModulesProvider.packages`. A provider that overrides
 * `packages` doesn't compile against an older core.
 */
const MIN_CORE_VERSION_WITH_PACKAGES = '58.0.30';

/**
 * Returns whether the `expo-modules-core` version supports `packages` in the modules provider. A missing version,
 * or one that can't be parsed, doesn't. A prerelease of the minimum version doesn't either.
 */
export function coreSupportsPackages(coreVersion: string | null | undefined): boolean {
  const version = parseVersion(coreVersion);
  const minVersion = parseVersion(MIN_CORE_VERSION_WITH_PACKAGES)!;
  if (!version) {
    return false;
  }
  for (let i = 0; i < 3; i++) {
    if (version.numbers[i] !== minVersion.numbers[i]) {
      return version.numbers[i]! > minVersion.numbers[i]!;
    }
  }
  return !version.prerelease;
}

function parseVersion(
  version: string | null | undefined
): { numbers: number[]; prerelease: boolean } | null {
  const match = version?.match(/^(\d+)\.(\d+)\.(\d+)(-[0-9A-Za-z.-]+)?(\+[0-9A-Za-z.-]+)?$/);
  if (!match) {
    return null;
  }
  return {
    numbers: [Number(match[1]), Number(match[2]), Number(match[3])],
    prerelease: !!match[4],
  };
}
/**
 * Generates Swift file that contains all autolinked Swift packages.
 */
export async function generateModulesProviderAsync(
  modules: ModuleDescriptorIos[],
  targetPath: string,
  entitlementPath: string | null,
  params: GenerateModulesProviderParams
): Promise<void> {
  const className = path.basename(targetPath, path.extname(targetPath));
  const entitlements = await parseEntitlementsAsync(entitlementPath);
  const generatedFileContent = await generatePackageListFileContentAsync(
    modules,
    className,
    entitlements,
    params
  );
  const parentPath = path.dirname(targetPath);

  // Avoid writing the file if the content hasn't changed to prevent unnecessary recompilation.
  try {
    const existingContent = await fs.promises.readFile(targetPath, 'utf8');
    if (existingContent === generatedFileContent) {
      return;
    }
  } catch {}

  await fs.promises.mkdir(parentPath, { recursive: true });
  await fs.promises.writeFile(targetPath, generatedFileContent, 'utf8');
}

/**
 * Generates the string to put into the generated package list.
 */
async function generatePackageListFileContentAsync(
  modules: ModuleDescriptorIos[],
  className: string,
  entitlements: AppleCodeSignEntitlements,
  params: GenerateModulesProviderParams
): Promise<string> {
  const iosModules = modules.filter(
    (module) =>
      module.modules.length ||
      module.appDelegateSubscribers.length ||
      module.reactDelegateHandlers.length
  );

  const modulesToImport = iosModules.filter((module) => !module.debugOnly);
  const debugOnlyModules = iosModules.filter((module) => module.debugOnly);

  const swiftModules = ([] as string[])
    .concat(...modulesToImport.map((module) => module.swiftModuleNames))
    .filter(Boolean);

  const debugOnlySwiftModules = ([] as string[])
    .concat(...debugOnlyModules.map((module) => module.swiftModuleNames))
    .filter(Boolean);

  let modulesClassNames = ([] as ModuleIosConfig[])
    .concat(...modulesToImport.map((module) => module.modules))
    .filter(Boolean);
  const packages = groupByPackage(modulesToImport);

  if (isTargetInInlineModulesTargets(params)) {
    const inlineModules = await getIosInlineModulesClassNames(params);
    modulesClassNames = modulesClassNames.concat(inlineModules.modules);
    addToPackage(packages, LOCAL_PACKAGE_NAME, inlineModules.expoModules);
  }

  const debugOnlyModulesClassNames = ([] as ModuleIosConfig[])
    .concat(...debugOnlyModules.map((module) => module.modules))
    .filter(Boolean);
  const debugOnlyPackages = groupByPackage(debugOnlyModules);

  const appDelegateSubscribers = ([] as string[]).concat(
    ...modulesToImport.map((module) => module.appDelegateSubscribers)
  );

  const debugOnlyAppDelegateSubscribers = ([] as string[]).concat(
    ...debugOnlyModules.map((module) => module.appDelegateSubscribers)
  );

  const reactDelegateHandlerModules = modulesToImport.filter(
    (module) => !!module.reactDelegateHandlers.length
  );

  const debugOnlyReactDelegateHandlerModules = debugOnlyModules.filter(
    (module) => !!module.reactDelegateHandlers.length
  );

  return `/**
 * Automatically generated by expo-modules-autolinking.
 *
 * This autogenerated class provides a list of classes of native Expo modules,
 * but only these that are written in Swift and use the new API for creating Expo modules.
 */

internal import ExpoModulesCore
${generateCommonImportList(swiftModules)}
${generateDebugOnlyImportList(debugOnlySwiftModules)}
@objc(${className})
internal class ${className}: ModulesProvider {
${coreSupportsPackages(params.coreVersion) ? generatePackagesProperty(packages, debugOnlyPackages) : ''}  public override func getModuleClasses() -> [ExpoModuleTupleType] {
${generateModuleClasses(modulesClassNames, debugOnlyModulesClassNames)}
  }

  public override func getAppDelegateSubscribers() -> [ExpoAppDelegateSubscriber.Type] {
${generateClasses(appDelegateSubscribers, debugOnlyAppDelegateSubscribers)}
  }

  public override func getReactDelegateHandlers() -> [ExpoReactDelegateHandlerTupleType] {
${generateReactDelegateHandlers(reactDelegateHandlerModules, debugOnlyReactDelegateHandlerModules)}
  }

  public override func getAppCodeSignEntitlements() -> AppCodeSignEntitlements {
    return AppCodeSignEntitlements.from(json: #"${JSON.stringify(entitlements)}"#)
  }
}
`;
}

function generateCommonImportList(swiftModules: string[]): string {
  return swiftModules.map((moduleName) => `internal import ${moduleName}`).join('\n');
}

function generateDebugOnlyImportList(swiftModules: string[]): string {
  if (!swiftModules.length) {
    return '';
  }

  return (
    wrapInDebugConfigurationCheck(
      0,
      swiftModules.map((moduleName) => `internal import ${moduleName}`).join('\n')
    ) + '\n'
  );
}

function generateModuleClasses(
  modules: ModuleIosConfig[],
  debugOnlyModules: ModuleIosConfig[]
): string {
  const commonClassNames = formatArrayOfModuleTuples(modules);
  if (debugOnlyModules.length > 0) {
    return wrapInDebugConfigurationCheck(
      2,
      `return ${formatArrayOfModuleTuples(modules.concat(debugOnlyModules))}`,
      `return ${commonClassNames}`
    );
  } else {
    return `${indent.repeat(2)}return ${commonClassNames}`;
  }
}

/**
 * Formats an array of modules config to Swift's array of module tuples.
 */
function formatArrayOfModuleTuples(modules: ModuleIosConfig[]): string {
  return `[${modules.map((module) => `\n${indent.repeat(3)}(module: ${module.class}.self, name: ${module.name ? `"${module.name}"` : 'nil'})`).join(',')}
${indent.repeat(2)}]`;
}

interface PackageExports {
  modules: ModuleIosConfig[];
}

/**
 * Groups the modules that `scan-modules` found by the package they are exported in: the npm package name,
 * or the name that the descriptor overrides it with (for example, for local modules).
 */
function groupByPackage(modules: ModuleDescriptorIos[]): Map<string, PackageExports> {
  const packages = new Map<string, PackageExports>();
  for (const module of modules.filter((module) => module.modulesFromScan)) {
    addToPackage(packages, module.exportedPackageName ?? module.packageName, module.modules);
  }
  return packages;
}

function addToPackage(
  packages: Map<string, PackageExports>,
  packageName: string,
  modules: ModuleIosConfig[]
) {
  if (!modules.length) {
    return;
  }
  const exports = packages.get(packageName) ?? { modules: [] };
  exports.modules.push(...modules);
  packages.set(packageName, exports);
}

/**
 * Generates the `packages` property, followed by an empty line.
 */
function generatePackagesProperty(
  packages: Map<string, PackageExports>,
  debugOnlyPackages: Map<string, PackageExports>
): string {
  return `${indent}public override var packages: [String: ExpoPackage] {
${generatePackages(packages, debugOnlyPackages)}
${indent}}

`;
}

function generatePackages(
  packages: Map<string, PackageExports>,
  debugOnlyPackages: Map<string, PackageExports>
): string {
  const commonPackages = formatPackages(packages);
  if (debugOnlyPackages.size > 0) {
    const allPackages = new Map(
      [...packages].map(([packageName, { modules }]) => [packageName, { modules: [...modules] }])
    );
    for (const [packageName, { modules }] of debugOnlyPackages) {
      addToPackage(allPackages, packageName, modules);
    }
    return wrapInDebugConfigurationCheck(
      2,
      `return ${formatPackages(allPackages)}`,
      `return ${commonPackages}`
    );
  } else {
    return `${indent.repeat(2)}return ${commonPackages}`;
  }
}

/**
 * Orders the package names with the local package first, then the others by code unit, independent of the host locale.
 */
function comparePackageNames(a: string, b: string): number {
  if ((a === LOCAL_PACKAGE_NAME) !== (b === LOCAL_PACKAGE_NAME)) {
    return a === LOCAL_PACKAGE_NAME ? -1 : 1;
  }
  return a < b ? -1 : a > b ? 1 : 0;
}

/**
 * Formats the packages to a Swift dictionary of `ExpoPackage` keyed by the package name, with the local
 * package first.
 */
function formatPackages(packages: Map<string, PackageExports>): string {
  if (!packages.size) {
    return '[:]';
  }
  const sortedPackages = [...packages].sort(([a], [b]) => comparePackageNames(a, b));
  const entries = sortedPackages.map(([packageName, { modules }]) => {
    const moduleClassNames = formatInlineArrayOfClassNames(modules.map((module) => module.class));
    return `\n${indent.repeat(3)}"${packageName}": ExpoPackage(\n${indent.repeat(4)}modules: ${moduleClassNames}\n${indent.repeat(3)})`;
  });
  return `[${entries.join(',')}\n${indent.repeat(2)}]`;
}

function generateClasses(classNames: string[], debugOnlyClassName: string[]): string {
  const commonClassNames = formatArrayOfClassNames(classNames);
  if (debugOnlyClassName.length > 0) {
    return wrapInDebugConfigurationCheck(
      2,
      `return ${formatArrayOfClassNames(classNames.concat(debugOnlyClassName))}`,
      `return ${commonClassNames}`
    );
  } else {
    return `${indent.repeat(2)}return ${commonClassNames}`;
  }
}

/**
 * Formats an array of class names to Swift's array containing these classes.
 */
function formatArrayOfClassNames(classNames: string[]): string {
  return `[${classNames.map((className) => `\n${indent.repeat(3)}${className}.self`).join(',')}
${indent.repeat(2)}]`;
}

/**
 * Formats an array of class names to a Swift array on one line, for example `[FooModule.self, BarModule.self]`.
 */
function formatInlineArrayOfClassNames(classNames: string[]): string {
  return `[${classNames.map((className) => `${className}.self`).join(', ')}]`;
}

function generateReactDelegateHandlers(
  module: ModuleDescriptorIos[],
  debugOnlyModules: ModuleDescriptorIos[]
): string {
  const commonModules = formatArrayOfReactDelegateHandler(module);
  if (debugOnlyModules.length > 0) {
    return wrapInDebugConfigurationCheck(
      2,
      `return ${formatArrayOfReactDelegateHandler(module.concat(debugOnlyModules))}`,
      `return ${commonModules}`
    );
  } else {
    return `${indent.repeat(2)}return ${commonModules}`;
  }
}

/**
 * Formats an array of modules to Swift's array containing ReactDelegateHandlers
 */
export function formatArrayOfReactDelegateHandler(modules: ModuleDescriptorIos[]): string {
  const values: string[] = [];
  for (const module of modules) {
    for (const handler of module.reactDelegateHandlers) {
      values.push(`(packageName: "${module.packageName}", handler: ${handler}.self)`);
    }
  }
  return `[${values.map((value) => `\n${indent.repeat(3)}${value}`).join(',')}
${indent.repeat(2)}]`;
}

function wrapInDebugConfigurationCheck(
  indentationLevel: number,
  debugBlock: string,
  releaseBlock: string | null = null
) {
  if (releaseBlock) {
    return `${indent.repeat(indentationLevel)}#if EXPO_CONFIGURATION_DEBUG\n${indent.repeat(
      indentationLevel
    )}${debugBlock}\n${indent.repeat(indentationLevel)}#else\n${indent.repeat(
      indentationLevel
    )}${releaseBlock}\n${indent.repeat(indentationLevel)}#endif`;
  }

  return `${indent.repeat(indentationLevel)}#if EXPO_CONFIGURATION_DEBUG\n${indent.repeat(
    indentationLevel
  )}${debugBlock}\n${indent.repeat(indentationLevel)}#endif`;
}

async function parseEntitlementsAsync(
  entitlementPath: string | null
): Promise<AppleCodeSignEntitlements> {
  if (!entitlementPath || !(await fileExistsAsync(entitlementPath))) {
    return {};
  }
  const { stdout } = await spawnAsync('plutil', ['-convert', 'json', '-o', '-', entitlementPath]);
  const entitlementsJson = JSON.parse(stdout);
  return {
    appGroups: entitlementsJson['com.apple.security.application-groups'] || undefined,
  };
}
