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
import { fileExistsAsync, isPathInside, listFilesInDirectories, maybeRealpath } from '../../utils';
import {
  collectPackageRoots,
  groupScannedPackageClasses,
  loadModulesScanner,
  scanExpoModulesAsync,
  type PackageClass,
  type ScannedPackageClasses,
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
 * Scans all packages for `@ExpoModule`, `@SharedObject` and `@ExpoView` classes that compile for the given
 * platform, in one scanner run. Returns the classes by package name, or null when the scan is unavailable or fails.
 */
export async function scanNativeModulesAsync(
  searchResults: SearchResults,
  platform: SupportedPlatform
): Promise<ScannedPackageClasses | null> {
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
  return output ? groupScannedPackageClasses(output, packageRoots, platform) : null;
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

/**
 * Splits a class name such as `ExpoFoo::FooModule` or `ExpoFoo.FooModule` into the Swift module name and the class
 * name. The module name is null when the class name isn't qualified.
 */
function splitQualifiedClassName(qualifiedClassName: string): [string | null, string] {
  const selectorIndex = qualifiedClassName.lastIndexOf('::');
  if (selectorIndex !== -1) {
    return [
      qualifiedClassName.slice(0, selectorIndex),
      qualifiedClassName.slice(selectorIndex + 2),
    ];
  }
  const separatorIndex = qualifiedClassName.lastIndexOf('.');
  if (separatorIndex === -1) {
    return [null, qualifiedClassName];
  }
  return [
    qualifiedClassName.slice(0, separatorIndex),
    qualifiedClassName.slice(separatorIndex + 1),
  ];
}

/**
 * Returns a function that qualifies a class name of the package with its Swift module, as in
 * `ExpoFoo::FooModule`. The generated provider imports the Swift modules of all packages and is compiled in the
 * app target, so a bare name is ambiguous when two packages have a class of that name, and a type of that name in
 * the app target shadows it. A module selector (`Module::Class`, Swift 6.3) also works when the module has a type
 * named like the module, unlike `Module.Class`.
 *
 * The class is qualified with the only Swift module of the package. In a package with several Swift modules, it's
 * qualified with the module of the pod in the closest directory above its source file, when that pod is the only
 * one there and its module name comes from the pod name. Otherwise, and for a class name that's already qualified,
 * the name stays as it is.
 */
async function createClassNameQualifierAsync(
  pods: ModuleIosPodspecInfo[],
  swiftModuleNames: string[],
  podsHaveOwnSwiftModuleNames: boolean
): Promise<(className: string, file?: string) => string> {
  // The scanner reports real paths.
  const podDirs = await Promise.all(
    pods.map(async (pod) => (await maybeRealpath(pod.podspecDir)) ?? path.resolve(pod.podspecDir))
  );

  const findSwiftModuleName = (file: string | undefined): string | null => {
    if (swiftModuleNames.length === 1) {
      return swiftModuleNames[0] ?? null;
    }
    if (!file || !podsHaveOwnSwiftModuleNames) {
      return null;
    }
    const containingDirs = podDirs.filter((podDir) => isPathInside(file, podDir));
    const closestDir = containingDirs.reduce<string | null>(
      (closest, podDir) => (closest && closest.length >= podDir.length ? closest : podDir),
      null
    );
    const closestPodIndices = podDirs.flatMap((podDir, index) =>
      podDir === closestDir ? [index] : []
    );
    return closestPodIndices.length === 1
      ? (swiftModuleNames[closestPodIndices[0]!] ?? null)
      : null;
  };

  return (className, file) => {
    if (splitQualifiedClassName(className)[0] !== null) {
      return className;
    }
    const swiftModuleName = findSwiftModuleName(file);
    return swiftModuleName ? `${swiftModuleName}::${className}` : className;
  };
}

/** Resolves module search result with additional details required for iOS platform. */
export async function resolveModuleAsync(
  packageName: string,
  revision: PackageRevision,
  extraOutput: {
    flags?: Record<string, any>;
    scannedModules?: ScannedPackageClasses | null;
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

  const qualify = await createClassNameQualifierAsync(
    pods,
    swiftModuleNames,
    !revision.config?.appleSwiftModuleNames().length
  );
  const qualifyScanned = ({ name, file }: PackageClass) => qualify(name, file);

  const scannedModules = extraOutput.scannedModules?.modules[packageName] ?? [];
  const expoSharedObjects = (extraOutput.scannedModules?.sharedObjects[packageName] ?? []).map(
    qualifyScanned
  );
  const expoViews = (extraOutput.scannedModules?.views[packageName] ?? []).map(qualifyScanned);
  // A null name keeps the module's own name, as for config-declared string entries.
  const pickedModules = pickModules(
    revision.config?.declaresAppleModules() ? configModules : null,
    scannedModules.map((module) => ({ name: null, class: module.name }))
  );
  // A module that the config declares is declared with the macro too when the scan found it. The config can
  // qualify the class with the Swift module of the package, as in `ExpoFoo::FooModule`.
  const scannedFiles = new Map(scannedModules.map((module) => [module.name, module.file]));
  const isExpoModule = (module: ModuleIosConfig) => {
    const [swiftModuleName, className] = splitQualifiedClassName(module.class);
    return (
      scannedFiles.has(className) &&
      (swiftModuleName === null || swiftModuleNames.includes(swiftModuleName))
    );
  };
  const qualifyModule = (module: ModuleIosConfig): ModuleIosConfig => ({
    ...module,
    class: qualify(module.class, scannedFiles.get(module.class)),
  });
  const modules = pickedModules.map(qualifyModule);
  const expoModules = pickedModules.filter(isExpoModule).map(qualifyModule);

  return {
    packageName,
    ...(revision.isLocal ? { exportedPackageName: LOCAL_PACKAGE_NAME } : {}),
    pods,
    swiftModuleNames,
    flags: extraOutput.flags,
    modules,
    ...(expoModules.length > 0 ? { expoModules } : {}),
    ...(expoSharedObjects.length > 0 ? { expoSharedObjects } : {}),
    ...(expoViews.length > 0 ? { expoViews } : {}),
    appDelegateSubscribers: (revision.config?.appleAppDelegateSubscribers() ?? []).map(
      (className) => qualify(className)
    ),
    reactDelegateHandlers: (revision.config?.appleReactDelegateHandlers() ?? []).map((className) =>
      qualify(className)
    ),
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
  /** Path to the installed `expo-modules-core`. The provider has `packages` only when that core supports them. */
  corePath?: string | null;
}

/**
 * Returns whether the `expo-modules-core` at the given path has `ExpoPackage` and `ModulesProvider.packages`.
 * A provider that overrides `packages` doesn't compile against an older core, which has no `ExpoPackage.swift`.
 */
export async function coreSupportsPackagesAsync(
  corePath: string | null | undefined
): Promise<boolean> {
  if (!corePath) {
    return false;
  }
  return !!(await fileExistsAsync(path.join(corePath, 'ios', 'Core', 'ExpoPackage.swift')));
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
      module.expoSharedObjects?.length ||
      module.expoViews?.length ||
      module.appDelegateSubscribers.length ||
      module.reactDelegateHandlers.length
  );

  const modulesToImport = iosModules.filter((module) => !module.debugOnly);
  const debugOnlyModules = iosModules.filter((module) => module.debugOnly);

  const swiftModules = ([] as string[])
    .concat(...modulesToImport.map((module) => module.swiftModuleNames))
    .filter(Boolean);

  let modulesClassNames = ([] as ModuleIosConfig[])
    .concat(...modulesToImport.map((module) => module.modules))
    .filter(Boolean);
  const packages = groupByPackage(modulesToImport);

  if (isTargetInInlineModulesTargets(params)) {
    const inlineModules = await getIosInlineModulesClassNames(params);
    modulesClassNames = modulesClassNames.concat(inlineModules.modules);
    addToPackage(packages, LOCAL_PACKAGE_NAME, { modules: inlineModules.expoModules });
  }

  const supportsPackages = await coreSupportsPackagesAsync(params.corePath);

  const appDelegateSubscribers = ([] as string[]).concat(
    ...modulesToImport.map((module) => module.appDelegateSubscribers)
  );

  const reactDelegateHandlerModules = modulesToImport.filter(
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

@objc(${className})
internal class ${className}: ModulesProvider {
${supportsPackages ? generatePackagesProperty(packages, groupDebugOnlyLookupsByPackage(debugOnlyModules)) : ''}  public override func getModuleClasses() -> [ExpoModuleTupleType] {
${generateModuleClasses(modulesClassNames, debugOnlyModules)}
  }

  public override func getAppDelegateSubscribers() -> [ExpoAppDelegateSubscriber.Type] {
${generateClasses(appDelegateSubscribers, debugOnlyModules)}
  }

  public override func getReactDelegateHandlers() -> [ExpoReactDelegateHandlerTupleType] {
${generateReactDelegateHandlers(reactDelegateHandlerModules, debugOnlyModules)}
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

/**
 * Formats a Swift expression that finds a debug-only class by its runtime name, as an optional of the given type.
 * The provider can't reference the class: in Release, a debug-only package built with SwiftPM is an empty
 * framework with the same Swift module, and a reference to its class fails to link. An unqualified class is looked
 * up in each Swift module of the package.
 */
function formatClassLookup(className: string, swiftModuleNames: string[], type: string): string {
  const [swiftModuleName, name] = splitQualifiedClassName(className);
  const candidateModuleNames = swiftModuleName ? [swiftModuleName] : swiftModuleNames;
  const runtimeNames = candidateModuleNames.length
    ? candidateModuleNames.map((moduleName) => `${moduleName}.${name}`)
    : [name];
  return runtimeNames
    .map((runtimeName) => `NSClassFromString("${runtimeName}") as? ${type}`)
    .join(' ?? ');
}

interface DebugOnlyEntry {
  lookup: string;
  /** The array element, made of the class that the lookup `found`. */
  entry: string;
}

function formatReturnOfEntries(
  variableName: string,
  arrayType: string,
  commonEntries: string,
  debugOnlyEntries: DebugOnlyEntry[]
): string {
  if (!debugOnlyEntries.length) {
    return `${indent.repeat(2)}return ${commonEntries}`;
  }
  const appends = debugOnlyEntries.map(
    ({ lookup, entry }) =>
      `${indent.repeat(2)}if let found = ${lookup} {\n${indent.repeat(3)}${variableName}.append(${entry})\n${indent.repeat(2)}}`
  );
  return [
    `${indent.repeat(2)}var ${variableName}: ${arrayType} = ${commonEntries}`,
    ...appends,
    `${indent.repeat(2)}return ${variableName}`,
  ].join('\n');
}

function generateModuleClasses(
  modules: ModuleIosConfig[],
  debugOnlyModules: ModuleDescriptorIos[]
): string {
  return formatReturnOfEntries(
    'moduleClasses',
    '[ExpoModuleTupleType]',
    formatArrayOfModuleTuples(modules),
    debugOnlyModules.flatMap(({ modules, swiftModuleNames }) =>
      modules.map((module) => ({
        lookup: formatClassLookup(module.class, swiftModuleNames, 'AnyModule.Type'),
        entry: `(module: found, name: ${module.name ? `"${module.name}"` : 'nil'})`,
      }))
    )
  );
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
  /** Names of the `@SharedObject` classes. */
  sharedObjects: string[];
  /** Names of the `@ExpoView` classes. */
  views: string[];
}

/**
 * Groups the classes declared with the `@ExpoModule`, `@SharedObject` and `@ExpoView` macros by the package they
 * are exported in: the npm package name, or the name that the descriptor overrides it with (for example, for local
 * modules).
 */
function groupByPackage(modules: ModuleDescriptorIos[]): Map<string, PackageExports> {
  const packages = new Map<string, PackageExports>();
  for (const module of modules) {
    addToPackage(packages, module.exportedPackageName ?? module.packageName, {
      modules: module.expoModules,
      sharedObjects: module.expoSharedObjects,
      views: module.expoViews,
    });
  }
  return packages;
}

function addToPackage(
  packages: Map<string, PackageExports>,
  packageName: string,
  { modules = [], sharedObjects = [], views = [] }: Partial<PackageExports>
) {
  if (!modules.length && !sharedObjects.length && !views.length) {
    return;
  }
  const exports = packages.get(packageName) ?? { modules: [], sharedObjects: [], views: [] };
  exports.modules.push(...modules);
  exports.sharedObjects.push(...sharedObjects);
  exports.views.push(...views);
  packages.set(packageName, exports);
}

/** Swift expressions that look up the debug-only classes of a package, by the list they belong to. */
type PackageExportLookups = Record<keyof PackageExports, string[]>;

function groupDebugOnlyLookupsByPackage(
  modules: ModuleDescriptorIos[]
): Map<string, PackageExportLookups> {
  const packages = new Map<string, PackageExportLookups>();
  for (const module of modules) {
    const lookUp = (classNames: string[] = [], type: string) =>
      classNames.map((className) => formatClassLookup(className, module.swiftModuleNames, type));
    const modulesLookups = lookUp(
      module.expoModules?.map((expoModule) => expoModule.class),
      'AnyModule.Type'
    );
    const sharedObjectsLookups = lookUp(module.expoSharedObjects, 'SharedObject.Type');
    const viewsLookups = lookUp(module.expoViews, 'any AnyNativeView.Type');
    if (!modulesLookups.length && !sharedObjectsLookups.length && !viewsLookups.length) {
      continue;
    }
    const packageName = module.exportedPackageName ?? module.packageName;
    const lookups = packages.get(packageName) ?? { modules: [], sharedObjects: [], views: [] };
    lookups.modules.push(...modulesLookups);
    lookups.sharedObjects.push(...sharedObjectsLookups);
    lookups.views.push(...viewsLookups);
    packages.set(packageName, lookups);
  }
  return packages;
}

const addDebugOnlyExportsFunction = `${indent}private func addDebugOnlyExports(
${indent.repeat(2)}to packages: inout [String: ExpoPackage],
${indent.repeat(2)}packageName: String,
${indent.repeat(2)}modules: [AnyModule.Type?] = [],
${indent.repeat(2)}sharedObjects: [SharedObject.Type?] = [],
${indent.repeat(2)}views: [(any AnyNativeView.Type)?] = []
${indent}) {
${indent.repeat(2)}let commonPackage = packages[packageName]
${indent.repeat(2)}let package = ExpoPackage(
${indent.repeat(3)}modules: (commonPackage?.modules ?? []) + modules.compactMap { $0 },
${indent.repeat(3)}sharedObjects: (commonPackage?.sharedObjects ?? []) + sharedObjects.compactMap { $0 },
${indent.repeat(3)}views: (commonPackage?.views ?? []) + views.compactMap { $0 }
${indent.repeat(2)})
${indent.repeat(2)}if !package.modules.isEmpty || !package.sharedObjects.isEmpty || !package.views.isEmpty {
${indent.repeat(3)}packages[packageName] = package
${indent.repeat(2)}}
${indent}}
`;

function formatDebugOnlyExports(packageName: string, lookups: PackageExportLookups): string {
  // Swift needs the labelled arguments in their declaration order.
  const labels: (keyof PackageExportLookups)[] = ['modules', 'sharedObjects', 'views'];
  const args = labels
    .filter((label) => lookups[label].length > 0)
    .map((label) => `,\n${indent.repeat(3)}${label}: [${lookups[label].join(', ')}]`);
  return `${indent.repeat(2)}addDebugOnlyExports(
${indent.repeat(3)}to: &packages,
${indent.repeat(3)}packageName: "${packageName}"${args.join('')}
${indent.repeat(2)})`;
}

/**
 * Generates the `packages` property, followed by an empty line. A debug-only package is added with the classes
 * found at runtime, and only when some are found.
 */
function generatePackagesProperty(
  packages: Map<string, PackageExports>,
  debugOnlyPackages: Map<string, PackageExportLookups>
): string {
  if (!debugOnlyPackages.size) {
    return `${indent}public override var packages: [String: ExpoPackage] {
${indent.repeat(2)}return ${formatPackages(packages)}
${indent}}

`;
  }
  const additions = [...debugOnlyPackages]
    .sort(([a], [b]) => comparePackageNames(a, b))
    .map(([packageName, lookups]) => formatDebugOnlyExports(packageName, lookups));
  return `${indent}public override var packages: [String: ExpoPackage] {
${indent.repeat(2)}var packages: [String: ExpoPackage] = ${formatPackages(packages)}
${additions.join('\n')}
${indent.repeat(2)}return packages
${indent}}

${addDebugOnlyExportsFunction}
`;
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
  const entries = sortedPackages.map(([packageName, { modules, sharedObjects, views }]) => {
    // Only the non-empty lists are passed, the others have empty defaults.
    const lists: [string, string[]][] = [
      ['modules', modules.map((module) => module.class)],
      ['sharedObjects', sharedObjects],
      ['views', views],
    ];
    const args = lists
      .filter(([, classNames]) => classNames.length > 0)
      .map(
        ([label, classNames]) =>
          `\n${indent.repeat(4)}${label}: ${formatInlineArrayOfClassNames(classNames)}`
      );
    return `\n${indent.repeat(3)}"${packageName}": ExpoPackage(${args.join(',')}\n${indent.repeat(3)})`;
  });
  return `[${entries.join(',')}\n${indent.repeat(2)}]`;
}

function generateClasses(classNames: string[], debugOnlyModules: ModuleDescriptorIos[]): string {
  return formatReturnOfEntries(
    'subscribers',
    '[ExpoAppDelegateSubscriber.Type]',
    formatArrayOfClassNames(classNames),
    debugOnlyModules.flatMap(({ appDelegateSubscribers, swiftModuleNames }) =>
      appDelegateSubscribers.map((className) => ({
        lookup: formatClassLookup(className, swiftModuleNames, 'ExpoAppDelegateSubscriber.Type'),
        entry: 'found',
      }))
    )
  );
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
  return formatReturnOfEntries(
    'handlers',
    '[ExpoReactDelegateHandlerTupleType]',
    formatArrayOfReactDelegateHandler(module),
    debugOnlyModules.flatMap(({ packageName, reactDelegateHandlers, swiftModuleNames }) =>
      reactDelegateHandlers.map((className) => ({
        lookup: formatClassLookup(className, swiftModuleNames, 'ExpoReactDelegateHandler.Type'),
        entry: `(packageName: "${packageName}", handler: found)`,
      }))
    )
  );
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
