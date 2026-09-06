import spawnAsync from '@expo/spawn-async';
import fs from 'fs';
import path from 'path';

import type { AutolinkingOptions } from '../../commands/autolinkingOptions';
import {
  getIosInlineModulesClassNames,
  isTargetInInlineModulesTargets,
} from '../../inlineModules/iosInlineModules';
import type {
  AppleCodeSignEntitlements,
  ExtraDependencies,
  ModuleDescriptorIos,
  ModuleIosConfig,
  ModuleIosPodspecInfo,
  PackageRevision,
  SearchResults,
} from '../../types';
import { listFilesInDirectories, fileExistsAsync } from '../../utils';
import {
  collectPackageRoots,
  groupScannedModules,
  resolveScannerPlugin,
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
 * Scans all packages' Swift sources for classes annotated with the `@ExpoModule` macro, in one
 * scanner invocation for the whole dependency tree. The scan runs without a platform, so only
 * unconditional module classes are found; a module inside a conditional compilation block is
 * skipped with a warning and needs to be declared in the config instead. Returns the found modules
 * per package name, or null when scanning is unavailable (non-macOS host, or no installed macros
 * plugin with a scanner) so resolution falls back to the modules declared in each
 * `expo-module.config.json`.
 */
export async function scanNativeModulesAsync(
  searchResults: SearchResults
): Promise<Record<string, ModuleIosConfig[]> | null> {
  // The scanner ships as a macOS binary. Resolution on other hosts (e.g. prebuild on CI) quietly
  // skips scanning; the modules provider itself is only ever generated on macOS.
  if (process.platform !== 'darwin') {
    return null;
  }
  // The macros plugin is resolved the way a module's build resolves it: as a dependency of the
  // installed expo-modules-core. No expo-modules-core also means nothing consumes the macro.
  const coreRevision = searchResults['expo-modules-core'];
  if (!coreRevision) {
    return null;
  }
  const pluginInfo = resolveScannerPlugin(coreRevision.path);
  if (!pluginInfo) {
    return null;
  }

  const packageRoots = collectPackageRoots(searchResults);
  const output = await scanExpoModulesAsync(pluginInfo, packageRoots);
  return output ? groupScannedModules(output, packageRoots) : null;
}

/**
 * The modules to put into the generated provider: the declared config list when
 * `expo-module.config.json` declares one at all (declaring the list, even empty, is a full
 * override that opts the package out of scanning, so a class the config deliberately leaves out is
 * never linked), otherwise the scanned `@ExpoModule` classes, in a stable alphabetical order.
 */
function pickModules(
  declaredModules: ModuleIosConfig[] | null,
  scannedModules: ModuleIosConfig[]
): ModuleIosConfig[] {
  if (declaredModules) {
    return declaredModules;
  }
  return [...scannedModules].sort((a, b) => a.class.localeCompare(b.class));
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

  return {
    packageName,
    pods,
    swiftModuleNames,
    flags: extraOutput.flags,
    modules: pickModules(
      revision.config?.declaresAppleModules() ? configModules : null,
      extraOutput.scannedModules?.[packageName] ?? []
    ),
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

  if (isTargetInInlineModulesTargets(params)) {
    modulesClassNames = modulesClassNames.concat(await getIosInlineModulesClassNames(params));
  }

  const debugOnlyModulesClassNames = ([] as ModuleIosConfig[])
    .concat(...debugOnlyModules.map((module) => module.modules))
    .filter(Boolean);

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
  public override func getModuleClasses() -> [ExpoModuleTupleType] {
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
