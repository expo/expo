import spawnAsync from '@expo/spawn-async';
import fs from 'fs';
import path from 'path';

import type {
  AppleCodeSignEntitlements,
  ExtraDependencies,
  ModuleDescriptorIos,
  ModuleIosPodspecInfo,
  PackageRevision,
} from '../../types';
import { listFilesInDirectories, fileExistsAsync } from '../../utils';

const APPLE_PROPERTIES_FILE = 'Podfile.properties.json';
const APPLE_EXTRA_BUILD_DEPS_KEY = 'apple.extraPods';

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

/** Resolves module search result with additional details required for iOS platform. */
export async function resolveModuleAsync(
  packageName: string,
  revision: PackageRevision,
  extraOutput: { flags?: Record<string, any> }
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

  return {
    packageName,
    pods,
    swiftModuleNames,
    flags: extraOutput.flags,
    modules: revision.config?.appleModules() ?? [],
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

/**
 * Generates Swift file that contains all autolinked Swift packages.
 */
export async function generateModulesProviderAsync(
  modules: ModuleDescriptorIos[],
  targetPath: string,
  entitlementPath: string | null
): Promise<void> {
  const className = path.basename(targetPath, path.extname(targetPath));
  const entitlements = await parseEntitlementsAsync(entitlementPath);
  const generatedFileContent = await generatePackageListFileContentAsync(
    modules,
    className,
    entitlements
  );
  const parentPath = path.dirname(targetPath);
  await fs.promises.mkdir(parentPath, { recursive: true });
  await fs.promises.writeFile(targetPath, generatedFileContent, 'utf8');
}

/**
 * Generates the string to put into the generated package list.
 */
async function generatePackageListFileContentAsync(
  modules: ModuleDescriptorIos[],
  className: string,
  entitlements: AppleCodeSignEntitlements
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

  const modulesClassNames = ([] as string[])
    .concat(...modulesToImport.map((module) => module.modules))
    .filter(Boolean);

  const debugOnlyModulesClassNames = ([] as string[])
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

import ExpoModulesCore
${generateCommonImportList(swiftModules)}
${generateDebugOnlyImportList(debugOnlySwiftModules)}
@objc(${className})
public class ${className}: ModulesProvider {
  public override func getModuleClasses() -> [AnyModule.Type] {
${generateModuleClasses(modulesClassNames, debugOnlyModulesClassNames)}
  }

  public override func getAppDelegateSubscribers() -> [ExpoAppDelegateSubscriber.Type] {
${generateModuleClasses(appDelegateSubscribers, debugOnlyAppDelegateSubscribers)}
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
  return swiftModules.map((moduleName) => `import ${moduleName}`).join('\n');
}

function generateDebugOnlyImportList(swiftModules: string[]): string {
  if (!swiftModules.length) {
    return '';
  }

  return (
    wrapInDebugConfigurationCheck(
      0,
      swiftModules.map((moduleName) => `import ${moduleName}`).join('\n')
    ) + '\n'
  );
}

function generateModuleClasses(classNames: string[], debugOnlyClassName: string[]): string {
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
