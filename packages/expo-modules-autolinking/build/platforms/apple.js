"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatArrayOfReactDelegateHandler = exports.generateModulesProviderAsync = exports.resolveExtraBuildDependenciesAsync = exports.resolveModuleAsync = exports.getSwiftModuleNames = void 0;
const spawn_async_1 = __importDefault(require("@expo/spawn-async"));
const fast_glob_1 = __importDefault(require("fast-glob"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const fileUtils_1 = require("../fileUtils");
const APPLE_PROPERTIES_FILE = 'Podfile.properties.json';
const APPLE_EXTRA_BUILD_DEPS_KEY = 'apple.extraPods';
const indent = '  ';
async function findPodspecFiles(revision) {
    const configPodspecPaths = revision.config?.applePodspecPaths();
    if (configPodspecPaths && configPodspecPaths.length) {
        return configPodspecPaths;
    }
    const podspecFiles = await (0, fast_glob_1.default)('*/*.podspec', {
        cwd: revision.path,
        ignore: ['**/node_modules/**'],
    });
    return podspecFiles;
}
function getSwiftModuleNames(pods, swiftModuleNames) {
    if (swiftModuleNames && swiftModuleNames.length) {
        return swiftModuleNames;
    }
    // by default, non-alphanumeric characters in the pod name are replaced by _ in the module name
    return pods.map((pod) => pod.podName.replace(/[^a-zA-Z0-9]/g, '_'));
}
exports.getSwiftModuleNames = getSwiftModuleNames;
/**
 * Resolves module search result with additional details required for iOS platform.
 */
async function resolveModuleAsync(packageName, revision, options) {
    const podspecFiles = await findPodspecFiles(revision);
    if (!podspecFiles.length) {
        return null;
    }
    const pods = podspecFiles.map((podspecFile) => ({
        podName: path_1.default.basename(podspecFile, path_1.default.extname(podspecFile)),
        podspecDir: path_1.default.dirname(path_1.default.join(revision.path, podspecFile)),
    }));
    const swiftModuleNames = getSwiftModuleNames(pods, revision.config?.appleSwiftModuleNames());
    return {
        packageName,
        pods,
        swiftModuleNames,
        flags: options.flags,
        modules: revision.config?.appleModules() ?? [],
        appDelegateSubscribers: revision.config?.appleAppDelegateSubscribers() ?? [],
        reactDelegateHandlers: revision.config?.appleReactDelegateHandlers() ?? [],
        debugOnly: revision.config?.appleDebugOnly() ?? false,
    };
}
exports.resolveModuleAsync = resolveModuleAsync;
async function resolveExtraBuildDependenciesAsync(projectNativeRoot) {
    const propsFile = path_1.default.join(projectNativeRoot, APPLE_PROPERTIES_FILE);
    try {
        const contents = await fs_extra_1.default.readFile(propsFile, 'utf8');
        const podfileJson = JSON.parse(contents);
        if (podfileJson[APPLE_EXTRA_BUILD_DEPS_KEY]) {
            // expo-build-properties would serialize the extraPods as JSON string, we should parse it again.
            const extraPods = JSON.parse(podfileJson[APPLE_EXTRA_BUILD_DEPS_KEY]);
            return extraPods;
        }
    }
    catch { }
    return null;
}
exports.resolveExtraBuildDependenciesAsync = resolveExtraBuildDependenciesAsync;
/**
 * Generates Swift file that contains all autolinked Swift packages.
 */
async function generateModulesProviderAsync(modules, targetPath, entitlementPath) {
    const className = path_1.default.basename(targetPath, path_1.default.extname(targetPath));
    const entitlements = await parseEntitlementsAsync(entitlementPath);
    const generatedFileContent = await generatePackageListFileContentAsync(modules, className, entitlements);
    await fs_extra_1.default.outputFile(targetPath, generatedFileContent);
}
exports.generateModulesProviderAsync = generateModulesProviderAsync;
/**
 * Generates the string to put into the generated package list.
 */
async function generatePackageListFileContentAsync(modules, className, entitlements) {
    const iosModules = modules.filter((module) => module.modules.length ||
        module.appDelegateSubscribers.length ||
        module.reactDelegateHandlers.length);
    const modulesToImport = iosModules.filter((module) => !module.debugOnly);
    const debugOnlyModules = iosModules.filter((module) => module.debugOnly);
    const swiftModules = []
        .concat(...modulesToImport.map((module) => module.swiftModuleNames))
        .filter(Boolean);
    const debugOnlySwiftModules = []
        .concat(...debugOnlyModules.map((module) => module.swiftModuleNames))
        .filter(Boolean);
    const modulesClassNames = []
        .concat(...modulesToImport.map((module) => module.modules))
        .filter(Boolean);
    const debugOnlyModulesClassNames = []
        .concat(...debugOnlyModules.map((module) => module.modules))
        .filter(Boolean);
    const appDelegateSubscribers = [].concat(...modulesToImport.map((module) => module.appDelegateSubscribers));
    const debugOnlyAppDelegateSubscribers = [].concat(...debugOnlyModules.map((module) => module.appDelegateSubscribers));
    const reactDelegateHandlerModules = modulesToImport.filter((module) => !!module.reactDelegateHandlers.length);
    const debugOnlyReactDelegateHandlerModules = debugOnlyModules.filter((module) => !!module.reactDelegateHandlers.length);
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
function generateCommonImportList(swiftModules) {
    return swiftModules.map((moduleName) => `import ${moduleName}`).join('\n');
}
function generateDebugOnlyImportList(swiftModules) {
    if (!swiftModules.length) {
        return '';
    }
    return (wrapInDebugConfigurationCheck(0, swiftModules.map((moduleName) => `import ${moduleName}`).join('\n')) + '\n');
}
function generateModuleClasses(classNames, debugOnlyClassName) {
    const commonClassNames = formatArrayOfClassNames(classNames);
    if (debugOnlyClassName.length > 0) {
        return wrapInDebugConfigurationCheck(2, `return ${formatArrayOfClassNames(classNames.concat(debugOnlyClassName))}`, `return ${commonClassNames}`);
    }
    else {
        return `${indent.repeat(2)}return ${commonClassNames}`;
    }
}
/**
 * Formats an array of class names to Swift's array containing these classes.
 */
function formatArrayOfClassNames(classNames) {
    return `[${classNames.map((className) => `\n${indent.repeat(3)}${className}.self`).join(',')}
${indent.repeat(2)}]`;
}
function generateReactDelegateHandlers(module, debugOnlyModules) {
    const commonModules = formatArrayOfReactDelegateHandler(module);
    if (debugOnlyModules.length > 0) {
        return wrapInDebugConfigurationCheck(2, `return ${formatArrayOfReactDelegateHandler(module.concat(debugOnlyModules))}`, `return ${commonModules}`);
    }
    else {
        return `${indent.repeat(2)}return ${commonModules}`;
    }
}
/**
 * Formats an array of modules to Swift's array containing ReactDelegateHandlers
 */
function formatArrayOfReactDelegateHandler(modules) {
    const values = [];
    for (const module of modules) {
        for (const handler of module.reactDelegateHandlers) {
            values.push(`(packageName: "${module.packageName}", handler: ${handler}.self)`);
        }
    }
    return `[${values.map((value) => `\n${indent.repeat(3)}${value}`).join(',')}
${indent.repeat(2)}]`;
}
exports.formatArrayOfReactDelegateHandler = formatArrayOfReactDelegateHandler;
function wrapInDebugConfigurationCheck(indentationLevel, debugBlock, releaseBlock = null) {
    if (releaseBlock) {
        return `${indent.repeat(indentationLevel)}#if EXPO_CONFIGURATION_DEBUG\n${indent.repeat(indentationLevel)}${debugBlock}\n${indent.repeat(indentationLevel)}#else\n${indent.repeat(indentationLevel)}${releaseBlock}\n${indent.repeat(indentationLevel)}#endif`;
    }
    return `${indent.repeat(indentationLevel)}#if EXPO_CONFIGURATION_DEBUG\n${indent.repeat(indentationLevel)}${debugBlock}\n${indent.repeat(indentationLevel)}#endif`;
}
async function parseEntitlementsAsync(entitlementPath) {
    if (!(await (0, fileUtils_1.fileExistsAsync)(entitlementPath))) {
        return {};
    }
    const { stdout } = await (0, spawn_async_1.default)('plutil', ['-convert', 'json', '-o', '-', entitlementPath]);
    const entitlementsJson = JSON.parse(stdout);
    return {
        appGroups: entitlementsJson['com.apple.security.application-groups'] || undefined,
    };
}
//# sourceMappingURL=apple.js.map